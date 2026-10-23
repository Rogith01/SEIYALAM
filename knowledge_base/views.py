
import os

from django.db import transaction
from pypdf import PdfReader
from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from companies.models import Company, PlatformSettings

from .chunking import split_text_into_chunks
from .models import CompanyDocument, DocumentChunk
from .permissions import IsCompanyKnowledgeAdmin
from .serializers import CompanyDocumentSerializer
from .retrieval import retrieve_relevant_chunks
from .semantic_retrieval import retrieve_semantic_chunks

class CompanyDocumentListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/knowledge/documents/ - list accessible documents
    POST /api/knowledge/documents/ - upload and process a PDF
    """

    serializer_class = CompanyDocumentSerializer
    permission_classes = [IsAuthenticated, IsCompanyKnowledgeAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            if not user.company_id:
                return CompanyDocument.objects.none()

            return CompanyDocument.objects.filter(
                company_id=user.company_id
            ).select_related("company", "uploaded_by")

        if user.role == "FOUNDER":
            company_id = self.request.query_params.get("company_id")

            if not company_id or not company_id.isdigit():
                return CompanyDocument.objects.none()

            return CompanyDocument.objects.filter(
                company_id=int(company_id)
            ).select_related("company", "uploaded_by")

        return CompanyDocument.objects.none()

    def create(self, request, *args, **kwargs):
        user = request.user

        if user.role == "ADMIN":
            if not user.company_id:
                return Response(
                    {"detail": "Your account is not linked to a company."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            company = user.company

        elif user.role == "FOUNDER":
            company_id = request.data.get("company_id")

            if not company_id:
                return Response(
                    {"company_id": "This field is required for a founder."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                company = Company.objects.get(pk=int(company_id))
            except (Company.DoesNotExist, TypeError, ValueError):
                return Response(
                    {"company_id": "Select a valid company."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        else:
            return Response(
                {"detail": "You cannot upload company documents."},
                status=status.HTTP_403_FORBIDDEN,
            )

        uploaded_file = request.FILES.get("file")

        if uploaded_file is None:
            return Response(
                {"file": "Please attach a PDF file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            max_size_mb = (
                PlatformSettings.get_settings().max_upload_size_mb
            )
        except Exception:
            max_size_mb = 10

        if uploaded_file.size > max_size_mb * 1024 * 1024:
            return Response(
                {
                    "file": (
                        "File exceeds the maximum upload size "
                        f"of {max_size_mb} MB."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if os.path.splitext(uploaded_file.name)[1].lower() != ".pdf":
            return Response(
                {"file": "Only PDF files are supported."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        document = serializer.save(
            company=company,
            uploaded_by=user,
            original_filename=os.path.basename(uploaded_file.name),
            status=CompanyDocument.Status.PROCESSING,
        )

        try:
            document.file.open("rb")

            try:
                reader = PdfReader(document.file)

                if reader.is_encrypted:
                    raise ValueError(
                        "Password-protected PDFs are not supported."
                    )

                extracted_text = "\n".join(
                    page.extract_text() or ""
                    for page in reader.pages
                ).strip()

            finally:
                document.file.close()

            if not extracted_text:
                document.status = CompanyDocument.Status.FAILED
                document.processing_error = (
                    "No extractable text found. The PDF may be scanned "
                    "or contain only images; OCR is not implemented yet."
                )
            else:
                chunks = split_text_into_chunks(extracted_text)

                # Save the extracted text and its chunks together.
                with transaction.atomic():
                    document.extracted_text = extracted_text
                    document.status = CompanyDocument.Status.READY
                    document.processing_error = ""

                    document.save(
                        update_fields=[
                            "extracted_text",
                            "status",
                            "processing_error",
                            "updated_at",
                        ]
                    )

                    # Replace existing chunks if the document is
                    # processed again.
                    DocumentChunk.objects.filter(
                        document=document
                    ).delete()

                    DocumentChunk.objects.bulk_create(
                        [
                            DocumentChunk(
                                company_id=document.company_id,
                                document=document,
                                chunk_index=index,
                                text=chunk,
                            )
                            for index, chunk in enumerate(chunks)
                        ]
                    )

                return Response(
                    self.get_serializer(document).data,
                    status=status.HTTP_201_CREATED,
                )

        except Exception:
            document.status = CompanyDocument.Status.FAILED
            document.processing_error = (
                "Could not process this PDF. Check that it is a valid, "
                "readable PDF file."
            )

        document.save(
            update_fields=[
                "extracted_text",
                "status",
                "processing_error",
                "updated_at",
            ]
        )

        return Response(
            self.get_serializer(document).data,
            status=status.HTTP_201_CREATED,
        )


class CompanyDocumentSearchView(generics.GenericAPIView):
    """
    GET /api/knowledge/search/?q=keyword

    Admins can search only their own company's documents.
    Founders must provide a valid company_id.
    """

    serializer_class = CompanyDocumentSerializer
    permission_classes = [IsAuthenticated, IsCompanyKnowledgeAdmin]

    def get(self, request, *args, **kwargs):
        query = request.query_params.get("q", "").strip()

        if len(query) < 2:
            return Response(
                {
                    "detail": (
                        "Enter a search term with at least 2 characters."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user

        if user.role == "ADMIN":
            if not user.company_id:
                return Response(
                    {
                        "detail": (
                            "Your account is not linked to a company."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            requested_company_id = request.query_params.get("company_id")

            if requested_company_id:
                if not requested_company_id.isdigit():
                    return Response(
                        {"company_id": "A valid company_id is required."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if int(requested_company_id) != user.company_id:
                    return Response(
                        {
                            "detail": (
                                "You cannot access another company's "
                                "documents."
                            )
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )

            company_id = user.company_id

        elif user.role == "FOUNDER":
            company_id = request.query_params.get("company_id")

            if not company_id or not company_id.isdigit():
                return Response(
                    {"company_id": "A valid company_id is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            company_id = int(company_id)

            if not Company.objects.filter(pk=company_id).exists():
                return Response(
                    {"company_id": "Select a valid company."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        else:
            return Response(
                {"detail": "You cannot search company documents."},
                status=status.HTTP_403_FORBIDDEN,
            )

        documents = CompanyDocument.objects.filter(
            company_id=company_id,
            status=CompanyDocument.Status.READY,
            extracted_text__icontains=query,
        ).select_related("company")

        results = []

        for document in documents[:20]:
            text = document.extracted_text
            position = text.lower().find(query.lower())

            start = max(0, position - 100)
            end = min(len(text), position + len(query) + 200)

            results.append(
                {
                    "id": document.id,
                    "title": document.title,
                    "company": document.company_id,
                    "company_name": document.company.name,
                    "matching_text": text[start:end],
                }
            )

        return Response(
            {
                "query": query,
                "count": len(results),
                "results": results,
            }
        )

class KnowledgeRetrieveView(generics.GenericAPIView):
    """
    POST /api/knowledge/retrieve/

    Retrieve relevant text chunks for an authenticated user.
    Admins are restricted to their own company.
    Founders must supply company_id.
    """

    permission_classes = [IsAuthenticated, IsCompanyKnowledgeAdmin]

    def post(self, request, *args, **kwargs):
        query = str(request.data.get("query", "")).strip()

        if len(query) < 2:
            return Response(
                {"query": "Enter a question with at least 2 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user

        if user.role == "ADMIN":
            if not user.company_id:
                return Response(
                    {"detail": "Your account is not linked to a company."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            company_id = user.company_id

            requested_company_id = request.data.get("company_id")
            if requested_company_id not in (None, ""):
                try:
                    requested_company_id = int(requested_company_id)
                except (TypeError, ValueError):
                    return Response(
                        {"company_id": "A valid company_id is required."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if requested_company_id != company_id:
                    return Response(
                        {"detail": "You cannot access another company's documents."},
                        status=status.HTTP_403_FORBIDDEN,
                    )

        elif user.role == "FOUNDER":
            try:
                company_id = int(request.data.get("company_id"))
            except (TypeError, ValueError):
                return Response(
                    {"company_id": "A valid company_id is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not Company.objects.filter(pk=company_id).exists():
                return Response(
                    {"company_id": "Select a valid company."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        else:
            return Response(
                {"detail": "You cannot retrieve company knowledge."},
                status=status.HTTP_403_FORBIDDEN,
            )


        retrieval_mode = str(
            request.data.get("retrieval_mode", "keyword")
        ).strip().lower()

        if retrieval_mode == "keyword":
            results = retrieve_relevant_chunks(query, company_id)

        elif retrieval_mode == "semantic":
            results = retrieve_semantic_chunks(query, company_id)

        else:
            return Response(
                {
                    "retrieval_mode": (
                        "Choose either 'keyword' or 'semantic'."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        return Response(
            {
                "query": query,
                "company_id": company_id,
                "count": len(results),
                "results": results,
            },
            status=status.HTTP_200_OK,
        )
