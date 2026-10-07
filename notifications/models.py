from django.db import models

from accounts.models import User
from companies.models import Company


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        SERVICE_REQUEST = "SERVICE_REQUEST", "Service Request"
        WORK_ORDER = "WORK_ORDER", "Work Order"
        STATUS_UPDATE = "STATUS_UPDATE", "Status Update"
        SYSTEM = "SYSTEM", "System"

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    notification_type = models.CharField(
        max_length=30,
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM,
    )

    title = models.CharField(max_length=200)

    message = models.TextField()

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.recipient.username} - {self.title}"


class AuditLog(models.Model):
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="audit_logs",
    )

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )

    action = models.CharField(max_length=100)

    description = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} - {self.created_at}"