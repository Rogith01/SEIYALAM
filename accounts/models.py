
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    class Role(models.TextChoices):
        FOUNDER = "FOUNDER", "Founder"
        ADMIN = "ADMIN", "Admin"
        WORKER = "WORKER", "Worker"
        CUSTOMER = "CUSTOMER", "Customer"

    class Availability(models.TextChoices):
        AVAILABLE = "AVAILABLE", "Available"
        BUSY = "BUSY", "Busy"
        OFFLINE = "OFFLINE", "Offline"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CUSTOMER,
    )

    # Display name.
    #
    # For customers, this will be their real/display name.
    # It will be shown to Admin/Worker instead of username
    # when viewing customer-related information.
    name = models.CharField(
        max_length=150,
        blank=True,
    )

    # Used for Admin and Worker.
    # Customers and Founder do not need a permanent company.
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="users",
    )

    # Phone number.
    #
    # Phone numbers are unique within two separate groups:
    #
    # FOUNDER + ADMIN + WORKER
    # -> one shared STAFF phone pool
    #
    # CUSTOMER
    # -> separate CUSTOMER phone pool
    #
    # Therefore the same phone can exist once in STAFF
    # and once in CUSTOMER.
    phone = models.CharField(
        max_length=20,
        null=True,
        blank=True,
    )

    # Phone-number pool.
    #
    # Founder/Admin/Worker -> STAFF
    # Customer             -> CUSTOMER
    #
    # Normal database column instead of GeneratedField
    # because TiDB does not support the required generated
    # stored column ALTER TABLE operation.
    phone_group = models.CharField(
        max_length=8,
        default="CUSTOMER",
        editable=False,
    )

    # True only after the phone number has been verified by OTP.
    phone_verified = models.BooleanField(
        default=False,
    )

    address = models.TextField(
        blank=True,
    )

    employee_id = models.CharField(
        max_length=50,
        blank=True,
    )

    joining_date = models.DateField(
        null=True,
        blank=True,
    )

    availability = models.CharField(
        max_length=20,
        choices=Availability.choices,
        default=Availability.OFFLINE,
    )

    skills = models.ManyToManyField(
        "Skill",
        blank=True,
        related_name="workers",
    )

    def save(self, *args, **kwargs):
        """
        Automatically keep phone_group synchronized with the user's role.

        FOUNDER / ADMIN / WORKER -> STAFF
        CUSTOMER                 -> CUSTOMER
        """

        if self.role in [
            self.Role.FOUNDER,
            self.Role.ADMIN,
            self.Role.WORKER,
        ]:
            self.phone_group = "STAFF"
        else:
            self.phone_group = "CUSTOMER"

        super().save(*args, **kwargs)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["phone_group", "phone"],
                name="unique_phone_within_role_group",
            ),
        ]


class Skill(models.Model):

    name = models.CharField(
        max_length=100,
        unique=True,
    )

    description = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return self.name


class CustomerCompany(models.Model):

    customer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="customer_companies",
    )

    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="customers",
    )

    connected_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["customer", "company"],
                name="unique_customer_company",
            )
        ]

    def __str__(self):
        return (
            f"{self.customer.username} - "
            f"{self.company.name}"
        )


# ============================================================
# PHONE OTP
# ============================================================


class PhoneOTP(models.Model):

    class Purpose(models.TextChoices):
        PHONE_VERIFICATION = (
            "PHONE_VERIFICATION",
            "Phone Verification",
        )

        PASSWORD_RESET = (
            "PASSWORD_RESET",
            "Password Reset",
        )

        PHONE_CHANGE = (
            "PHONE_CHANGE",
            "Phone Change",
        )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="phone_otps",
    )

    phone = models.CharField(
        max_length=20,
    )

    # We store the hashed OTP, not the actual OTP.
    code_hash = models.CharField(
        max_length=128,
    )

    purpose = models.CharField(
        max_length=30,
        choices=Purpose.choices,
    )

    expires_at = models.DateTimeField()

    attempts = models.PositiveIntegerField(
        default=0,
    )

    is_used = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return (
            f"{self.user.username} - "
            f"{self.phone} - "
            f"{self.purpose}"
        )
