
import os
import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


def company_document_upload_path(instance, filename):
    """
    Store each company's documents in a separate directory.
    Use a generated filename rather than trusting the uploaded name.
    """
    extension = os.path.splitext(filename)[1].lower()
    return (
        f"knowledge_base/company_{instance.company_id}/"
        f"{uuid.uuid4().hex}{extension}"
    )


class CompanyDocument(models.Model):

    class Status(models.TextChoices):
        UPLOADED = "UPLOADED", "Uploaded"
        PROCESSING = "PROCESSING", "Processing"
        READY = "READY", "Ready"
        FAILED = "FAILED", "Failed"

    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="knowledge_documents",
    )

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="uploaded_knowledge_documents",
    )

    title = models.CharField(max_length=200)

    description = models.TextField(blank=True)

    file = models.FileField(
        upload_to=company_document_upload_path,
        max_length=500,
    )

    original_filename = models.CharField(max_length=255)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.UPLOADED,
    )

    extracted_text = models.TextField(blank=True)

    processing_error = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["company", "status"],
                name="kb_company_status_idx",
            ),
        ]

    def clean(self):
        super().clean()

        if self.uploaded_by_id and self.company_id:
            uploader = self.uploaded_by

            if uploader.role not in ("FOUNDER", "ADMIN"):
                raise ValidationError({
                    "uploaded_by": (
                        "Only authorized company administrators "
                        "can upload knowledge documents."
                    )
                })

            if (
                uploader.role == "ADMIN"
                and uploader.company_id != self.company_id
            ):
                raise ValidationError({
                    "company": (
                        "An administrator can only upload documents "
                        "for their own company."
                    )
                })

        if self.file and self.file.name:
            extension = os.path.splitext(self.file.name)[1].lower()

            if extension != ".pdf":
                raise ValidationError({
                    "file": "Only PDF documents are supported initially."
                })

    def __str__(self):
        return f"{self.title} (Company {self.company_id})"

class DocumentChunk(models.Model):
    """
    A searchable text passage extracted from a company document.
    Each chunk belongs to one document and one company.
    """

    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="knowledge_chunks",
    )

    document = models.ForeignKey(
        CompanyDocument,
        on_delete=models.CASCADE,
        related_name="chunks",
    )

    chunk_index = models.PositiveIntegerField()

    text = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["document_id", "chunk_index"]
        constraints = [
            models.UniqueConstraint(
                fields=["document", "chunk_index"],
                name="kb_unique_document_chunk",
            ),
        ]
        indexes = [
            models.Index(
                fields=["company", "document"],
                name="kb_chunk_company_doc_idx",
            ),
        ]

    def clean(self):
        super().clean()

        if (
            self.document_id
            and self.company_id != self.document.company_id
        ):
            from django.core.exceptions import ValidationError

            raise ValidationError({
                "company": (
                    "The chunk's company must match its document's company."
                )
            })

    def __str__(self):
        return (
            f"Chunk {self.chunk_index} "
            f"of document {self.document_id}"
        )


class KnowledgeConversation(models.Model):
    """A persistent, company-scoped knowledge assistant conversation."""

    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="knowledge_conversations",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="knowledge_conversations",
    )

    title = models.CharField(max_length=200, default="New conversation")

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(
                fields=["company", "user", "-updated_at"],
                name="kb_chat_owner_updated_idx",
            ),
        ]

    def __str__(self):
        return f"{self.title} (Company {self.company_id})"


class KnowledgeChatMessage(models.Model):
    """A message and its source references within a conversation."""

    class Role(models.TextChoices):
        USER = "user", "User"
        ASSISTANT = "assistant", "Assistant"

    conversation = models.ForeignKey(
        KnowledgeConversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )

    role = models.CharField(max_length=10, choices=Role.choices)

    content = models.TextField()

    # Stores the document/chunk references used for an assistant answer.
    sources = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at", "id"]
        indexes = [
            models.Index(
                fields=["conversation", "created_at"],
                name="kb_chat_msg_created_idx",
            ),
        ]

    def __str__(self):
        return f"{self.role} message in conversation {self.conversation_id}"
