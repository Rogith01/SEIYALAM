from django.db import models


class Company(models.Model):

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        SUSPENDED = "SUSPENDED", "Suspended"
        DEACTIVATED = "DEACTIVATED", "Deactivated"

    name = models.CharField(
        max_length=200,
    )

    phone = models.CharField(
        max_length=20,
    )

    email = models.EmailField(
        blank=True,
    )

    address = models.TextField(
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return self.name


class PlatformSettings(models.Model):

    platform_name = models.CharField(
        max_length=200,
        default="SEIYALAM",
    )

    support_email = models.EmailField(
        blank=True,
    )

    support_phone = models.CharField(
        max_length=20,
        blank=True,
    )

    support_website = models.URLField(
        blank=True,
    )

    default_currency = models.CharField(
        max_length=10,
        default="INR",
    )

    default_timezone = models.CharField(
        max_length=100,
        default="Asia/Kolkata",
    )

    default_language = models.CharField(
        max_length=20,
        default="en",
    )

    maintenance_mode = models.BooleanField(
        default=False,
    )

    maintenance_message = models.TextField(
        blank=True,
        default=(
            "SEIYALAM is currently under maintenance. "
            "Please try again later."
        ),
    )

    allow_customer_registration = models.BooleanField(
        default=True,
    )

    allow_customer_otp_login = models.BooleanField(
        default=True,
    )

    max_upload_size_mb = models.PositiveIntegerField(
        default=10,
    )

    platform_announcement = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        verbose_name = "Platform Settings"
        verbose_name_plural = "Platform Settings"

    def __str__(self):
        return "SEIYALAM Platform Settings"

    @classmethod
    def get_settings(cls):
        settings, created = cls.objects.get_or_create(
            id=1,
            defaults={
                "platform_name": "SEIYALAM",
                "default_currency": "INR",
                "default_timezone": "Asia/Kolkata",
                "default_language": "en",
                "maintenance_mode": False,
                "allow_customer_registration": True,
                "allow_customer_otp_login": True,
                "max_upload_size_mb": 10,
            },
        )

        return settings