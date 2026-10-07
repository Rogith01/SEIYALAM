from django.contrib import admin
from .models import Company


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "email", "created_at")