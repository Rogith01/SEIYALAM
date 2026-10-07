from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .permissions import IsFounderUserRole

from companies.models import Company

from companies.serializers import (
    FounderAdminSerializer,
)

from accounts.models import User


class FounderAdminCreateView(APIView):

    permission_classes = [
        IsFounderUserRole,
    ]

    def post(
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

        if company.status != Company.Status.ACTIVE:

            return Response(
                {
                    "success": False,
                    "message": (
                        "Cannot create an Admin "
                        "for an inactive company."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = FounderAdminSerializer(
            data=request.data,
            context={
                "company": company,
            },
        )

        if not serializer.is_valid():

            return Response(
                {
                    "success": False,
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        admin_user = serializer.save()

        return Response(
            {
                "success": True,
                "message": (
                    "Admin account created "
                    "successfully."
                ),
                "admin": {
                    "id": admin_user.id,
                    "username": admin_user.username,
                    "role": admin_user.role,
                    "company_id": (
                        admin_user.company_id
                    ),
                    "phone": admin_user.phone,
                    "employee_id": (
                        admin_user.employee_id
                    ),
                    "is_active": (
                        admin_user.is_active
                    ),
                },
            },
            status=status.HTTP_201_CREATED,
        )


class FounderCompanyAdminListView(APIView):

    permission_classes = [
        IsFounderUserRole,
    ]

    def get(
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

        admins = User.objects.filter(
            company=company,
            role=User.Role.ADMIN,
        ).order_by(
            "-date_joined"
        )

        data = []

        for admin in admins:

            data.append(
                {
                    "id": admin.id,
                    "username": admin.username,
                    "role": admin.role,
                    "company_id": admin.company_id,
                    "phone": admin.phone,
                    "employee_id": admin.employee_id,
                    "is_active": admin.is_active,
                    "date_joined": admin.date_joined,
                }
            )

        return Response(
            {
                "success": True,
                "company_id": company.id,
                "count": len(data),
                "admins": data,
            }
        )