from django.db import models

from accounts.models import User
from companies.models import Company
from work_orders.models import WorkOrder

from .validators import validate_evidence_file


class WorkLog(models.Model):

    class LogType(models.TextChoices):

        NOTE = "NOTE", "Note"

        STARTED = "STARTED", "Started"

        PROGRESS = "PROGRESS", "Progress"

        ISSUE = "ISSUE", "Issue"

        COMPLETED = "COMPLETED", "Completed"

    work_order = models.ForeignKey(
        WorkOrder,
        on_delete=models.CASCADE,
        related_name="work_logs",
    )

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="work_logs",
    )

    worker = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="work_logs",
    )

    log_type = models.CharField(
        max_length=20,
        choices=LogType.choices,
        default=LogType.NOTE,
    )

    notes = models.TextField()

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):

        return (
            f"{self.work_order.work_order_number} "
            f"- {self.worker.username}"
        )


class WorkEvidence(models.Model):

    class EvidenceType(models.TextChoices):

        BEFORE = "BEFORE", "Before"

        DURING = "DURING", "During"

        AFTER = "AFTER", "After"

        DOCUMENT = "DOCUMENT", "Document"

    work_order = models.ForeignKey(
        WorkOrder,
        on_delete=models.CASCADE,
        related_name="evidence",
    )

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="work_evidence",
    )

    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="uploaded_evidence",
    )

    evidence_type = models.CharField(
        max_length=20,
        choices=EvidenceType.choices,
        default=EvidenceType.DURING,
    )

    file = models.FileField(
        upload_to="work_evidence/",
        validators=[
            validate_evidence_file
        ],
    )

    description = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):

        return (
            f"{self.work_order.work_order_number} "
            f"- {self.evidence_type}"
        )