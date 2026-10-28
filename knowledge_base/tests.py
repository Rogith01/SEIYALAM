from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import resolve
from rest_framework.test import APIClient

from companies.models import Company
from knowledge_base.models import (
    CompanyDocument,
    DocumentChunk,
    KnowledgeConversation,
    KnowledgeChatMessage,
)
from knowledge_base.retrieval import retrieve_relevant_chunks
from knowledge_base.semantic_retrieval import retrieve_semantic_chunks

User = get_user_model()

class KnowledgeRetrieveAPITests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.company_a = Company.objects.create(
            name="Knowledge Test Company A",
            phone="9100000001",
        )
        cls.company_b = Company.objects.create(
            name="Knowledge Test Company B",
            phone="9100000002",
        )

        cls.founder = User.objects.create_user(
            username="kb_test_founder",
            password="TestPassword-Phase1!",
            role="FOUNDER",
        )
        cls.admin_a = User.objects.create_user(
            username="kb_test_admin_a",
            password="TestPassword-Phase1!",
            role="ADMIN",
            company=cls.company_a,
        )
        cls.admin_b = User.objects.create_user(
            username="kb_test_admin_b",
            password="TestPassword-Phase1!",
            role="ADMIN",
            company=cls.company_b,
        )

        cls.document_a = CompanyDocument.objects.create(
            company=cls.company_a,
            uploaded_by=cls.founder,
            title="Company A Service Manual",
            description="Test document",
            original_filename="company-a.pdf",
            status=CompanyDocument.Status.READY,
            extracted_text=(
                "Company A repair procedures and maintenance guide."
            ),
        )
        cls.document_b = CompanyDocument.objects.create(
            company=cls.company_b,
            uploaded_by=cls.founder,
            title="Company B Service Manual",
            description="Test document",
            original_filename="company-b.pdf",
            status=CompanyDocument.Status.READY,
            extracted_text=(
                "Company B repair procedures and maintenance guide."
            ),
        )

        DocumentChunk.objects.create(
            company=cls.company_a,
            document=cls.document_a,
            chunk_index=0,
            text="Company A repair procedures and maintenance guide.",
        )
        DocumentChunk.objects.create(
            company=cls.company_b,
            document=cls.document_b,
            chunk_index=0,
            text="Company B repair procedures and maintenance guide.",
        )

    def setUp(self):
        self.client = APIClient()
        self.url = "/api/knowledge/retrieve/"

    def test_unauthenticated_request_is_rejected(self):
        response = self.client.post(
            self.url,
            {
                "query": "repair procedures",
                "company_id": self.company_a.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_founder_can_retrieve_selected_company_chunks(self):
        self.client.force_authenticate(user=self.founder)

        response = self.client.post(
            self.url,
            {
                "query": "repair procedures",
                "company_id": self.company_a.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.data["count"], 1)
        self.assertTrue(
            all(
                item["company_id"] == self.company_a.id
                for item in response.data["results"]
            )
        )

    def test_admin_can_retrieve_own_company_chunks(self):
        self.client.force_authenticate(user=self.admin_a)

        response = self.client.post(
            self.url,
            {"query": "repair procedures"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.data["count"], 1)
        self.assertTrue(
            all(
                item["company_id"] == self.company_a.id
                for item in response.data["results"]
            )
        )

    def test_admin_cannot_retrieve_another_company(self):
        self.client.force_authenticate(user=self.admin_a)

        response = self.client.post(
            self.url,
            {
                "query": "repair procedures",
                "company_id": self.company_b.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_founder_must_supply_company_id(self):
        self.client.force_authenticate(user=self.founder)

        response = self.client.post(
            self.url,
            {"query": "repair procedures"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_invalid_company_id_is_rejected(self):
        self.client.force_authenticate(user=self.founder)

        response = self.client.post(
            self.url,
            {
                "query": "repair procedures",
                "company_id": "not-a-number",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_short_query_is_rejected(self):
        self.client.force_authenticate(user=self.admin_a)

        response = self.client.post(
            self.url,
            {"query": "a"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_retrieval_does_not_return_another_company_chunk(self):
        self.client.force_authenticate(user=self.admin_a)

        response = self.client.post(
            self.url,
            {"query": "maintenance guide"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        returned_company_ids = {
            item["company_id"] for item in response.data["results"]
        }
        self.assertNotIn(self.company_b.id, returned_company_ids)

    def test_existing_knowledge_routes_are_registered(self):
        from django.urls import resolve

        self.assertEqual(
            resolve("/api/knowledge/retrieve/").url_name,
            "knowledge-retrieve",
        )
        self.assertEqual(
            resolve("/api/knowledge/search/").url_name,
            "knowledge-document-search",
        )
        self.assertEqual(
            resolve("/api/knowledge/documents/").url_name,
            "knowledge-document-list-create",
        )

    @patch("knowledge_base.views.retrieve_semantic_chunks")
    def test_semantic_retrieval_mode_calls_semantic_retriever(
        self, mock_retrieve
    ):
        mock_retrieve.return_value = [
            {
                "chunk_id": 1,
                "document_id": self.document_a.id,
                "title": "Company A Service Manual",
                "company_id": self.company_a.id,
                "chunk_index": 0,
                "score": 0.8,
                "text": "Reset your password in account settings.",
            }
        ]

        self.client.force_authenticate(user=self.admin_a)

        response = self.client.post(
            self.url,
            {
                "query": "I forgot my login credentials",
                "retrieval_mode": "semantic",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["company_id"], self.company_a.id)
        mock_retrieve.assert_called_once_with(
            "I forgot my login credentials",
            self.company_a.id,
        )

    def test_invalid_retrieval_mode_returns_400(self):
        self.client.force_authenticate(user=self.admin_a)

        response = self.client.post(
            self.url,
            {
                "query": "password reset",
                "retrieval_mode": "unknown",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("retrieval_mode", response.data)


class KnowledgeRetrievalQualityTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.company = Company.objects.create(
            name="Retrieval Quality Test Company",
            phone="9100000003",
        )

        cls.user = User.objects.create_user(
            username="kb_quality_founder",
            password="TestPassword-Phase1!",
            role="FOUNDER",
        )

        cls.document = CompanyDocument.objects.create(
            company=cls.company,
            uploaded_by=cls.user,
            title="Retrieval Quality Manual",
            description="Test document for ranking",
            original_filename="quality-manual.pdf",
            status=CompanyDocument.Status.READY,
            extracted_text=(
                "Employee onboarding, staff training, and workplace safety."
            ),
        )

        DocumentChunk.objects.create(
            company=cls.company,
            document=cls.document,
            chunk_index=0,
            text=(
                "Employee onboarding includes staff training, "
                "workplace safety, and training procedures."
            ),
        )

        DocumentChunk.objects.create(
            company=cls.company,
            document=cls.document,
            chunk_index=1,
            text="Employee onboarding information for new staff.",
        )

        DocumentChunk.objects.create(
            company=cls.company,
            document=cls.document,
            chunk_index=2,
            text="Invoice totals, billing receipts, and payment methods.",
        )

    def test_more_keyword_matches_rank_higher(self):
        results = retrieve_relevant_chunks(
            "employee training workplace safety",
            self.company.id,
        )

        self.assertGreaterEqual(len(results), 2)
        self.assertEqual(results[0]["chunk_index"], 0)
        self.assertGreater(
            results[0]["score"],
            results[1]["score"],
        )

    def test_common_words_only_return_no_results(self):
        results = retrieve_relevant_chunks(
            "what is the and",
            self.company.id,
        )

        self.assertEqual(results, [])

    def test_unrelated_query_returns_no_results(self):
        results = retrieve_relevant_chunks(
            "quantum astronomy",
            self.company.id,
        )

        self.assertEqual(results, [])

    def test_result_limit_is_respected(self):
        results = retrieve_relevant_chunks(
            "employee staff",
            self.company.id,
            limit=1,
        )

        self.assertEqual(len(results), 1)

    def test_invalid_limit_uses_default(self):
        results = retrieve_relevant_chunks(
            "employee staff",
            self.company.id,
            limit="invalid",
        )

        self.assertLessEqual(len(results), 5)

    def test_missing_company_returns_no_results(self):
        results = retrieve_relevant_chunks(
            "employee training",
            None,
        )

        self.assertEqual(results, [])


class SemanticRetrievalTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.company = Company.objects.create(
            name="Semantic Test Company",
            phone="9000000101",
        )
        cls.other_company = Company.objects.create(
            name="Other Semantic Company",
            phone="9000000102",
        )

        cls.user = User.objects.create_user(
            username="semantic_admin",
            password="test-password-123",
            role="ADMIN",
            company=cls.company,
        )

        cls.document = CompanyDocument.objects.create(
            company=cls.company,
            uploaded_by=cls.user,
            title="Password Guide",
            original_filename="password-guide.pdf",
            status=CompanyDocument.Status.READY,
            extracted_text="Password reset instructions.",
        )

        # Use a Founder uploader for the other company's document.
        cls.founder = User.objects.create_user(
            username="semantic_founder",
            password="test-password-456",
            role="FOUNDER",
        )

        cls.other_document = CompanyDocument.objects.create(
            company=cls.other_company,
            uploaded_by=cls.founder,
            title="Other Company Guide",
            original_filename="other-guide.pdf",
            status=CompanyDocument.Status.READY,
            extracted_text="Other company's private information.",
        )

        cls.chunk = DocumentChunk.objects.create(
            company=cls.company,
            document=cls.document,
            chunk_index=0,
            text="Open account settings to reset your password.",
        )

        cls.other_chunk = DocumentChunk.objects.create(
            company=cls.other_company,
            document=cls.other_document,
            chunk_index=0,
            text="Private instructions for another company.",
        )

    @patch("knowledge_base.semantic_retrieval._get_embedding_model")
    def test_returns_semantically_ranked_results(self, mock_get_model):
        import torch

        mock_model = mock_get_model.return_value
        mock_model.encode.side_effect = [
            torch.tensor([1.0, 0.0]),
            torch.tensor([[0.8, 0.6]]),
        ]

        results = retrieve_semantic_chunks(
            "I forgot my login",
            self.company.id,
        )

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["chunk_id"], self.chunk.id)
        self.assertEqual(results[0]["title"], "Password Guide")
        self.assertAlmostEqual(results[0]["score"], 0.8, places=4)

    @patch("knowledge_base.semantic_retrieval._get_embedding_model")
    def test_never_returns_another_company_chunk(self, mock_get_model):
        import torch

        mock_model = mock_get_model.return_value
        mock_model.encode.side_effect = [
            torch.tensor([1.0, 0.0]),
            torch.tensor([[1.0, 0.0]]),
        ]

        results = retrieve_semantic_chunks(
            "private information",
            self.company.id,
        )

        result_ids = [item["chunk_id"] for item in results]

        self.assertIn(self.chunk.id, result_ids)
        self.assertNotIn(self.other_chunk.id, result_ids)

    def test_missing_company_returns_no_results(self):
        self.assertEqual(
            retrieve_semantic_chunks("password reset", None),
            [],
        )

    def test_short_query_returns_no_results(self):
        self.assertEqual(
            retrieve_semantic_chunks(" ", self.company.id),
            [],
        )

    def test_invalid_limit_uses_default(self):
        with patch(
            "knowledge_base.semantic_retrieval._get_embedding_model"
        ) as mock_get_model:
            import torch

            mock_model = mock_get_model.return_value
            mock_model.encode.side_effect = [
                torch.tensor([1.0, 0.0]),
                torch.tensor([[1.0, 0.0]]),
            ]

            results = retrieve_semantic_chunks(
                "password reset",
                self.company.id,
                limit="invalid",
            )

        self.assertEqual(len(results), 1)

    def test_no_ready_chunks_returns_no_results(self):
        CompanyDocument.objects.filter(
            pk=self.document.pk
        ).update(status=CompanyDocument.Status.FAILED)

        self.assertEqual(
            retrieve_semantic_chunks("password reset", self.company.id),
            [],
        )



class KnowledgeChatAPITests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.company_a = Company.objects.create(
            name="Chat Test Company A",
            phone="9100000011",
        )
        cls.company_b = Company.objects.create(
            name="Chat Test Company B",
            phone="9100000012",
        )

        cls.founder = User.objects.create_user(
            username="chat_test_founder",
            password="TestPassword-Chat!",
            role="FOUNDER",
        )
        cls.admin_a = User.objects.create_user(
            username="chat_test_admin_a",
            password="TestPassword-Chat!",
            role="ADMIN",
            company=cls.company_a,
        )
        cls.admin_b = User.objects.create_user(
            username="chat_test_admin_b",
            password="TestPassword-Chat!",
            role="ADMIN",
            company=cls.company_b,
        )
        cls.worker = User.objects.create_user(
            username="chat_test_worker",
            password="TestPassword-Chat!",
            role="WORKER",
            company=cls.company_a,
        )

        cls.document_a = CompanyDocument.objects.create(
            company=cls.company_a,
            uploaded_by=cls.founder,
            title="Company A Chat Manual",
            original_filename="company-a-chat.pdf",
            status=CompanyDocument.Status.READY,
            extracted_text="Company A uses procedure Alpha for repairs.",
        )
        cls.document_b = CompanyDocument.objects.create(
            company=cls.company_b,
            uploaded_by=cls.founder,
            title="Company B Chat Manual",
            original_filename="company-b-chat.pdf",
            status=CompanyDocument.Status.READY,
            extracted_text="Company B uses procedure Beta for repairs.",
        )

        cls.chunk_a = DocumentChunk.objects.create(
            company=cls.company_a,
            document=cls.document_a,
            chunk_index=0,
            text="Company A uses procedure Alpha for repairs.",
        )
        cls.chunk_b = DocumentChunk.objects.create(
            company=cls.company_b,
            document=cls.document_b,
            chunk_index=0,
            text="Company B uses procedure Beta for repairs.",
        )

    def setUp(self):
        self.client = APIClient()
        self.url = "/api/knowledge/chat/"

    @patch("knowledge_base.chat_views.generate_rag_answer")
    def test_admin_can_chat_with_own_company_documents(self, mock_answer):
        mock_answer.return_value = {
            "answer": "Use procedure Alpha. [Source 1]",
            "used_ai": True,
            "sources": [
                {
                    "source_id": 1,
                    "document_id": self.document_a.id,
                    "title": "Company A Chat Manual",
                    "chunk_index": 0,
                    "text": self.chunk_a.text,
                }
            ],
        }

        self.client.force_authenticate(user=self.admin_a)

        response = self.client.post(
            self.url,
            {"question": "How are repairs handled?"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["company_id"],
            self.company_a.id,
        )
        self.assertEqual(
            response.data["answer"],
            "Use procedure Alpha. [Source 1]",
        )
        self.assertTrue(response.data["used_ai"])
        self.assertEqual(len(response.data["sources"]), 1)

        mock_answer.assert_called_once()

        chunks = mock_answer.call_args.kwargs["chunks"]

        self.assertTrue(
            all(
                chunk["company_id"] == self.company_a.id
                for chunk in chunks
            )
        )

    @patch("knowledge_base.chat_views.generate_rag_answer")
    def test_admin_chat_passes_live_business_statistics(self, mock_answer):
        mock_answer.return_value = {
            "answer": "There are 10 active work orders.",
            "used_ai": True,
            "sources": [],
        }

        self.client.force_authenticate(user=self.admin_a)

        response = self.client.post(
            self.url,
            {
                "question": "How many work orders are currently active?",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["company_id"],
            self.company_a.id,
        )

        mock_answer.assert_called_once()

        chunks = mock_answer.call_args.kwargs["chunks"]

        live_contexts = [
            chunk
            for chunk in chunks
            if (
                isinstance(chunk, dict)
                and chunk.get("metadata", {}).get("type")
                == "live_business_statistics"
            )
        ]

        self.assertEqual(
            len(live_contexts),
            1,
            "Expected exactly one live business statistics context.",
        )

        live_context = live_contexts[0]["content"]

        self.assertIn(
            "LIVE BUSINESS INTELLIGENCE DATA",
            live_context,
        )
        self.assertIn('"company_id":', live_context)
        self.assertIn('"active":', live_context)

    @patch("knowledge_base.chat_views.generate_rag_answer")
    def test_admin_cannot_chat_with_another_company(self, mock_answer):
        self.client.force_authenticate(user=self.admin_a)

        response = self.client.post(
            self.url,
            {
                "question": "Tell me about repairs",
                "company_id": self.company_b.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        mock_answer.assert_not_called()

    @patch("knowledge_base.chat_views.generate_rag_answer")
    def test_founder_must_select_a_company(self, mock_answer):
        self.client.force_authenticate(user=self.founder)

        response = self.client.post(
            self.url,
            {"question": "How are repairs handled?"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        mock_answer.assert_not_called()

    @patch("knowledge_base.chat_views.generate_rag_answer")
    def test_founder_can_select_a_valid_company(self, mock_answer):
        mock_answer.return_value = {
            "answer": "Procedure Beta is used. [Source 1]",
            "used_ai": True,
            "sources": [],
        }

        self.client.force_authenticate(user=self.founder)

        response = self.client.post(
            self.url,
            {
                "question": "How are repairs handled?",
                "company_id": self.company_b.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["company_id"],
            self.company_b.id,
        )

        mock_answer.assert_called_once()

        self.assertTrue(
            all(
                chunk["company_id"] == self.company_b.id
                for chunk in mock_answer.call_args.kwargs["chunks"]
            )
        )

    @patch("knowledge_base.chat_views.generate_rag_answer")
    def test_worker_cannot_use_company_knowledge_chat(self, mock_answer):
        self.client.force_authenticate(user=self.worker)

        response = self.client.post(
            self.url,
            {"question": "How are repairs handled?"},
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        mock_answer.assert_not_called()

    @patch("knowledge_base.chat_views.generate_rag_answer")
    def test_unauthenticated_chat_is_rejected(self, mock_answer):
        response = self.client.post(
            self.url,
            {"question": "How are repairs handled?"},
            format="json",
        )

        self.assertEqual(response.status_code, 401)
        mock_answer.assert_not_called()

    @patch("knowledge_base.chat_views.generate_rag_answer")
    def test_invalid_question_is_rejected(self, mock_answer):
        self.client.force_authenticate(user=self.admin_a)

        response = self.client.post(
            self.url,
            {"question": "x"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        mock_answer.assert_not_called()

    @patch("knowledge_base.chat_views.generate_rag_answer")
    def test_gemini_service_error_returns_safe_service_error(self, mock_answer):
        from knowledge_base.gemini_service import GeminiServiceError

        mock_answer.side_effect = GeminiServiceError(
            "The AI service is busy or its usage limit was reached. Please try again later."
        )

        self.client.force_authenticate(user=self.admin_a)

        response = self.client.post(
            self.url,
            {"question": "How are repairs handled?"},
            format="json",
        )

        self.assertEqual(response.status_code, 503)
        self.assertIn("detail", response.data)

    def test_chat_route_is_registered(self):
        self.assertEqual(
            resolve(self.url).url_name,
            "knowledge-chat",
        )

    @patch("knowledge_base.chat_views.generate_rag_answer")
    def test_chat_saves_question_answer_and_sources(self, mock_answer):
        mock_answer.return_value = {
            "answer": "Use procedure Alpha. [Source 1]",
            "used_ai": True,
            "sources": [
                {
                    "source_id": 1,
                    "document_id": self.document_a.id,
                    "title": self.document_a.title,
                    "chunk_index": 0,
                    "text": self.chunk_a.text,
                }
            ],
        }

        self.client.force_authenticate(user=self.admin_a)

        response = self.client.post(
            self.url,
            {"question": "How are repairs handled?"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("conversation_id", response.data)

        conversation = KnowledgeConversation.objects.get(
            pk=response.data["conversation_id"]
        )

        self.assertEqual(conversation.user, self.admin_a)
        self.assertEqual(
            conversation.company_id,
            self.company_a.id,
        )

        messages = list(
            conversation.messages.order_by("created_at", "id")
        )

        self.assertEqual(len(messages), 2)
        self.assertEqual(messages[0].role, "user")
        self.assertEqual(
            messages[0].content,
            "How are repairs handled?",
        )
        self.assertEqual(messages[1].role, "assistant")
        self.assertEqual(
            messages[1].content,
            "Use procedure Alpha. [Source 1]",
        )
        self.assertEqual(
            messages[1].sources,
            response.data["sources"],
        )

    @patch("knowledge_base.chat_views.generate_rag_answer")
    def test_user_can_reload_conversation_history(self, mock_answer):
        self.client.force_authenticate(user=self.admin_a)

        conversation = KnowledgeConversation.objects.create(
            user=self.admin_a,
            company=self.company_a,
            title="Repair questions",
        )

        KnowledgeChatMessage.objects.create(
            conversation=conversation,
            role="user",
            content="How are repairs handled?",
        )

        KnowledgeChatMessage.objects.create(
            conversation=conversation,
            role="assistant",
            content="Use procedure Alpha.",
            sources=[
                {
                    "source_id": 1,
                    "title": "Company A Chat Manual",
                }
            ],
        )

        response = self.client.post(
            self.url,
            {
                "action": "history",
                "conversation_id": conversation.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["conversation_id"],
            conversation.id,
        )
        self.assertEqual(len(response.data["messages"]), 2)

        self.assertEqual(
            response.data["messages"][1]["sources"][0]["title"],
            "Company A Chat Manual",
        )

        mock_answer.assert_not_called()

    @patch("knowledge_base.chat_views.generate_rag_answer")
    def test_user_cannot_open_another_users_conversation(self, mock_answer):
        self.client.force_authenticate(user=self.admin_b)

        conversation = KnowledgeConversation.objects.create(
            user=self.admin_a,
            company=self.company_a,
            title="Private conversation",
        )

        response = self.client.post(
            self.url,
            {
                "action": "history",
                "company_id": self.company_a.id,
                "conversation_id": conversation.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        mock_answer.assert_not_called()

    @patch("knowledge_base.chat_views.generate_rag_answer")
    def test_list_only_returns_callers_conversations(self, mock_answer):
        self.client.force_authenticate(user=self.admin_a)

        own_conversation = KnowledgeConversation.objects.create(
            user=self.admin_a,
            company=self.company_a,
            title="My conversation",
        )

        KnowledgeConversation.objects.create(
            user=self.admin_b,
            company=self.company_b,
            title="Other user's conversation",
        )

        response = self.client.post(
            self.url,
            {"action": "list"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            [item["id"] for item in response.data["conversations"]],
            [own_conversation.id],
        )

        mock_answer.assert_not_called()
