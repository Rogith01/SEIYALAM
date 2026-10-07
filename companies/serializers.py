from rest_framework import serializers

from .models import (
    Company,
    PlatformSettings,
)

from accounts.models import User


# ============================================================
# FOUNDER COMPANY SERIALIZER
# ============================================================

class FounderCompanySerializer(
    serializers.ModelSerializer
):

    class Meta:

        model = Company

        fields = [
            "id",
            "name",
            "phone",
            "email",
            "address",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "status",
            "created_at",
            "updated_at",
        ]


# ============================================================
# FOUNDER ADMIN SERIALIZER
# ============================================================

class FounderAdminSerializer(
    serializers.Serializer
):

    username = serializers.CharField(
        max_length=150,
    )

    password = serializers.CharField(
        write_only=True,
        min_length=8,
    )

    phone = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True,
    )

    employee_id = serializers.CharField(
        max_length=50,
        required=False,
        allow_blank=True,
    )

    def validate_username(
        self,
        value,
    ):

        if User.objects.filter(
            username=value
        ).exists():

            raise serializers.ValidationError(
                "Username already exists."
            )

        return value

    def validate_phone(
        self,
        value,
    ):

        if value and User.objects.filter(
            phone=value
        ).exists():

            raise serializers.ValidationError(
                "Phone number already exists."
            )

        return value

    def create(
        self,
        validated_data,
    ):

        company = self.context["company"]

        user = User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
            role=User.Role.ADMIN,
            company=company,
            phone=validated_data.get(
                "phone"
            ) or None,
            employee_id=validated_data.get(
                "employee_id",
                "",
            ),
        )

        user.is_active = True

        user.save()

        return user


# ============================================================
# FOUNDER PLATFORM SETTINGS SERIALIZER
# ============================================================

class PlatformSettingsSerializer(
    serializers.ModelSerializer
):

    class Meta:

        model = PlatformSettings

        fields = [
            "id",
            "platform_name",
            "support_email",
            "support_phone",
            "support_website",
            "default_currency",
            "default_timezone",
            "default_language",
            "maintenance_mode",
            "maintenance_message",
            "allow_customer_registration",
            "allow_customer_otp_login",
            "max_upload_size_mb",
            "platform_announcement",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_max_upload_size_mb(
        self,
        value,
    ):

        if value < 1:

            raise serializers.ValidationError(
                "Upload size must be at least 1 MB."
            )

        if value > 500:

            raise serializers.ValidationError(
                "Upload size cannot exceed 500 MB."
            )

        return value

    def validate_default_currency(
        self,
        value,
    ):

        value = value.strip().upper()

        allowed_currencies = [
            "INR",
            "USD",
            "EUR",
            "GBP",
            "AED",
            "SGD",
            "AUD",
            "CAD",
        ]

        if value not in allowed_currencies:

            raise serializers.ValidationError(
                "Unsupported currency."
            )

        return value