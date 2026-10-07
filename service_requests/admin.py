from django.contrib import admin
from .models import ServiceRequest


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = (
        "request_number",
        "title",
        "customer",
        "company",
        "status",
        "created_at",
    )

    list_filter = ("status", "company")

    search_fields = (
        "request_number",
        "title",
        "customer__username",
    )