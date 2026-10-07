from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .permissions import IsFounderUserRole

from companies.serializers import (
    FounderCompanySerializer,
)


class FounderCompanyCreateView(APIView):

    permission_classes = [
        IsFounderUserRole,
    ]

    def post(self, request):

        serializer = FounderCompanySerializer(
            data=request.data
        )

        if not serializer.is_valid():

            return Response(
                {
                    "success": False,
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        company = serializer.save()

        return Response(
            {
                "success": True,
                "message": "Company created successfully.",
                "company": FounderCompanySerializer(
                    company
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )