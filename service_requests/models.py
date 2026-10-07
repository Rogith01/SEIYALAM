from django.db import models

from accounts.models import User
from companies.models import Company
from accounts.models import Skill


class ServiceRequest(models.Model):

    class Status(models.TextChoices):
        NEW = "NEW", "New"
        ASSIGNED = "ASSIGNED", "Assigned"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"
        CLOSED = "CLOSED", "Closed"

    request_number = models.CharField(
        max_length=30,
        unique=True,
    )

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="service_requests",
    )

    customer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="service_requests",
    )

    title = models.CharField(
        max_length=200,
    )

    description = models.TextField()

    customer_phone = models.CharField(
        max_length=20,
        blank=True,
    )

    address = models.TextField()

    location_latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )

    location_longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )

    required_skill = models.ForeignKey(
        Skill,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="service_requests",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NEW,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return f"{self.request_number} - {self.title}"