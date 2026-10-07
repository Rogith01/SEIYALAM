from datetime import timedelta

from django.db.models import Q
from django.core import signing
from django.utils import timezone
from django.contrib.auth.hashers import (
    make_password,
    check_password,
)
import re 
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

import secrets

from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, status, serializers
from rest_framework.parsers import (
    MultiPartParser,
    FormParser,
)

from companies.models import (
    Company,
    PlatformSettings,
)

from accounts.models import (
    User,
    Skill,
    PhoneOTP,
)

from service_requests.models import ServiceRequest
from work_orders.models import WorkOrder

from work_logs.models import (
    WorkLog,
    WorkEvidence,
)

from notifications.models import (
    Notification,
    AuditLog,
)

from .serializers import (
    CompanySerializer,
    UserSerializer,
    WorkerCreateSerializer,
    SkillSerializer,
    WorkerUpdateSerializer,
    ServiceRequestSerializer,
    WorkOrderSerializer,
    WorkLogSerializer,
    WorkEvidenceSerializer,
    NotificationSerializer,
    AuditLogSerializer,
    CustomerRegistrationSerializer,
)

from .permissions import (
    IsAdminUserRole,
    IsWorkerUserRole,
    IsCustomerUserRole,
)
# ============================================================
# HELPERS
# ============================================================

def create_notification(
    recipient,
    company,
    notification_type,
    title,
    message,
):
    notification = Notification.objects.create(
        recipient=recipient,
        company=company,
        notification_type=notification_type,
        title=title,
        message=message,
    )

    return notification


def create_company_admin_notifications(
    company,
    notification_type,
    title,
    message,
):
    admins = User.objects.filter(
        company=company,
        role=User.Role.ADMIN,
        is_active=True,
    )

    for admin in admins:
        create_notification(
            recipient=admin,
            company=company,
            notification_type=notification_type,
            title=title,
            message=message,
        )

def create_audit_log(
    user,
    company,
    action,
    description,
):
    return AuditLog.objects.create(
        user=user,
        company=company,
        action=action,
        description=description,
    )


# ============================================================
# COMPANY
# ============================================================

class CompanyListView(
    generics.ListAPIView
):

    serializer_class = CompanySerializer

    permission_classes = [
        IsAdminUserRole
    ]

    def get_queryset(self):

        return Company.objects.filter(
            id=self.request.user.company_id
        )

class CompanyDetailView(
    generics.RetrieveAPIView
):

    serializer_class = CompanySerializer

    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):

        user = self.request.user

        if user.role == User.Role.ADMIN:
            return Company.objects.filter(
                id=user.company_id
            )

        if user.role == User.Role.CUSTOMER:
            return Company.objects.all()

        if user.role == User.Role.WORKER:
            return Company.objects.filter(
                id=user.company_id
            )

        return Company.objects.none()

class CustomerCompanyListView(
    generics.ListAPIView
):

    serializer_class = CompanySerializer

    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(
        self
    ):

        user = self.request.user

        if user.role != User.Role.CUSTOMER:

            return Company.objects.none()

        return (
            Company.objects
            .filter(
                status=Company.Status.ACTIVE
            )
            .order_by("name")
        )


# ============================================================
# CUSTOMER REGISTRATION
# ============================================================

class CustomerRegistrationView(
    generics.CreateAPIView
):

    serializer_class = CustomerRegistrationSerializer

    authentication_classes = []
    permission_classes = []

    def create(
        self,
        request,
        *args,
        **kwargs,
    ):

        # ----------------------------------------------------
        # CHECK WHETHER CUSTOMER REGISTRATION IS ENABLED
        # ----------------------------------------------------

        settings = PlatformSettings.get_settings()

        if not settings.allow_customer_registration:

            return Response(
                {
                    "success": False,
                    "message": (
                        "Customer registration is currently "
                        "disabled."
                    ),
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = serializer.save()

        return Response(
            {
                "success": True,
                "message": (
                    "Customer account created successfully."
                ),
                "user": {
                    "id": user.id,

                    "name": user.name,

                    "username": user.username,

                    "email": user.email,

                    "phone": user.phone,

                    "phone_verified": user.phone_verified,

                    "role": user.role,
                },
            },
            status=status.HTTP_201_CREATED,
        )
# ============================================================
# CUSTOMERS
# ============================================================

class CustomerListView(
    generics.ListAPIView
):

    serializer_class = UserSerializer

    permission_classes = [
        IsAdminUserRole
    ]

    def get_queryset(self):

        customer_ids = (
            ServiceRequest.objects
            .filter(company_id=self.request.user.company_id)
            .values_list("customer_id", flat=True)
            .distinct()
        )

        queryset = User.objects.filter(
            id__in=customer_ids,
            role=User.Role.CUSTOMER,
        )

        search = self.request.query_params.get(
            "search"
        )

        if search:

            queryset = queryset.filter(
                Q(username__icontains=search)
                | Q(email__icontains=search)
                | Q(phone__icontains=search)
            )

        return queryset.order_by(
            "username"
        )


# ============================================================
# SKILLS
# ============================================================

class SkillListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = SkillSerializer

    permission_classes = [
        IsAdminUserRole
    ]

    def get_queryset(self):

        return Skill.objects.all().order_by(
            "name"
        )


# ============================================================
# WORKERS
# ============================================================

class WorkerListView(
    generics.ListAPIView
):

    serializer_class = UserSerializer

    permission_classes = [
        IsAdminUserRole
    ]

    def get_queryset(self):

        queryset = User.objects.filter(
            role=User.Role.WORKER,
            company_id=self.request.user.company_id,
        )

        search = self.request.query_params.get(
            "search"
        )

        availability = (
            self.request.query_params.get(
                "availability"
            )
        )

        skill = self.request.query_params.get(
            "skill"
        )

        if search:

            queryset = queryset.filter(
                Q(username__icontains=search)
                | Q(email__icontains=search)
                | Q(phone__icontains=search)
                | Q(employee_id__icontains=search)
            )

        if availability:

            queryset = queryset.filter(
                availability=availability
            )

        if skill:

            queryset = queryset.filter(
                skills__name__icontains=skill
            )

        return queryset.distinct().order_by(
            "username"
        )

class WorkerCreateView(generics.CreateAPIView):
    serializer_class = WorkerCreateSerializer
    permission_classes = [IsAdminUserRole]

    def perform_create(self, serializer):

        user = self.request.user

        if not user.company:
            from rest_framework.exceptions import ValidationError

            raise ValidationError(
                {
                    "company":
                    "Your admin account is not assigned to a company."
                }
            )

        serializer.save()
class WorkerDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = WorkerUpdateSerializer
    permission_classes = [IsAdminUserRole]

    def get_queryset(self):
        return User.objects.filter(
            role=User.Role.WORKER,
            company_id=self.request.user.company_id,
        )

    def perform_destroy(self, instance):
        instance.delete()

# ============================================================
# SERVICE REQUESTS
# ============================================================

class ServiceRequestListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = ServiceRequestSerializer

    def get_queryset(self):

        user = self.request.user

        queryset = ServiceRequest.objects.all()

        if user.role == User.Role.ADMIN:

            queryset = queryset.filter(
                company_id=user.company_id
            )

        elif user.role == User.Role.WORKER:

            queryset = queryset.filter(
                company_id=user.company_id,
                work_order__worker=user,
            )

        elif user.role == User.Role.CUSTOMER:

            queryset = queryset.filter(
                customer=user
            )

        else:

            return ServiceRequest.objects.none()

        search = self.request.query_params.get(
            "search"
        )

        request_status = (
            self.request.query_params.get(
                "status"
            )
        )

        if search:

            queryset = queryset.filter(
                Q(request_number__icontains=search)
                | Q(title__icontains=search)
                | Q(description__icontains=search)
            )

        if request_status:

            queryset = queryset.filter(
                status=request_status
            )

        return queryset.distinct().order_by(
            "-created_at"
        )

    def perform_create(self, serializer):

        user = self.request.user

        if user.role == User.Role.CUSTOMER:

            company_id = self.request.data.get("company_id")

            if not company_id:
                raise serializers.ValidationError({
                    "company_id":
                    "Please select a company or branch."
                })

            try:
                company = Company.objects.get(id=company_id)
            except Company.DoesNotExist:
                raise serializers.ValidationError({
                    "company_id":
                    "Selected company or branch does not exist."
                })

            last_request = (
                ServiceRequest.objects
                .filter(company=company)
                .order_by("-id")
                .first()
            )

            if last_request:
                try:
                    last_number = int(
                        last_request.request_number.split("-")[-1]
                    )
                except (ValueError, AttributeError):
                    last_number = 0
            else:
                last_number = 0

            request_number = f"SR-{last_number + 1:04d}"

            service_request = serializer.save(
                    request_number=request_number,
                    customer=user,
                    company=company,
                )

            customer_display_name = (
                    user.name.strip()
                    if user.name and user.name.strip()
                    else user.username
                )

            create_company_admin_notifications(
                    company=company,
                    notification_type=Notification.NotificationType.SERVICE_REQUEST,
                    title="New service request",
                    message=(
                        f"{service_request.request_number} "
                        f"has been submitted by {customer_display_name}."
                    ),
                )

        else:
            serializer.save()


class MyServiceRequestListView(
    generics.ListAPIView
):

    serializer_class = ServiceRequestSerializer

    permission_classes = [
        IsCustomerUserRole
    ]

    def get_queryset(self):

        queryset = ServiceRequest.objects.filter(
            customer=self.request.user
        )

        request_status = (
            self.request.query_params.get(
                "status"
            )
        )

        if request_status:

            queryset = queryset.filter(
                status=request_status
            )

        return queryset.order_by(
            "-created_at"
        )


# ============================================================
# SERVICE REQUEST DETAIL
# ============================================================

# ============================================================
# SERVICE REQUEST DETAIL
# ============================================================

class ServiceRequestDetailView(
    generics.RetrieveUpdateAPIView
):

    serializer_class = ServiceRequestSerializer

    def get_queryset(self):

        user = self.request.user

        if user.role == User.Role.ADMIN:

            return ServiceRequest.objects.filter(
                company=user.company
            ).order_by(
                "-created_at"
            )

        if user.role == User.Role.CUSTOMER:

            return ServiceRequest.objects.filter(
                customer=user
            ).order_by(
                "-created_at"
            )

        if user.role == User.Role.WORKER:

            return ServiceRequest.objects.filter(
                company=user.company,
                work_orders__worker=user
            ).distinct().order_by(
                "-created_at"
            )

        return ServiceRequest.objects.none()

    def update(
        self,
        request,
        *args,
        **kwargs,
    ):

        # Only Admin can update a service request.
        if request.user.role != User.Role.ADMIN:

            return Response(
                {
                    "detail":
                    "Only admins can update service requests."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().update(
            request,
            *args,
            **kwargs,
        )


# ============================================================
# WORK ORDERS
# ============================================================

class WorkOrderListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = WorkOrderSerializer

    def get_queryset(self):

        user = self.request.user

        if user.role == User.Role.ADMIN:

            queryset = WorkOrder.objects.filter(
                company_id=user.company_id
            )

        elif user.role == User.Role.WORKER:

            queryset = WorkOrder.objects.filter(
                worker=user
            )

        elif user.role == User.Role.CUSTOMER:

            queryset = WorkOrder.objects.filter(
                service_request__customer=user
            )

        else:

            return WorkOrder.objects.none()

        search = self.request.query_params.get(
            "search"
        )

        work_status = (
            self.request.query_params.get(
                "status"
            )
        )

        worker_id = (
            self.request.query_params.get(
                "worker"
            )
        )

        if search:

            queryset = queryset.filter(
                Q(
                    work_order_number__icontains=search
                )
                | Q(
                    service_request__title__icontains=search
                )
            )

        if work_status:

            queryset = queryset.filter(
                status=work_status
            )

        if (
            worker_id
            and user.role == User.Role.ADMIN
        ):

            queryset = queryset.filter(
                worker_id=worker_id
            )

        return queryset.distinct().order_by(
            "-created_at"
        )

    def perform_create(self, serializer):

        user = self.request.user

        if user.role != User.Role.ADMIN:

            from rest_framework.exceptions import (
                PermissionDenied,
            )

            raise PermissionDenied(
                "Only admins can create work orders."
            )

        service_request = (
            serializer.validated_data.get(
                "service_request"
            )
        )

        worker = (
            serializer.validated_data.get(
                "worker"
            )
        )

        if not service_request:

            from rest_framework.exceptions import (
                ValidationError,
            )

            raise ValidationError(
                {
                    "service_request":
                    "Service request is required."
                }
            )

        if not worker:

            from rest_framework.exceptions import (
                ValidationError,
            )

            raise ValidationError(
                {
                    "worker":
                    "Worker is required."
                }
            )

        if (
            service_request.company_id
            != user.company_id
        ):

            from rest_framework.exceptions import (
                ValidationError,
            )

            raise ValidationError(
                {
                    "service_request":
                    "Service request does not belong to your company."
                }
            )

        if (
            worker.company_id
            != user.company_id
        ):

            from rest_framework.exceptions import (
                ValidationError,
            )

            raise ValidationError(
                {
                    "worker":
                    "Selected worker does not belong to your company."
                }
            )

        if (
            worker.role
            != User.Role.WORKER
        ):

            from rest_framework.exceptions import (
                ValidationError,
            )

            raise ValidationError(
                {
                    "worker":
                    "Selected user is not a worker."
                }
            )

        if WorkOrder.objects.filter(
            service_request=service_request
        ).exists():

            from rest_framework.exceptions import (
                ValidationError,
            )

            raise ValidationError(
                {
                    "service_request":
                    "A work order already exists for this service request."
                }
            )

        last_work_order = (
            WorkOrder.objects
            .filter(
                company=user.company
            )
            .order_by("-id")
            .first()
        )

        if last_work_order:

            try:

                last_number = int(
                    last_work_order
                    .work_order_number
                    .split("-")[-1]
                )

            except (
                ValueError,
                AttributeError,
            ):

                last_number = 0

        else:

            last_number = 0

        work_order_number = (
            f"WO-{last_number + 1:04d}"
        )

        work_order = serializer.save(
            company=user.company,
            work_order_number=work_order_number,
        )

        service_request.status = (
            ServiceRequest.Status.ASSIGNED
        )

        service_request.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        create_notification(
            recipient=service_request.customer,
            company=user.company,
            notification_type=(
                Notification.NotificationType.WORK_ORDER
            ),
            title="Worker assigned",
            message=(
                f"{work_order.work_order_number} "
                "has been assigned to your service request."
            ),
        )

        create_audit_log(
            user=user,
            company=user.company,
            action="WORK_ORDER_CREATED",
            description=(
                f"{user.username} assigned "
                f"{work_order.work_order_number} "
                f"to worker {worker.username} "
                f"for service request "
                f"{service_request.request_number}."
            ),
        )


# ============================================================
# WORK ORDER DETAIL
# ============================================================

class WorkOrderDetailView(
    generics.RetrieveAPIView
):

    serializer_class = WorkOrderSerializer

    def get_queryset(self):

        user = self.request.user

        if user.role == User.Role.ADMIN:

            return WorkOrder.objects.filter(
                company_id=user.company_id
            )

        if user.role == User.Role.WORKER:

            return WorkOrder.objects.filter(
                worker=user
            )

        if user.role == User.Role.CUSTOMER:

            return WorkOrder.objects.filter(
                service_request__customer=user
            )

        return WorkOrder.objects.none()


# ============================================================
# MY WORK ORDERS
# ============================================================

class MyWorkOrderListView(
    generics.ListAPIView
):

    serializer_class = WorkOrderSerializer

    def get_queryset(self):

        user = self.request.user

        if user.role == User.Role.WORKER:

            queryset = WorkOrder.objects.filter(
                worker=user
            )

        elif user.role == User.Role.CUSTOMER:

            queryset = WorkOrder.objects.filter(
                service_request__customer=user
            )

        elif user.role == User.Role.ADMIN:

            queryset = WorkOrder.objects.filter(
                company_id=user.company_id
            )

        else:

            return WorkOrder.objects.none()

        work_status = (
            self.request.query_params.get(
                "status"
            )
        )

        if work_status:

            queryset = queryset.filter(
                status=work_status
            )

        return queryset.order_by(
            "-created_at"
        )


# ============================================================
# WORK LOGS
# ============================================================

class WorkLogListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = WorkLogSerializer

    def get_queryset(self):

        user = self.request.user

        if user.role == User.Role.ADMIN:

            queryset = WorkLog.objects.filter(
                company_id=user.company_id
            )

        elif user.role == User.Role.WORKER:

            queryset = WorkLog.objects.filter(
                worker=user
            )

        elif user.role == User.Role.CUSTOMER:

            queryset = WorkLog.objects.filter(
                work_order__service_request__customer=user
            )

        else:

            return WorkLog.objects.none()

        log_type = (
            self.request.query_params.get(
                "log_type"
            )
        )

        if log_type:

            queryset = queryset.filter(
                log_type=log_type
            )

        return queryset.order_by(
            "-created_at"
        )

    def perform_create(self, serializer):

        user = self.request.user

        if user.role != User.Role.WORKER:

            from rest_framework.exceptions import (
                PermissionDenied,
            )

            raise PermissionDenied(
                "Only workers can create work logs."
            )

        serializer.save(
            worker=user,
            company=user.company,
        )


# ============================================================
# WORK EVIDENCE
# ============================================================

class WorkEvidenceListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = WorkEvidenceSerializer

    parser_classes = [
        MultiPartParser,
        FormParser,
    ]

    def get_queryset(self):

        user = self.request.user

        if user.role == User.Role.ADMIN:

            queryset = WorkEvidence.objects.filter(
                company_id=user.company_id
            )

        elif user.role == User.Role.WORKER:

            queryset = WorkEvidence.objects.filter(
                company_id=user.company_id,
                uploaded_by=user,
            )

        elif user.role == User.Role.CUSTOMER:

            queryset = WorkEvidence.objects.filter(
                work_order__service_request__customer=user
            )

        else:

            return WorkEvidence.objects.none()

        work_order = (
            self.request.query_params.get(
                "work_order"
            )
        )

        evidence_type = (
            self.request.query_params.get(
                "evidence_type"
            )
        )

        if work_order:

            queryset = queryset.filter(
                work_order_id=work_order
            )

        if evidence_type:

            queryset = queryset.filter(
                evidence_type=evidence_type
            )

        return queryset.order_by(
            "-created_at"
        )
def perform_create(self, serializer):

    user = self.request.user

    if user.role != User.Role.WORKER:

        from rest_framework.exceptions import (
            PermissionDenied,
        )

        raise PermissionDenied(
            "Only workers can upload work evidence."
        )

    work_order = serializer.validated_data[
        "work_order"
    ]

    if work_order.worker_id != user.id:

        from rest_framework.exceptions import (
            PermissionDenied,
        )

        raise PermissionDenied(
            "You can only upload evidence for your assigned work orders."
        )

    # ----------------------------------------------------
    # CHECK PLATFORM UPLOAD SIZE LIMIT
    # ----------------------------------------------------

    uploaded_file = serializer.validated_data.get(
        "file"
    )

    if uploaded_file:

        settings = PlatformSettings.get_settings()

        max_size = (
            settings.max_upload_size_mb
            * 1024
            * 1024
        )

        if uploaded_file.size > max_size:

            from rest_framework.exceptions import (
                ValidationError,
            )

            raise ValidationError(
                {
                    "file": (
                        f"File size cannot exceed "
                        f"{settings.max_upload_size_mb} MB."
                    )
                }
            )

    serializer.save(
        uploaded_by=user,
        company=user.company,
    )

# ============================================================
# WORK ORDER ACTIONS
# ============================================================

class WorkOrderActionView(APIView):

    def post(
        self,
        request,
        pk,
        action,
    ):

        try:

            work_order = WorkOrder.objects.get(
                pk=pk
            )

        except WorkOrder.DoesNotExist:

            return Response(
                {
                    "detail":
                    "Work order not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        user = request.user

        if user.role == User.Role.ADMIN:

            if work_order.company_id != user.company_id:
                return Response(
                    {"detail": "You do not have access to this work order."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        elif user.role == User.Role.WORKER:

            if (
                work_order.company_id != user.company_id
                or work_order.worker_id != user.id
            ):
                return Response(
                    {"detail": "You do not have access to this work order."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        elif user.role == User.Role.CUSTOMER:

            if work_order.service_request.customer_id != user.id:
                return Response(
                    {"detail": "You do not have access to this work order."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        else:
            return Response(
                {"detail": "You do not have access to this work order."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if action in [
            "accept",
            "on-the-way",
            "start",
            "complete",
        ]:

            if user.role != User.Role.WORKER:

                return Response(
                    {
                        "detail":
                        "Only workers can perform this action."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            if (
                work_order.worker_id
                != user.id
            ):

                return Response(
                    {
                        "detail":
                        "This work order is not assigned to you."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            if action == "accept":

                if (
                    work_order.status
                    != WorkOrder.Status.ASSIGNED
                ):

                    return Response(
                        {
                            "detail":
                            "Work order cannot be accepted now."
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                work_order.status = (
                    WorkOrder.Status.ACCEPTED
                )

                work_order.service_request.status = (
                    ServiceRequest.Status.ASSIGNED
                )

                work_order.service_request.save(
                    update_fields=[
                        "status",
                        "updated_at",
                    ]
                )

                user.availability = (
                    User.Availability.BUSY
                )

                user.save(
                    update_fields=[
                        "availability"
                    ]
                )

                create_notification(
                    recipient=(
                        work_order.service_request.customer
                    ),
                    company=work_order.company,
                    notification_type=(
                        Notification.NotificationType.WORK_ORDER
                    ),
                    title="Work order accepted",
                    message=(
                        f"{work_order.work_order_number} "
                        "has been accepted by the assigned worker."
                    ),
                )

                audit_action = (
                    "WORK_ORDER_ACCEPTED"
                )

            elif action == "on-the-way":

                if (
                    work_order.status
                    != WorkOrder.Status.ACCEPTED
                ):

                    return Response(
                        {
                            "detail":
                            "Accept the work order first."
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                work_order.status = (
                    WorkOrder.Status.ON_THE_WAY
                )

                create_notification(
                    recipient=(
                        work_order.service_request.customer
                    ),
                    company=work_order.company,
                    notification_type=(
                        Notification.NotificationType.STATUS_UPDATE
                    ),
                    title="Worker is on the way",
                    message=(
                        f"The worker is on the way for "
                        f"{work_order.work_order_number}."
                    ),
                )

                audit_action = (
                    "WORK_ORDER_ON_THE_WAY"
                )

            elif action == "start":

                if (
                    work_order.status
                    != WorkOrder.Status.ON_THE_WAY
                ):

                    return Response(
                        {
                            "detail":
                            "Worker must be on the way first."
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                work_order.status = (
                    WorkOrder.Status.IN_PROGRESS
                )

                work_order.service_request.status = (
                    ServiceRequest.Status.IN_PROGRESS
                )

                work_order.service_request.save(
                    update_fields=[
                        "status",
                        "updated_at",
                    ]
                )

                create_notification(
                    recipient=(
                        work_order.service_request.customer
                    ),
                    company=work_order.company,
                    notification_type=(
                        Notification.NotificationType.STATUS_UPDATE
                    ),
                    title="Job started",
                    message=(
                        f"Work has started for "
                        f"{work_order.work_order_number}."
                    ),
                )

                audit_action = (
                    "WORK_ORDER_STARTED"
                )

            elif action == "complete":

                if (
                    work_order.status
                    != WorkOrder.Status.IN_PROGRESS
                ):

                    return Response(
                        {
                            "detail":
                            "Job must be in progress first."
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                work_order.status = (
                    WorkOrder.Status.COMPLETED
                )

                work_order.service_request.status = (
                    ServiceRequest.Status.COMPLETED
                )

                work_order.service_request.save(
                    update_fields=[
                        "status",
                        "updated_at",
                    ]
                )

                user.availability = (
                    User.Availability.AVAILABLE
                )

                user.save(
                    update_fields=[
                        "availability"
                    ]
                )

                create_notification(
                    recipient=(
                        work_order.service_request.customer
                    ),
                    company=work_order.company,
                    notification_type=(
                        Notification.NotificationType.STATUS_UPDATE
                    ),
                    title="Job completed",
                    message=(
                        f"{work_order.work_order_number} "
                        "has been completed. Please confirm the work."
                    ),
                )

                audit_action = (
                    "WORK_ORDER_COMPLETED"
                )

        elif action == "confirm":

            if user.role != User.Role.CUSTOMER:

                return Response(
                    {
                        "detail":
                        "Only customers can confirm a job."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            if (
                work_order.service_request.customer_id
                != user.id
            ):

                return Response(
                    {
                        "detail":
                        "You do not own this work order."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            if (
                work_order.status
                != WorkOrder.Status.COMPLETED
            ):

                return Response(
                    {
                        "detail":
                        "Job must be completed first."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            work_order.status = (
                WorkOrder.Status.CUSTOMER_CONFIRMED
            )

            create_notification(
                recipient=work_order.worker,
                company=work_order.company,
                notification_type=(
                    Notification.NotificationType.STATUS_UPDATE
                ),
                title="Customer confirmed the job",
                message=(
                    f"Customer confirmed "
                    f"{work_order.work_order_number}."
                ),
            )

            audit_action = (
                "WORK_ORDER_CUSTOMER_CONFIRMED"
            )

        elif action == "close":

            if user.role != User.Role.ADMIN:

                return Response(
                    {
                        "detail":
                        "Only admins can close work orders."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            if (
                work_order.status
                != WorkOrder.Status.CUSTOMER_CONFIRMED
            ):

                return Response(
                    {
                        "detail":
                        "Customer confirmation is required first."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            work_order.status = (
                WorkOrder.Status.CLOSED
            )

            work_order.service_request.status = (
                ServiceRequest.Status.CLOSED
            )

            work_order.service_request.save(
                update_fields=[
                    "status",
                    "updated_at",
                ]
            )

            create_notification(
                recipient=work_order.worker,
                company=work_order.company,
                notification_type=(
                    Notification.NotificationType.STATUS_UPDATE
                ),
                title="Work order closed",
                message=(
                    f"{work_order.work_order_number} "
                    "has been officially closed."
                ),
            )

            audit_action = (
                "WORK_ORDER_CLOSED"
            )

        else:

            return Response(
                {
                    "detail":
                    "Invalid action."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        work_order.save()

        create_audit_log(
            user=user,
            company=work_order.company,
            action=audit_action,
            description=(
                f"{user.username} performed "
                f"'{action}' on "
                f"{work_order.work_order_number}."
            ),
        )

        return Response(
            WorkOrderSerializer(
                work_order
            ).data,
            status=status.HTTP_200_OK,
        )


# ============================================================
# NOTIFICATIONS
# ============================================================

class NotificationListView(
    generics.ListAPIView
):

    serializer_class = NotificationSerializer

    def get_queryset(self):

        user = self.request.user

        queryset = Notification.objects.filter(
            recipient=user
        )

        if user.role in (
            User.Role.ADMIN,
            User.Role.WORKER,
        ):
            queryset = queryset.filter(
                company_id=user.company_id
            )

        return queryset.order_by("-created_at")


class NotificationReadView(
    APIView
):

    def post(
        self,
        request,
        pk,
    ):

        try:

            notification = Notification.objects.get(
                pk=pk,
                recipient=request.user,
            )

            if request.user.role in (
                User.Role.ADMIN,
                User.Role.WORKER,
            ) and notification.company_id != request.user.company_id:
                raise Notification.DoesNotExist

        except Notification.DoesNotExist:

            return Response(
                {
                    "detail":
                    "Notification not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        notification.is_read = True

        notification.save(
            update_fields=[
                "is_read"
            ]
        )

        return Response(
            NotificationSerializer(
                notification
            ).data
        )


# ============================================================
# AUDIT LOG
# ============================================================

class AuditLogListView(
    generics.ListAPIView
):

    serializer_class = AuditLogSerializer

    permission_classes = [
        IsAdminUserRole
    ]

    def get_queryset(self):

        queryset = AuditLog.objects.filter(
            company_id=self.request.user.company_id
        )

        action = self.request.query_params.get(
            "action"
        )

        search = self.request.query_params.get(
            "search"
        )

        if action:

            queryset = queryset.filter(
                action=action
            )

        if search:

            queryset = queryset.filter(
                Q(
                    description__icontains=search
                )
                | Q(
                    user__username__icontains=search
                )
            )

        return queryset.order_by(
            "-created_at"
        )


# ============================================================
# DASHBOARD
# ============================================================

class AdminDashboardView(
    APIView
):

    permission_classes = [
        IsAdminUserRole
    ]

    def get(
        self,
        request,
    ):

        company = request.user.company

        if not company:

            return Response(
                {
                    "success": False,
                    "message": (
                        "Admin user is not assigned "
                        "to a company."
                    ),
                    "company": None,
                    "service_requests": {
                        "total": 0,
                        "new": 0,
                        "assigned": 0,
                        "in_progress": 0,
                        "completed": 0,
                        "closed": 0,
                    },
                    "work_orders": {
                        "total": 0,
                        "assigned": 0,
                        "accepted": 0,
                        "on_the_way": 0,
                        "in_progress": 0,
                        "completed": 0,
                        "customer_confirmed": 0,
                        "closed": 0,
                    },
                    "workers": {
                        "total": 0,
                        "available": 0,
                        "busy": 0,
                        "offline": 0,
                    },
                    "notifications": 0,
                    "audit_logs": 0,
                },
                status=status.HTTP_200_OK,
            )

        service_requests = (
            ServiceRequest.objects.filter(
                company=company
            )
        )

        work_orders = (
            WorkOrder.objects.filter(
                company=company
            )
        )

        workers = User.objects.filter(
            company=company,
            role=User.Role.WORKER,
        )

        data = {

            "company": company.name,

            "service_requests": {

                "total": service_requests.count(),

                "new": service_requests.filter(
                    status=ServiceRequest.Status.NEW
                ).count(),

                "assigned": service_requests.filter(
                    status=ServiceRequest.Status.ASSIGNED
                ).count(),

                "in_progress": service_requests.filter(
                    status=ServiceRequest.Status.IN_PROGRESS
                ).count(),

                "completed": service_requests.filter(
                    status=ServiceRequest.Status.COMPLETED
                ).count(),

                "closed": service_requests.filter(
                    status=ServiceRequest.Status.CLOSED
                ).count(),
            },

            "work_orders": {

                "total": work_orders.count(),

                "assigned": work_orders.filter(
                    status=WorkOrder.Status.ASSIGNED
                ).count(),

                "accepted": work_orders.filter(
                    status=WorkOrder.Status.ACCEPTED
                ).count(),

                "on_the_way": work_orders.filter(
                    status=WorkOrder.Status.ON_THE_WAY
                ).count(),

                "in_progress": work_orders.filter(
                    status=WorkOrder.Status.IN_PROGRESS
                ).count(),

                "completed": work_orders.filter(
                    status=WorkOrder.Status.COMPLETED
                ).count(),

                "customer_confirmed": work_orders.filter(
                    status=WorkOrder.Status.CUSTOMER_CONFIRMED
                ).count(),

                "closed": work_orders.filter(
                    status=WorkOrder.Status.CLOSED
                ).count(),
            },

            "workers": {

                "total": workers.count(),

                "available": workers.filter(
                    availability=User.Availability.AVAILABLE
                ).count(),

                "busy": workers.filter(
                    availability=User.Availability.BUSY
                ).count(),

                "offline": workers.filter(
                    availability=User.Availability.OFFLINE
                ).count(),
            },

            "notifications": (
                Notification.objects.filter(
                    company=company
                ).count()
            ),

            "audit_logs": (
                AuditLog.objects.filter(
                    company=company
                ).count()
            ),
        }

        return Response(data)


class WorkerDashboardView(
    APIView
):

    permission_classes = [
        IsWorkerUserRole
    ]

    def get(
        self,
        request,
    ):

        worker = request.user

        work_orders = WorkOrder.objects.filter(
            worker=worker
        )

        data = {

            "worker": worker.username,

            "availability": worker.availability,

            "work_orders": {

                "total": work_orders.count(),

                "assigned": work_orders.filter(
                    status=WorkOrder.Status.ASSIGNED
                ).count(),

                "accepted": work_orders.filter(
                    status=WorkOrder.Status.ACCEPTED
                ).count(),

                "on_the_way": work_orders.filter(
                    status=WorkOrder.Status.ON_THE_WAY
                ).count(),

                "in_progress": work_orders.filter(
                    status=WorkOrder.Status.IN_PROGRESS
                ).count(),

                "completed": work_orders.filter(
                    status=WorkOrder.Status.COMPLETED
                ).count(),

                "closed": work_orders.filter(
                    status=WorkOrder.Status.CLOSED
                ).count(),
            },

            "work_logs": WorkLog.objects.filter(
                worker=worker
            ).count(),

            "evidence_uploaded": (
                WorkEvidence.objects.filter(
                    uploaded_by=worker
                ).count()
            ),

            "unread_notifications": (
                Notification.objects.filter(
                    recipient=worker,
                    is_read=False,
                ).count()
            ),
        }

        return Response(data)


class CustomerDashboardView(
    APIView
):

    permission_classes = [
        IsCustomerUserRole
    ]

    def get(
        self,
        request,
    ):

        customer = request.user

        service_requests = (
            ServiceRequest.objects.filter(
                customer=customer
            )
        )

        work_orders = (
            WorkOrder.objects.filter(
                service_request__customer=customer
            )
        )

        data = {

            "customer": customer.username,

            "service_requests": {

                "total": service_requests.count(),

                "new": service_requests.filter(
                    status=ServiceRequest.Status.NEW
                ).count(),

                "in_progress": service_requests.filter(
                    status=ServiceRequest.Status.IN_PROGRESS
                ).count(),

                "completed": service_requests.filter(
                    status=ServiceRequest.Status.COMPLETED
                ).count(),

                "closed": service_requests.filter(
                    status=ServiceRequest.Status.CLOSED
                ).count(),
            },

            "work_orders": {

                "total": work_orders.count(),

                "active": work_orders.exclude(
                    status=WorkOrder.Status.CLOSED
                ).count(),

                "completed": work_orders.filter(
                    status=WorkOrder.Status.COMPLETED
                ).count(),

                "closed": work_orders.filter(
                    status=WorkOrder.Status.CLOSED
                ).count(),
            },

            "unread_notifications": (
                Notification.objects.filter(
                    recipient=customer,
                    is_read=False,
                ).count()
            ),
        }

        return Response(data)


# ============================================================
# CURRENT USER
# ============================================================

# ============================================================
# CURRENT USER
# ============================================================

class CurrentUserView(
    APIView
):

    permission_classes = [
        IsAuthenticated
    ]

    def get(
        self,
        request,
    ):

        user = request.user

        return Response(
            {
                "id": user.id,

                # ------------------------------------------------
                # BASIC PROFILE
                # ------------------------------------------------

                "name": user.name,
                "username": user.username,
                "email": user.email,

                # ------------------------------------------------
                # PHONE
                # ------------------------------------------------

                "phone": user.phone,
                "phone_verified": user.phone_verified,

                # ------------------------------------------------
                # ADDRESS
                # ------------------------------------------------

                "address": user.address,

                # ------------------------------------------------
                # ROLE
                # ------------------------------------------------

                "role": user.role,

                # ------------------------------------------------
                # COMPANY
                # ------------------------------------------------

                "company_id": user.company_id,

                "company_name": (
                    user.company.name
                    if user.company
                    else None
                ),

                # ------------------------------------------------
                # WORKER DETAILS
                # ------------------------------------------------

                "employee_id": user.employee_id,

                "joining_date": (
                    user.joining_date
                    if user.joining_date
                    else None
                ),

                "availability": user.availability,
            }
        )

class CustomerProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user

        if user.role != User.Role.CUSTOMER:
            return Response(
                {
                    "success": False,
                    "message": "Only customers can update their profile.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        name = request.data.get("name", user.name)
        email = request.data.get("email", user.email)
        phone = request.data.get("phone", user.phone)
        address = request.data.get("address", user.address)

        # Clean values
        name = str(name).strip()
        email = str(email).strip()
        phone = str(phone).strip()
        address = str(address).strip()

        # Name validation
        if not name:
            return Response(
                {
                    "success": False,
                    "message": "Name is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Email validation
            # Email validation
            if email and not re.match(r"^\S+@\S+\.\S+$", email):
                return Response(
                    {
                        "success": False,
                        "message": "Please enter a valid email address.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Phone validation
        if not phone.isdigit() or len(phone) != 10:
            return Response(
                {
                    "success": False,
                    "message": "Please enter a valid 10-digit mobile number.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Customer phone uniqueness
        existing_customer = (
            User.objects.filter(
                phone=phone,
                role=User.Role.CUSTOMER,
            )
            .exclude(id=user.id)
            .first()
        )

        if existing_customer:
            return Response(
                {
                    "success": False,
                    "message": (
                        "This mobile number is already registered "
                        "to another customer."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update profile
        user.name = name
        user.email = email
        user.phone = phone
        user.address = address

        # If phone changes, require verification again
        if phone != user.phone:
            user.phone_verified = False

        user.save(
            update_fields=[
                "name",
                "email",
                "phone",
                "address",
                "phone_verified",
            ]
        )

        return Response(
            {
                "success": True,
                "message": "Profile updated successfully.",
                "user": {
                    "id": user.id,
                    "name": user.name,
                    "username": user.username,
                    "email": user.email,
                    "phone": user.phone,
                    "phone_verified": user.phone_verified,
                    "address": user.address,
                    "role": user.role,
                    "company_id": user.company_id,
                    "company_name": (
                        user.company.name
                        if user.company
                        else None
                    ),
                    "employee_id": user.employee_id,
                    "joining_date": user.joining_date,
                    "availability": user.availability,
                },
            },
            status=status.HTTP_200_OK,
        )
# ============================================================
# WEBSOCKET TICKET
# ============================================================

class WSTicketView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def post(
        self,
        request,
    ):

        ticket = signing.dumps(
            {
                "user_id": request.user.id,
            }
        )

        return Response(
            {
                "ticket": ticket,
                "expires_in": 60,
            },
            status=status.HTTP_200_OK,
        )

# ============================================================
# CHANGE PASSWORD
# ============================================================

class ChangePasswordView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def post(
        self,
        request,
    ):

        current_password = request.data.get(
            "current_password"
        )

        new_password = request.data.get(
            "new_password"
        )

        confirm_password = request.data.get(
            "confirm_password"
        )

        # ----------------------------------------------------
        # REQUIRED FIELDS
        # ----------------------------------------------------

        if not current_password:
            return Response(
                {
                    "detail":
                    "Current password is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not new_password:
            return Response(
                {
                    "detail":
                    "New password is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not confirm_password:
            return Response(
                {
                    "detail":
                    "Password confirmation is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # CHECK CURRENT PASSWORD
        # ----------------------------------------------------

        user = request.user

        if not user.check_password(
            current_password
        ):
            return Response(
                {
                    "detail":
                    "Current password is incorrect."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # CHECK NEW PASSWORD MATCH
        # ----------------------------------------------------

        if new_password != confirm_password:
            return Response(
                {
                    "detail":
                    "New passwords do not match."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # PREVENT SAME PASSWORD
        # ----------------------------------------------------

        if user.check_password(
            new_password
        ):
            return Response(
                {
                    "detail":
                    "New password must be different from your current password."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # PASSWORD VALIDATION
        # ----------------------------------------------------

        if len(new_password) < 8:
            return Response(
                {
                    "detail":
                    "New password must be at least 8 characters long."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # SAVE PASSWORD
        # ----------------------------------------------------

        user.set_password(
            new_password
        )

        user.save(
            update_fields=[
                "password"
            ]
        )

        return Response(
            {
                "success": True,
                "message":
                "Password changed successfully."
            },
            status=status.HTTP_200_OK,
        )

# ============================================================
# SEND PHONE OTP
# ============================================================

class SendPhoneOTPView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def post(
        self,
        request,
    ):

        user = request.user

        phone = request.data.get(
            "phone"
        )

        if not phone:
            return Response(
                {
                    "detail":
                    "Phone number is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # NORMALIZE PHONE NUMBER
        # ----------------------------------------------------

        phone = str(phone).strip()

        if not phone:
            return Response(
                {
                    "detail":
                    "Phone number is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # BASIC PHONE VALIDATION
        # ----------------------------------------------------

        if not phone.isdigit():
            return Response(
                {
                    "detail":
                    "Phone number must contain only digits."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(phone) != 10:
            return Response(
                {
                    "detail":
                    "Please enter a valid 10-digit mobile number."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # CHECK IF PHONE ALREADY BELONGS TO ANOTHER USER
        # ----------------------------------------------------

        existing_user = (
            User.objects
            .filter(
                phone=phone
            )
            .exclude(
                id=user.id
            )
            .first()
        )

        if existing_user:
            return Response(
                {
                    "detail":
                    "This phone number is already registered to another account."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # IF THIS USER ALREADY HAS THIS VERIFIED PHONE
        # ----------------------------------------------------

        if (
            user.phone == phone
            and user.phone_verified
        ):
            return Response(
                {
                    "detail":
                    "This phone number is already verified."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # INVALIDATE PREVIOUS UNUSED VERIFICATION OTPs
        # ----------------------------------------------------

        PhoneOTP.objects.filter(
            user=user,
            purpose=PhoneOTP.Purpose.PHONE_VERIFICATION,
            is_used=False,
        ).update(
            is_used=True
        )

        # ----------------------------------------------------
        # GENERATE RANDOM 6-DIGIT OTP
        # ----------------------------------------------------

        otp = str(
            secrets.randbelow(900000) + 100000
        )

        # ----------------------------------------------------
        # OTP EXPIRES AFTER 10 MINUTES
        # ----------------------------------------------------

        expires_at = (
            timezone.now()
            + timezone.timedelta(
                minutes=10
            )
        )

        # ----------------------------------------------------
        # STORE HASHED OTP
        # ----------------------------------------------------

        PhoneOTP.objects.create(
            user=user,
            phone=phone,
            code_hash=make_password(
                otp
            ),
            purpose=PhoneOTP.Purpose.PHONE_VERIFICATION,
            expires_at=expires_at,
        )

        # ----------------------------------------------------
        # DEVELOPMENT RESPONSE
        #
        # IMPORTANT:
        # This OTP is returned only because we have not
        # connected an SMS provider yet.
        #
        # In production this field will be removed and the
        # OTP will be sent through SMS.
        # ----------------------------------------------------

        return Response(
            {
                "success": True,
                "message":
                "OTP generated successfully.",
                "expires_in": 600,

                # DEVELOPMENT ONLY
                "dev_otp": otp,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# VERIFY PHONE OTP
# ============================================================

class VerifyPhoneOTPView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def post(
        self,
        request,
    ):

        user = request.user

        phone = request.data.get(
            "phone"
        )

        otp = request.data.get(
            "otp"
        )

        # ----------------------------------------------------
        # REQUIRED FIELDS
        # ----------------------------------------------------

        if not phone:
            return Response(
                {
                    "detail":
                    "Phone number is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not otp:
            return Response(
                {
                    "detail":
                    "OTP is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        phone = str(phone).strip()
        otp = str(otp).strip()

        # ----------------------------------------------------
        # PHONE VALIDATION
        # ----------------------------------------------------

        if not phone.isdigit():
            return Response(
                {
                    "detail":
                    "Phone number must contain only digits."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(phone) != 10:
            return Response(
                {
                    "detail":
                    "Please enter a valid 10-digit mobile number."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # OTP FORMAT
        # ----------------------------------------------------

        if not otp.isdigit():
            return Response(
                {
                    "detail":
                    "OTP must contain only digits."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(otp) != 6:
            return Response(
                {
                    "detail":
                    "OTP must be 6 digits."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # CHECK PHONE IS NOT TAKEN BY ANOTHER USER
        # ----------------------------------------------------

        existing_user = (
            User.objects
            .filter(
                phone=phone
            )
            .exclude(
                id=user.id
            )
            .first()
        )

        if existing_user:
            return Response(
                {
                    "detail":
                    "This phone number is already registered to another account."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # GET LATEST UNUSED OTP
        # ----------------------------------------------------

        phone_otp = (
            PhoneOTP.objects
            .filter(
                user=user,
                phone=phone,
                purpose=PhoneOTP.Purpose.PHONE_VERIFICATION,
                is_used=False,
            )
            .order_by(
                "-created_at"
            )
            .first()
        )

        if not phone_otp:
            return Response(
                {
                    "detail":
                    "No active OTP found. Please request a new OTP."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # CHECK EXPIRY
        # ----------------------------------------------------

        if timezone.now() > phone_otp.expires_at:

            phone_otp.is_used = True

            phone_otp.save(
                update_fields=[
                    "is_used"
                ]
            )

            return Response(
                {
                    "detail":
                    "OTP has expired. Please request a new OTP."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # MAXIMUM ATTEMPTS
        # ----------------------------------------------------

        if phone_otp.attempts >= 5:

            phone_otp.is_used = True

            phone_otp.save(
                update_fields=[
                    "is_used"
                ]
            )

            return Response(
                {
                    "detail":
                    "Too many incorrect attempts. Please request a new OTP."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # CHECK OTP
        # ----------------------------------------------------

        if not check_password(
            otp,
            phone_otp.code_hash
        ):

            phone_otp.attempts += 1

            phone_otp.save(
                update_fields=[
                    "attempts"
                ]
            )

            remaining_attempts = (
                5 - phone_otp.attempts
            )

            return Response(
                {
                    "detail":
                    "Invalid OTP.",
                    "remaining_attempts":
                    remaining_attempts,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # OTP SUCCESS
        # ----------------------------------------------------

        phone_otp.is_used = True

        phone_otp.save(
            update_fields=[
                "is_used"
            ]
        )

        # ----------------------------------------------------
        # REGISTER + VERIFY PHONE
        # ----------------------------------------------------

        user.phone = phone
        user.phone_verified = True

        user.save(
            update_fields=[
                "phone",
                "phone_verified",
            ]
        )

        return Response(
            {
                "success": True,
                "message":
                "Phone number verified successfully.",
                "phone":
                user.phone,
                "phone_verified":
                user.phone_verified,
            },
            status=status.HTTP_200_OK,
        )

# ============================================================
# SEND CHANGE PHONE OTP
# ============================================================

class SendChangePhoneOTPView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def post(
        self,
        request,
    ):

        user = request.user

        phone = str(
            request.data.get(
                "phone",
                ""
            )
        ).strip()

        # ----------------------------------------------------
        # VALIDATE PHONE
        # ----------------------------------------------------

        if not phone.isdigit() or len(phone) != 10:

            return Response(
                {
                    "success": False,
                    "message": (
                        "Enter a valid 10-digit "
                        "phone number."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # NEW NUMBER MUST BE DIFFERENT
        # ----------------------------------------------------

        if user.phone == phone:

            return Response(
                {
                    "success": False,
                    "message": (
                        "This is already your "
                        "current phone number."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # CHECK WHETHER NUMBER IS ALREADY USED
        # ----------------------------------------------------

        existing_user = User.objects.filter(
            phone=phone
        ).exclude(
            id=user.id
        ).first()

        if existing_user:

            return Response(
                {
                    "success": False,
                    "message": (
                        "This phone number is already "
                        "registered to another account."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # INVALIDATE PREVIOUS PHONE CHANGE OTPs
        # ----------------------------------------------------

        PhoneOTP.objects.filter(
            user=user,
            purpose=PhoneOTP.Purpose.PHONE_CHANGE,
            is_used=False,
        ).update(
            is_used=True
        )

        # ----------------------------------------------------
        # GENERATE OTP
        # ----------------------------------------------------

        otp = str(
            secrets.randbelow(900000) + 100000
        )

        code_hash = make_password(
            otp
        )

        expires_at = (
            timezone.now()
            + timedelta(minutes=10)
        )

        PhoneOTP.objects.create(
            user=user,
            phone=phone,
            code_hash=code_hash,
            purpose=PhoneOTP.Purpose.PHONE_CHANGE,
            expires_at=expires_at,
        )

        return Response(
            {
                "success": True,
                "message": (
                    "OTP generated successfully."
                ),
                "expires_in": 600,

                # DEVELOPMENT ONLY
                "dev_otp": otp,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# VERIFY CHANGE PHONE OTP
# ============================================================

class VerifyChangePhoneOTPView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def post(
        self,
        request,
    ):

        user = request.user

        phone = str(
            request.data.get(
                "phone",
                ""
            )
        ).strip()

        otp = str(
            request.data.get(
                "otp",
                ""
            )
        ).strip()

        # ----------------------------------------------------
        # VALIDATE PHONE
        # ----------------------------------------------------

        if not phone.isdigit() or len(phone) != 10:

            return Response(
                {
                    "success": False,
                    "message": (
                        "Enter a valid 10-digit "
                        "phone number."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # VALIDATE OTP
        # ----------------------------------------------------

        if not otp.isdigit() or len(otp) != 6:

            return Response(
                {
                    "success": False,
                    "message": (
                        "Enter a valid 6-digit OTP."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # CHECK NUMBER IS STILL AVAILABLE
        # ----------------------------------------------------

        existing_user = User.objects.filter(
            phone=phone
        ).exclude(
            id=user.id
        ).first()

        if existing_user:

            return Response(
                {
                    "success": False,
                    "message": (
                        "This phone number is already "
                        "registered to another account."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # GET LATEST OTP
        # ----------------------------------------------------

        phone_otp = PhoneOTP.objects.filter(
            user=user,
            phone=phone,
            purpose=PhoneOTP.Purpose.PHONE_CHANGE,
            is_used=False,
        ).order_by(
            "-created_at"
        ).first()

        if not phone_otp:

            return Response(
                {
                    "success": False,
                    "message": (
                        "No active OTP found. "
                        "Please request a new OTP."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # CHECK EXPIRY
        # ----------------------------------------------------

        if timezone.now() > phone_otp.expires_at:

            phone_otp.is_used = True
            phone_otp.save(
                update_fields=[
                    "is_used"
                ]
            )

            return Response(
                {
                    "success": False,
                    "message": (
                        "OTP has expired. "
                        "Please request a new OTP."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # MAXIMUM ATTEMPTS
        # ----------------------------------------------------

        if phone_otp.attempts >= 5:

            phone_otp.is_used = True
            phone_otp.save(
                update_fields=[
                    "is_used"
                ]
            )

            return Response(
                {
                    "success": False,
                    "message": (
                        "Too many incorrect attempts. "
                        "Please request a new OTP."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # VERIFY OTP
        # ----------------------------------------------------

        if not check_password(
            otp,
            phone_otp.code_hash
        ):

            phone_otp.attempts += 1

            if phone_otp.attempts >= 5:
                phone_otp.is_used = True

            phone_otp.save(
                update_fields=[
                    "attempts",
                    "is_used",
                ]
            )

            return Response(
                {
                    "success": False,
                    "message": (
                        "Incorrect OTP."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # SUCCESS
        # ----------------------------------------------------

        phone_otp.is_used = True
        phone_otp.save(
            update_fields=[
                "is_used"
            ]
        )

        user.phone = phone
        user.phone_verified = True

        user.save(
            update_fields=[
                "phone",
                "phone_verified",
            ]
        )

        return Response(
            {
                "success": True,
                "message": (
                    "Phone number changed "
                    "successfully."
                ),
                "phone": user.phone,
                "phone_verified": (
                    user.phone_verified
                ),
            },
            status=status.HTTP_200_OK,
        )

# ============================================================
# FORGOT PASSWORD - SEND OTP
# ============================================================

class SendForgotPasswordOTPView(APIView):

    permission_classes = []

    def post(
        self,
        request,
    ):

        phone = str(
            request.data.get("phone", "")
        ).strip()

        if not phone.isdigit() or len(phone) != 10:

            return Response(
                {
                    "success": False,
                    "message": "Enter a valid 10-digit phone number.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(
            phone=phone,
            phone_verified=True,
        ).first()

        # For production we should keep this generic
        # to prevent account enumeration.
        if not user:

            return Response(
                {
                    "success": False,
                    "message": "No verified account found for this phone number.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # Invalidate previous unused password-reset OTPs.
        PhoneOTP.objects.filter(
            user=user,
            phone=phone,
            purpose=PhoneOTP.Purpose.PASSWORD_RESET,
            is_used=False,
        ).update(
            is_used=True,
        )

        # Generate a random 6-digit OTP.
        otp = str(
            secrets.randbelow(900000) + 100000
        )

        PhoneOTP.objects.create(
            user=user,
            phone=phone,
            code_hash=make_password(otp),
            purpose=PhoneOTP.Purpose.PASSWORD_RESET,
            expires_at=timezone.now()
            + timezone.timedelta(minutes=10),
        )

        return Response(
            {
                "success": True,
                "message": "Password reset OTP generated successfully.",
                "expires_in": 600,

                # DEVELOPMENT ONLY.
                # Remove this before production.
                "dev_otp": otp,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# FORGOT PASSWORD - RESET PASSWORD
# ============================================================

class ForgotPasswordResetView(APIView):

    permission_classes = []

    def post(
        self,
        request,
    ):

        phone = str(
            request.data.get("phone", "")
        ).strip()

        otp = str(
            request.data.get("otp", "")
        ).strip()

        new_password = str(
            request.data.get("new_password", "")
        )

        if not phone.isdigit() or len(phone) != 10:

            return Response(
                {
                    "success": False,
                    "message": "Enter a valid 10-digit phone number.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not otp.isdigit() or len(otp) != 6:

            return Response(
                {
                    "success": False,
                    "message": "Enter a valid 6-digit OTP.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 8:

            return Response(
                {
                    "success": False,
                    "message": "Password must be at least 8 characters.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(
            phone=phone,
            phone_verified=True,
        ).first()

        if not user:

            return Response(
                {
                    "success": False,
                    "message": "Invalid phone number.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        phone_otp = (
            PhoneOTP.objects
            .filter(
                user=user,
                phone=phone,
                purpose=PhoneOTP.Purpose.PASSWORD_RESET,
                is_used=False,
            )
            .order_by("-created_at")
            .first()
        )

        if not phone_otp:

            return Response(
                {
                    "success": False,
                    "message": "OTP not found. Please request a new OTP.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if phone_otp.expires_at < timezone.now():

            phone_otp.is_used = True
            phone_otp.save(
                update_fields=["is_used"]
            )

            return Response(
                {
                    "success": False,
                    "message": "OTP has expired. Please request a new OTP.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if phone_otp.attempts >= 5:

            phone_otp.is_used = True
            phone_otp.save(
                update_fields=["is_used"]
            )

            return Response(
                {
                    "success": False,
                    "message": "Too many incorrect attempts. Please request a new OTP.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not check_password(
            otp,
            phone_otp.code_hash,
        ):

            phone_otp.attempts += 1

            if phone_otp.attempts >= 5:
                phone_otp.is_used = True

            phone_otp.save(
                update_fields=[
                    "attempts",
                    "is_used",
                ]
            )

            return Response(
                {
                    "success": False,
                    "message": "Invalid OTP.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # OTP is correct.
        user.set_password(
            new_password
        )

        user.save(
            update_fields=[
                "password",
            ]
        )

        phone_otp.is_used = True

        phone_otp.save(
            update_fields=[
                "is_used",
            ]
        )

        return Response(
            {
                "success": True,
                "message": "Password reset successfully.",
            },
            status=status.HTTP_200_OK,
        )