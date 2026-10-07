from django.contrib.auth import get_user_model

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .permissions import IsFounderUserRole

from companies.models import Company


User = get_user_model()


# ============================================================
# FOUNDER PLATFORM STATISTICS
# ============================================================

class FounderStatsView(APIView):

    permission_classes = [
        IsFounderUserRole,
    ]

    def get(self, request):

        companies = Company.objects.all()

        stats = {
            "total_companies": companies.count(),

            "active_companies": companies.filter(
                status=Company.Status.ACTIVE
            ).count(),

            "suspended_companies": companies.filter(
                status=Company.Status.SUSPENDED
            ).count(),

            "deactivated_companies": companies.filter(
                status=Company.Status.DEACTIVATED
            ).count(),

            "total_admins": User.objects.filter(
                role=User.Role.ADMIN
            ).count(),

            "total_workers": User.objects.filter(
                role=User.Role.WORKER
            ).count(),

            "total_customers": User.objects.filter(
                role=User.Role.CUSTOMER
            ).count(),

            "total_founders": User.objects.filter(
                role=User.Role.FOUNDER
            ).count(),

            "active_users": User.objects.filter(
                is_active=True
            ).count(),

            "inactive_users": User.objects.filter(
                is_active=False
            ).count(),
        }

        try:

            from service_requests.models import ServiceRequest

            stats["total_service_requests"] = (
                ServiceRequest.objects.count()
            )

        except Exception:

            stats["total_service_requests"] = 0

        try:

            from work_orders.models import WorkOrder

            stats["total_work_orders"] = (
                WorkOrder.objects.count()
            )

        except Exception:

            stats["total_work_orders"] = 0

        return Response(
            {
                "success": True,
                "stats": stats,
            }
        )


# ============================================================
# COMPANY STATUS
# ============================================================

class FounderCompanyStatusView(APIView):

    permission_classes = [
        IsFounderUserRole,
    ]

    def patch(
        self,
        request,
        company_id,
    ):

        try:

            company = Company.objects.get(
                id=company_id
            )

        except Company.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Company not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        new_status = request.data.get(
            "status"
        )

        allowed_statuses = [
            Company.Status.ACTIVE,
            Company.Status.SUSPENDED,
            Company.Status.DEACTIVATED,
        ]

        if new_status not in allowed_statuses:

            return Response(
                {
                    "success": False,
                    "message": "Invalid company status.",
                    "allowed_statuses": allowed_statuses,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        company.status = new_status
        company.save()

        return Response(
            {
                "success": True,
                "message": (
                    f"Company status changed to "
                    f"{company.status}."
                ),
                "company": {
                    "id": company.id,
                    "name": company.name,
                    "status": company.status,
                },
            }
        )


# ============================================================
# ADMIN ACTIVE / INACTIVE
# ============================================================

class FounderAdminStatusView(APIView):

    permission_classes = [
        IsFounderUserRole,
    ]

    def patch(
        self,
        request,
        admin_id,
    ):

        try:

            admin = User.objects.get(
                id=admin_id,
                role=User.Role.ADMIN,
            )

        except User.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Admin not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        is_active_value = request.data.get(
            "is_active",
            True,
        )

        if isinstance(
            is_active_value,
            str,
        ):

            is_active_value = (
                is_active_value.lower()
                in [
                    "true",
                    "1",
                    "yes",
                    "active",
                ]
            )

        admin.is_active = bool(
            is_active_value
        )

        admin.save()

        return Response(
            {
                "success": True,
                "message": (
                    "Admin account enabled."
                    if admin.is_active
                    else
                    "Admin account disabled."
                ),
                "admin": {
                    "id": admin.id,
                    "username": admin.username,
                    "is_active": admin.is_active,
                },
            }
        )


# ============================================================
# ADMIN PASSWORD RESET
# ============================================================

class FounderAdminPasswordResetView(APIView):

    permission_classes = [
        IsFounderUserRole,
    ]

    def post(
        self,
        request,
        admin_id,
    ):

        try:

            admin = User.objects.get(
                id=admin_id,
                role=User.Role.ADMIN,
            )

        except User.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Admin not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        new_password = request.data.get(
            "password"
        )

        if not new_password:

            return Response(
                {
                    "success": False,
                    "message": "Password is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 8:

            return Response(
                {
                    "success": False,
                    "message": (
                        "Password must contain "
                        "at least 8 characters."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        admin.set_password(
            new_password
        )

        admin.save()

        return Response(
            {
                "success": True,
                "message": (
                    "Admin password reset successfully."
                ),
            }
        )


# ============================================================
# DELETE ADMIN
# ============================================================

class FounderAdminDeleteView(APIView):

    permission_classes = [
        IsFounderUserRole,
    ]

    def delete(
        self,
        request,
        admin_id,
    ):

        try:

            admin = User.objects.get(
                id=admin_id,
                role=User.Role.ADMIN,
            )

        except User.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Admin not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        company = admin.company

        if not company:

            return Response(
                {
                    "success": False,
                    "message": (
                        "This Admin is not linked "
                        "to a company."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        admin_count = User.objects.filter(
            company=company,
            role=User.Role.ADMIN,
        ).count()

        # Never allow a company to lose its
        # only Admin.
        if admin_count <= 1:

            return Response(
                {
                    "success": False,
                    "message": (
                        "Cannot delete the last Admin "
                        "of a company. Create another "
                        "Admin before deleting this account."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        username = admin.username

        admin.delete()

        return Response(
            {
                "success": True,
                "message": (
                    f"Admin '{username}' deleted successfully."
                ),
                "deleted_admin_id": admin_id,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# ALL PLATFORM USERS
# ============================================================

class FounderUsersView(APIView):

    permission_classes = [
        IsFounderUserRole,
    ]

    def get(self, request):

        users = User.objects.select_related(
            "company"
        ).all().order_by(
            "-date_joined"
        )

        search = request.query_params.get(
            "search",
            "",
        ).strip()

        role = request.query_params.get(
            "role",
            "",
        ).strip()

        if search:

            users = users.filter(
                username__icontains=search
            )

        if role:

            users = users.filter(
                role=role
            )

        data = []

        for user in users:

            data.append(
                {
                    "id": user.id,
                    "username": user.username,
                    "role": user.role,
                    "phone": user.phone,
                    "employee_id": user.employee_id,
                    "is_active": user.is_active,
                    "company_id": (
                        user.company_id
                    ),
                    "company_name": (
                        user.company.name
                        if user.company
                        else None
                    ),
                    "date_joined": (
                        user.date_joined
                    ),
                }
            )

        return Response(
            {
                "success": True,
                "count": len(data),
                "users": data,
            }
        )