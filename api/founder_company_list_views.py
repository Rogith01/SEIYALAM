from rest_framework.views import APIView
from rest_framework.response import Response

from .permissions import IsFounderUserRole

from companies.models import Company
from companies.serializers import FounderCompanySerializer


class FounderCompanyListView(APIView):

    permission_classes = [
        IsFounderUserRole,
    ]

    def get(self, request):

        companies = Company.objects.all().order_by(
            "-created_at"
        )

        serializer = FounderCompanySerializer(
            companies,
            many=True,
        )

        return Response(
            {
                "success": True,
                "count": companies.count(),
                "companies": serializer.data,
            }
        )