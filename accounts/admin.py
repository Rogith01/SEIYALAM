from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User, Skill


@admin.register(User)
class CustomUserAdmin(UserAdmin):

    fieldsets = UserAdmin.fieldsets + (
        (
            "SEIYALAM Details",
            {
                "fields": (
                    "role",
                    "company",
                    "phone",
                    "address",
                    "employee_id",
                    "joining_date",
                    "availability",
                    "skills",
                )
            },
        ),
    )

    list_display = (
        "username",
        "email",
        "role",
        "company",
        "availability",
    )


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "name",
        "created_at",
    )

    search_fields = (
        "name",
    )