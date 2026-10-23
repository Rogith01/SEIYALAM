
import os

from rest_framework import serializers

from .models import CompanyDocument


class CompanyDocumentSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(
        source="company.name",
        read_only=True,
    )

    uploaded_by_name = serializers.CharField(
        source="uploaded_by.username",
        read_only=True,
    )

    file = serializers.FileField(write_only=True)

    class Meta:
        model = CompanyDocument
        fields = [
            "id",
            "company",
            "company_name",
            "uploaded_by",
            "uploaded_by_name",
            "title",
            "description",
            "file",
            "original_filename",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "company",
            "company_name",
            "uploaded_by",
            "uploaded_by_name",
            "original_filename",
            "status",
            "created_at",
            "updated_at",
        ]

    def validate_file(self, uploaded_file):
        extension = os.path.splitext(uploaded_file.name)[1].lower()

        if extension != ".pdf":
            raise serializers.ValidationError(
                "Only PDF files are supported."
            )

        if uploaded_file.size == 0:
            raise serializers.ValidationError(
                "The uploaded file is empty."
            )

        return uploaded_file
