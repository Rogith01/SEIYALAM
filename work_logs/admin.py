from django.contrib import admin

from .models import WorkLog, WorkEvidence


@admin.register(WorkLog)
class WorkLogAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "work_order",
        "worker",
        "log_type",
        "created_at",
    )

    list_filter = (
        "log_type",
        "created_at",
    )

    search_fields = (
        "notes",
        "worker__username",
        "work_order__work_order_number",
    )


@admin.register(WorkEvidence)
class WorkEvidenceAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "work_order",
        "uploaded_by",
        "evidence_type",
        "created_at",
    )

    list_filter = (
        "evidence_type",
        "created_at",
    )

    search_fields = (
        "description",
        "uploaded_by__username",
        "work_order__work_order_number",
    )