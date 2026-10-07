from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .permissions import IsFounderUserRole

from companies.models import Company


class FounderDashboardView(APIView):

    permission_classes = [
        IsFounderUserRole,
    ]

    def get(self, request):

        return Response(
            {
                "message": "Welcome to the SEIYALAM Founder Dashboard.",
                "user": request.user.username,
                "role": request.user.role,
            }
        )


# ============================================================
# FOUNDER COMPANY MANAGEMENT
# ============================================================

class FounderCompanyDetailView(APIView):

    permission_classes = [
        IsFounderUserRole,
    ]

    def get(self, request, pk):

        try:

            company = Company.objects.get(
                pk=pk
            )

        except Company.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Company not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {
                "success": True,
                "company": {
                    "id": company.id,
                    "name": company.name,
                    "phone": company.phone,
                    "email": company.email,
                    "address": company.address,
                    "status": company.status,
                },
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, pk):

        try:

            company = Company.objects.get(
                pk=pk
            )

        except Company.DoesNotExist:

            return Response(
                {
                    "success": False,
                    "message": "Company not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # ----------------------------------------------------
        # UPDATE COMPANY DETAILS
        # ----------------------------------------------------

        allowed_fields = [
            "name",
            "phone",
            "email",
            "address",
            "status",
        ]

        for field in allowed_fields:

            if field in request.data:

                setattr(
                    company,
                    field,
                    request.data[field],
                )

        # ----------------------------------------------------
        # REQUIRED COMPANY NAME
        # ----------------------------------------------------

        if not company.name.strip():

            return Response(
                {
                    "success": False,
                    "message": "Company name cannot be empty.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        company.save()

        return Response(
            {
                "success": True,
                "message": "Company details updated successfully.",
                "company": {
                    "id": company.id,
                    "name": company.name,
                    "phone": company.phone,
                    "email": company.email,
                    "address": company.address,
                    "status": company.status,
                },
            },
            status=status.HTTP_200_OK,
        )