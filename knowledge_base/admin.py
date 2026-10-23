
from django.contrib import admin

from .models import CompanyDocument


@admin.register(CompanyDocument)
class CompanyDocumentAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "company",
        "uploaded_by",
        "status",
        "created_at",
    )

    list_filter = ("status", "company")
    search_fields = (
        "title",
        "original_filename",
        "company__name",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
        "extracted_text",
        "processing_error",
    )
