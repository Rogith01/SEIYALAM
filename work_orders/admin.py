from django.contrib import admin
from .models import WorkOrder


@admin.register(WorkOrder)
class WorkOrderAdmin(admin.ModelAdmin):
    list_display = (
        "work_order_number",
        "service_request",
        "worker",
        "status",
        "scheduled_at",
        "created_at",
    )

    list_filter = ("status", "company")

    search_fields = (
        "work_order_number",
        "service_request__request_number",
        "worker__username",
    )