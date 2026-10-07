from rest_framework import serializers

from companies.models import Company
from accounts.models import User, Skill, CustomerCompany
from service_requests.models import ServiceRequest
from work_orders.models import WorkOrder
from work_logs.models import WorkLog, WorkEvidence
from notifications.models import Notification, AuditLog


# ============================================================
# COMPANY
# ============================================================

class CompanySerializer(serializers.ModelSerializer):

    class Meta:
        model = Company
        fields = "__all__"


# ============================================================
# CUSTOMER COMPANY
# ============================================================
# NOTE:
# This model is currently kept for compatibility with the
# existing database/code.
#
# Our final customer workflow does NOT permanently connect a
# customer to a company. Company selection happens per
# ServiceRequest.
# ============================================================

class CustomerCompanySerializer(serializers.ModelSerializer):

    company_details = serializers.SerializerMethodField()

    class Meta:
        model = CustomerCompany

        fields = (
            "id",
            "customer",
            "company",
            "company_details",
            "connected_at",
        )

        read_only_fields = (
            "customer",
            "company_details",
            "connected_at",
        )

    def get_company_details(self, obj):

        return {
            "id": obj.company.id,
            "name": obj.company.name,
            "phone": obj.company.phone,
            "email": obj.company.email,
            "address": obj.company.address,
        }


# ============================================================
# SKILL
# ============================================================

class SkillSerializer(serializers.ModelSerializer):

    class Meta:
        model = Skill
        fields = "__all__"


# ============================================================
# USER
# ============================================================

class UserSerializer(serializers.ModelSerializer):

    skills = SkillSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = User

        fields = (
            "id",
            "username",
            "email",
            "role",
            "company",
            "phone",
            "phone_verified",
            "address",
            "employee_id",
            "joining_date",
            "availability",
            "skills",
        )


# ============================================================
# WORKER CREATE
# ============================================================

class WorkerCreateSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=6,
    )

    skills = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Skill.objects.all(),
        required=False,
    )

    class Meta:
        model = User

        fields = (
            "id",
            "username",
            "email",
            "password",
            "phone",
            "address",
            "employee_id",
            "joining_date",
            "availability",
            "skills",
        )

    def validate_username(self, value):

        if User.objects.filter(
            username=value
        ).exists():

            raise serializers.ValidationError(
                "A user with this username already exists."
            )

        return value

    def validate_employee_id(self, value):

        if value:

            request = self.context.get("request")

            if request and request.user.is_authenticated:

                company = request.user.company

                if User.objects.filter(
                    company=company,
                    employee_id=value,
                ).exists():

                    raise serializers.ValidationError(
                        "This employee ID already exists in your company."
                    )

        return value

    def create(self, validated_data):

        password = validated_data.pop("password")

        skills = validated_data.pop(
            "skills",
            [],
        )

        request = self.context["request"]

        admin_user = request.user

        worker = User(
            **validated_data,
            role=User.Role.WORKER,
            company=admin_user.company,
        )

        worker.set_password(password)

        worker.save()

        worker.skills.set(skills)

        return worker


# ============================================================
# WORKER UPDATE
# ============================================================

class WorkerUpdateSerializer(serializers.ModelSerializer):

    skills = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Skill.objects.all(),
        required=False,
    )

    class Meta:
        model = User

        fields = (
            "id",
            "username",
            "email",
            "phone",
            "address",
            "employee_id",
            "joining_date",
            "availability",
            "skills",
        )

        read_only_fields = (
            "id",
        )

    def validate_username(self, value):

        user = self.instance

        if User.objects.filter(
            username=value
        ).exclude(
            id=user.id
        ).exists():

            raise serializers.ValidationError(
                "A user with this username already exists."
            )

        return value

    def validate_employee_id(self, value):

        if value:

            request = self.context.get("request")

            if request and request.user.is_authenticated:

                company = request.user.company

                existing = User.objects.filter(
                    company=company,
                    employee_id=value,
                ).exclude(
                    id=self.instance.id
                )

                if existing.exists():

                    raise serializers.ValidationError(
                        "This employee ID already exists in your company."
                    )

        return value

    def update(self, instance, validated_data):

        skills = validated_data.pop(
            "skills",
            None,
        )

        for attr, value in validated_data.items():

            setattr(
                instance,
                attr,
                value,
            )

        instance.role = User.Role.WORKER

        instance.save()

        if skills is not None:
            instance.skills.set(skills)

        return instance


# ============================================================
# SERVICE REQUEST
# ============================================================

class ServiceRequestSerializer(
    serializers.ModelSerializer
):

    # --------------------------------------------------------
    # Customer phone
    #
    # Database/model field = customer_phone
    # Frontend field      = phone
    # --------------------------------------------------------

    phone = serializers.CharField(
        source="customer_phone",
        required=False,
        allow_blank=True,
    )

    # --------------------------------------------------------
    # Customer details
    #
    # Used when displaying a service request to Admin/Worker.
    #
    # IMPORTANT:
    # "name" comes from User.name, NOT Django's
    # first_name/last_name fields.
    # --------------------------------------------------------

    customer_details = serializers.SerializerMethodField()

    # --------------------------------------------------------
    # Company selection
    #
    # Customer selects the company for THIS request.
    #
    # company_id is used when creating a request.
    # --------------------------------------------------------

    company_id = serializers.PrimaryKeyRelatedField(
        source="company",
        queryset=Company.objects.all(),
        write_only=True,
    )

    # --------------------------------------------------------
    # Company details
    #
    # Used when displaying the request.
    # --------------------------------------------------------

    company_details = serializers.SerializerMethodField()

    class Meta:
        model = ServiceRequest

        fields = (
            "id",
            "request_number",
            "customer",
            "customer_details",
            "company",
            "company_id",
            "company_details",
            "title",
            "description",
            "phone",
            "address",
            "location_latitude",
            "location_longitude",
            "required_skill",
            "status",
            "created_at",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "request_number",
            "customer",
            "customer_details",
            "company",
            "company_details",
            "status",
            "created_at",
            "updated_at",
        )

    def get_customer_details(self, obj):

        customer = obj.customer

        if not customer:
            return None

        return {
            "id": customer.id,

            # Actual customer full name entered during registration
            "name": (
                customer.name
                if customer.name
                else customer.username
            ),

            # Keep username available as the system/login identifier
            "username": customer.username,

            "phone": customer.phone,

            "email": customer.email,

            "address": customer.address,
        }

    def get_company_details(self, obj):

        if not obj.company:
            return None

        return {
            "id": obj.company.id,
            "name": obj.company.name,
            "phone": obj.company.phone,
            "email": obj.company.email,
            "address": obj.company.address,
        }

    def validate(self, attrs):

        request = self.context.get("request")

        if not request:

            raise serializers.ValidationError(
                "Request context is required."
            )

        user = request.user

        company = attrs.get("company")

        # ----------------------------------------------------
        # CUSTOMER
        # ----------------------------------------------------

        if user.role == User.Role.CUSTOMER:

            # Customer must select a company for every request.
            if not company:

                raise serializers.ValidationError(
                    {
                        "company_id":
                        "Please select a company or branch."
                    }
                )

            # Customers are NOT permanently connected to a
            # company.
            #
            # They can create requests for different companies.
            #
            # Request 1 -> Chennai
            # Request 2 -> Salem
            # Request 3 -> Bangalore

        # ----------------------------------------------------
        # ADMIN / WORKER
        # ----------------------------------------------------

        elif user.role in (
            User.Role.ADMIN,
            User.Role.WORKER,
        ):

            if not user.company_id:

                raise serializers.ValidationError(
                    "Your account is not assigned to a company."
                )

            if company and company.id != user.company_id:

                raise serializers.ValidationError(
                    {
                        "company_id":
                        "You can only create requests for your company."
                    }
                )

        return attrs


# ============================================================
# WORK ORDER
# ============================================================

class WorkOrderSerializer(
    serializers.ModelSerializer
):

    service_request_details = serializers.SerializerMethodField()

    worker_details = serializers.SerializerMethodField()

    class Meta:
        model = WorkOrder

        fields = (
            "id",
            "work_order_number",
            "company",
            "service_request",
            "service_request_details",
            "worker",
            "worker_details",
            "status",
            "scheduled_at",
            "notes",
            "created_at",
            "updated_at",
        )

        read_only_fields = (
            "work_order_number",
            "company",
            "status",
            "created_at",
            "updated_at",
            "service_request_details",
            "worker_details",
        )

    def get_service_request_details(self, obj):

        service_request = obj.service_request

        if not service_request:
            return None

        company_details = None

        if service_request.company:

            company_details = {
                "id": service_request.company.id,
                "name": service_request.company.name,
                "phone": service_request.company.phone,
                "email": service_request.company.email,
                "address": service_request.company.address,
            }

        customer = service_request.customer

        return {
            "id": service_request.id,

            "request_number": (
                service_request.request_number
            ),

            "title": service_request.title,

            "description": service_request.description,

            # ------------------------------------------------
            # COMPANY / BRANCH
            # ------------------------------------------------

            "company": (
                service_request.company.id
                if service_request.company
                else None
            ),

            "company_details": company_details,

            "address": service_request.address,

            "location_latitude": (
                service_request.location_latitude
            ),

            "location_longitude": (
                service_request.location_longitude
            ),

            "status": service_request.status,

            "created_at": service_request.created_at,

            "updated_at": service_request.updated_at,

            # ------------------------------------------------
            # CUSTOMER
            # ------------------------------------------------

            "customer": {

                "id": (
                    customer.id
                    if customer
                    else None
                ),

                # Login/system identifier
                "username": (
                    customer.username
                    if customer
                    else None
                ),

                # Actual customer name
                "name": (
                    customer.name
                    if (
                        customer
                        and customer.name
                    )
                    else (
                        customer.username
                        if customer
                        else None
                    )
                ),

                "phone": service_request.customer_phone,

                "email": (
                    customer.email
                    if customer
                    else None
                ),

                "address": (
                    customer.address
                    if customer
                    else None
                ),
            },
        }

    def get_worker_details(self, obj):

        worker = obj.worker

        if not worker:
            return None

        return {
            "id": worker.id,
            "username": worker.username,

            "name": (
                worker.name
                if worker.name
                else worker.username
            ),

            "phone": worker.phone,
            "email": worker.email,
            "employee_id": worker.employee_id,
            "availability": worker.availability,
        }

    def validate(self, attrs):

        worker = attrs.get("worker")

        service_request = attrs.get(
            "service_request"
        )

        if worker:

            if worker.role != User.Role.WORKER:

                raise serializers.ValidationError(
                    {
                        "worker":
                        "Selected user is not a worker."
                    }
                )

        if service_request:

            if self.instance:

                existing = (
                    WorkOrder.objects
                    .filter(
                        service_request=service_request
                    )
                    .exclude(
                        pk=self.instance.pk
                    )
                )

            else:

                existing = WorkOrder.objects.filter(
                    service_request=service_request
                )

            if existing.exists():

                raise serializers.ValidationError(
                    {
                        "service_request":
                        "A work order already exists for this service request."
                    }
                )

            # ------------------------------------------------
            # Required skill check
            # ------------------------------------------------

            if not service_request.required_skill_id:

                raise serializers.ValidationError(
                    {
                        "service_request":
                        "Required skill must be selected before assigning a worker."
                    }
                )

            # ------------------------------------------------
            # Worker skill check
            # ------------------------------------------------

            if (
                worker
                and not worker.skills.filter(
                    id=service_request.required_skill_id
                ).exists()
            ):

                raise serializers.ValidationError(
                    {
                        "worker":
                        "Selected worker does not have the required skill."
                    }
                )

        return attrs


# ============================================================
# WORK LOG
# ============================================================

class WorkLogSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = WorkLog

        fields = "__all__"

        read_only_fields = (
            "worker",
            "company",
            "created_at",
        )

    def validate(self, attrs):

        work_order = attrs.get(
            "work_order"
        )

        request = self.context.get(
            "request"
        )

        if (
            not request
            or not request.user.is_authenticated
        ):

            raise serializers.ValidationError(
                "Authentication is required."
            )

        user = request.user

        if user.role != User.Role.WORKER:

            raise serializers.ValidationError(
                "Only workers can create work logs."
            )

        if work_order:

            if (
                work_order.company_id
                != user.company_id
            ):

                raise serializers.ValidationError(
                    {
                        "work_order":
                        "Work order belongs to another company."
                    }
                )

            if (
                work_order.worker_id
                != user.id
            ):

                raise serializers.ValidationError(
                    {
                        "work_order":
                        "This work order is not assigned to you."
                    }
                )

        return attrs


# ============================================================
# WORK EVIDENCE
# ============================================================

class WorkEvidenceSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = WorkEvidence

        fields = (
            "id",
            "work_order",
            "company",
            "uploaded_by",
            "evidence_type",
            "file",
            "description",
            "created_at",
        )

        read_only_fields = (
            "company",
            "uploaded_by",
            "created_at",
        )


# ============================================================
# NOTIFICATION
# ============================================================

class NotificationSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = Notification

        fields = "__all__"


# ============================================================
# AUDIT LOG
# ============================================================

class AuditLogSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = AuditLog

        fields = "__all__"


# ============================================================
# CUSTOMER REGISTRATION
# ============================================================

class CustomerRegistrationSerializer(serializers.Serializer):

    name = serializers.CharField(
        max_length=150
    )

    username = serializers.CharField(
        max_length=150
    )

    email = serializers.EmailField(
        required=False,
        allow_blank=True,
    )

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={
            "input_type": "password"
        }
    )

    confirm_password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={
            "input_type": "password"
        }
    )

    phone = serializers.CharField(
        max_length=20
    )

    def validate_name(self, value):

        value = value.strip()

        if not value:

            raise serializers.ValidationError(
                "Name is required."
            )

        return value

    def validate_username(self, value):

        value = value.strip()

        if not value:

            raise serializers.ValidationError(
                "Username is required."
            )

        if User.objects.filter(
            username__iexact=value
        ).exists():

            raise serializers.ValidationError(
                "This username is already taken."
            )

        return value

    def validate_email(self, value):

        value = value.strip()

        if value:

            if User.objects.filter(
                email__iexact=value
            ).exists():

                raise serializers.ValidationError(
                    "This email address is already registered."
                )

        return value

    def validate_phone(self, value):

        value = str(value).strip()

        if not value.isdigit():

            raise serializers.ValidationError(
                "Phone number must contain only digits."
            )

        if len(value) != 10:

            raise serializers.ValidationError(
                "Please enter a valid 10-digit mobile number."
            )

        # ----------------------------------------------------
        # CUSTOMER PHONE MUST BE UNIQUE AMONG CUSTOMERS
        #
        # Staff can have the same number.
        # ----------------------------------------------------

        if User.objects.filter(
            phone=value,
            role=User.Role.CUSTOMER,
        ).exists():

            raise serializers.ValidationError(
                "This phone number is already registered to another customer."
            )

        return value

    def validate(self, attrs):

        password = attrs.get(
            "password"
        )

        confirm_password = attrs.get(
            "confirm_password"
        )

        if password != confirm_password:

            raise serializers.ValidationError(
                {
                    "confirm_password":
                    "Passwords do not match."
                }
            )

        return attrs

    def create(self, validated_data):

        validated_data.pop(
            "confirm_password"
        )

        password = validated_data.pop(
            "password"
        )

        user = User.objects.create_user(
            name=validated_data["name"],
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=password,
            phone=validated_data["phone"],
            role=User.Role.CUSTOMER,
            phone_verified=False,
            company=None,
        )

        return user