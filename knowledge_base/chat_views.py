
from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import generics, serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from companies.models import Company

from .gemini_service import (
    GeminiServiceError,
    generate_rag_answer,
)
from .models import KnowledgeConversation, KnowledgeChatMessage
from .permissions import IsCompanyKnowledgeAdmin
from .retrieval import retrieve_relevant_chunks
from .semantic_retrieval import retrieve_semantic_chunks


class KnowledgeChatSerializer(serializers.Serializer):
    question = serializers.CharField(
        min_length=2,
        max_length=4000,
        trim_whitespace=True,
        required=False,
    )
    company_id = serializers.IntegerField(
        required=False,
        min_value=1,
    )
    conversation_id = serializers.IntegerField(
        required=False,
        min_value=1,
    )
    action = serializers.ChoiceField(
        choices=("chat", "history", "list", "new"),
        default="chat",
        required=False,
    )
    retrieval_mode = serializers.ChoiceField(
        choices=("keyword", "semantic"),
        default="keyword",
        required=False,
    )

    def validate(self, attrs):
        action = attrs.get("action", "chat")

        if action == "chat" and not attrs.get("question", "").strip():
            raise serializers.ValidationError({
                "question": "A question is required to send a chat message."
            })

        if action == "history" and not attrs.get("conversation_id"):
            raise serializers.ValidationError({
                "conversation_id": "A conversation ID is required."
            })

        return attrs


class KnowledgeChatView(generics.GenericAPIView):
    permission_classes = [
        IsAuthenticated,
        IsCompanyKnowledgeAdmin,
    ]
    serializer_class = KnowledgeChatSerializer

    def _get_company_id(self, user, requested_company_id):
        if user.role == "ADMIN":
            if not user.company_id:
                return None, Response(
                    {"detail": "Your account is not linked to a company."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if (
                requested_company_id is not None
                and requested_company_id != user.company_id
            ):
                return None, Response(
                    {"detail": "You cannot access another company's documents."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            return user.company_id, None

        if user.role == "FOUNDER":
            if requested_company_id is None:
                return None, Response(
                    {"company_id": "Select a company to continue."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not Company.objects.filter(pk=requested_company_id).exists():
                return None, Response(
                    {"company_id": "Select a valid company."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            return requested_company_id, None

        return None, Response(
            {"detail": "You cannot access company knowledge."},
            status=status.HTTP_403_FORBIDDEN,
        )

    def _conversation_queryset(self, user, company_id):
        return KnowledgeConversation.objects.filter(
            user=user,
            company_id=company_id,
        )

    def _serialize_message(self, message):
        return {
            "id": message.id,
            "role": message.role,
            "content": message.content,
            "sources": message.sources,
            "created_at": message.created_at.isoformat(),
        }

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = request.user
        company_id, error_response = self._get_company_id(
            user,
            data.get("company_id"),
        )
        if error_response:
            return error_response

        action = data.get("action", "chat")

        # List conversations belonging only to this user and company.
        if action == "list":
            conversations = self._conversation_queryset(
                user, company_id
            ).order_by("-updated_at")

            return Response({
                "company_id": company_id,
                "conversations": [
                    {
                        "id": item.id,
                        "title": item.title,
                        "created_at": item.created_at.isoformat(),
                        "updated_at": item.updated_at.isoformat(),
                    }
                    for item in conversations[:100]
                ],
            })

        # Create a new, empty conversation.
        if action == "new":
            conversation = KnowledgeConversation.objects.create(
                user=user,
                company_id=company_id,
                title="New conversation",
            )
            return Response(
                {
                    "conversation_id": conversation.id,
                    "company_id": company_id,
                    "title": conversation.title,
                    "messages": [],
                },
                status=status.HTTP_201_CREATED,
            )

        conversation_id = data.get("conversation_id")
        conversation = None

        if conversation_id is not None:
            conversation = get_object_or_404(
                self._conversation_queryset(user, company_id),
                pk=conversation_id,
            )

        # Load history without invoking retrieval or Gemini.
        if action == "history":
            messages = conversation.messages.all()
            return Response({
                "conversation_id": conversation.id,
                "company_id": company_id,
                "title": conversation.title,
                "messages": [
                    self._serialize_message(message)
                    for message in messages
                ],
            })

        question = data["question"].strip()
        mode = data.get("retrieval_mode", "keyword")

        try:
            if mode == "semantic":
                chunks = retrieve_semantic_chunks(
                    question,
                    company_id,
                    limit=5,
                )
            else:
                chunks = retrieve_relevant_chunks(
                    question,
                    company_id,
                    limit=5,
                )

            # Use server-stored history, never client-supplied history.
            history = []
            if conversation is not None:
                stored_messages = list(
                    conversation.messages.order_by("-created_at", "-id")[:6]
                )
                stored_messages.reverse()
                history = [
                    {
                        "role": message.role,
                        "content": message.content[:2000],
                    }
                    for message in stored_messages
                ]

                # Gemini requires alternating user/model turns.
                # The new question is appended by the service, so history
                # must end with an assistant turn.
                while history and history[-1]["role"] != "assistant":
                    history.pop()

                # Keep a valid alternating sequence.
                normalized_history = []
                for message in history:
                    if (
                        not normalized_history
                        or normalized_history[-1]["role"] != message["role"]
                    ):
                        normalized_history.append(message)
                history = normalized_history

            result = generate_rag_answer(
                question=question,
                chunks=chunks,
                history=history,
            )

        except GeminiServiceError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception:
            return Response(
                {
                    "detail": (
                        "The knowledge assistant could not process this request."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        answer = result["answer"]
        sources = result.get("sources", [])

        # Save the question and answer together after generation succeeds.
        try:
            with transaction.atomic():
                if conversation is None:
                    title = question[:80].strip() or "New conversation"
                    conversation = KnowledgeConversation.objects.create(
                        user=user,
                        company_id=company_id,
                        title=title,
                    )

                KnowledgeChatMessage.objects.create(
                    conversation=conversation,
                    role=KnowledgeChatMessage.Role.USER,
                    content=question,
                )
                KnowledgeChatMessage.objects.create(
                    conversation=conversation,
                    role=KnowledgeChatMessage.Role.ASSISTANT,
                    content=answer,
                    sources=sources,
                )

                if conversation.title == "New conversation":
                    conversation.title = question[:80]
                conversation.save(update_fields=["title", "updated_at"])

        except Exception:
            return Response(
                {
                    "detail": (
                        "The answer was generated, but the conversation "
                        "could not be saved. Please try again."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "conversation_id": conversation.id,
                "question": question,
                "company_id": company_id,
                "answer": answer,
                "used_ai": result["used_ai"],
                "sources": sources,
            },
            status=status.HTTP_200_OK,
        )
