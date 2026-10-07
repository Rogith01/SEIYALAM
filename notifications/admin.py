from django.contrib import admin

from .models import Notification, AuditLog


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "recipient",
        "title",
        "notification_type",
        "is_read",
        "created_at",
    )

    list_filter = (
        "notification_type",
        "is_read",
    )

    search_fields = (
        "recipient__username",
        "title",
        "message",
    )


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "action",
        "created_at",
    )

    list_filter = (
        "action",
        "created_at",
    )

    search_fields = (
        "user__username",
        "action",
        "description",
    )