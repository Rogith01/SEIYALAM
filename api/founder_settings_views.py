from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .permissions import IsFounderUserRole

from companies.models import PlatformSettings

from companies.serializers import (
    PlatformSettingsSerializer,
)


class FounderPlatformSettingsView(
    APIView
):

    permission_classes = [
        IsFounderUserRole,
    ]

    def get(
        self,
        request,
    ):

        settings = (
            PlatformSettings.get_settings()
        )

        serializer = PlatformSettingsSerializer(
            settings
        )

        return Response(
            {
                "success": True,
                "settings": serializer.data,
            }
        )

    def patch(
        self,
        request,
    ):

        settings = (
            PlatformSettings.get_settings()
        )

        serializer = PlatformSettingsSerializer(
            settings,
            data=request.data,
            partial=True,
        )

        if not serializer.is_valid():

            return Response(
                {
                    "success": False,
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        settings = serializer.save()

        return Response(
            {
                "success": True,
                "message": (
                    "Platform settings updated successfully."
                ),
                "settings": (
                    PlatformSettingsSerializer(
                        settings
                    ).data
                ),
            }
        )