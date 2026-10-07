from django.db import models
from accounts.models import User
from companies.models import Company
from service_requests.models import ServiceRequest


class WorkOrder(models.Model):
    class Status(models.TextChoices):
        ASSIGNED = "ASSIGNED", "Assigned"
        ACCEPTED = "ACCEPTED", "Accepted"
        ON_THE_WAY = "ON_THE_WAY", "On the Way"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"
        CUSTOMER_CONFIRMED = "CUSTOMER_CONFIRMED", "Customer Confirmed"
        CLOSED = "CLOSED", "Closed"

    work_order_number = models.CharField(max_length=30, unique=True)

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="work_orders",
    )

    service_request = models.OneToOneField(
        ServiceRequest,
        on_delete=models.CASCADE,
        related_name="work_order",
    )

    worker = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_work_orders",
    )

    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.ASSIGNED,
    )

    scheduled_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.work_order_number} - {self.service_request.title}"