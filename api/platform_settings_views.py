from rest_framework.views import APIView
from rest_framework.response import Response

from companies.models import PlatformSettings


class PublicPlatformSettingsView(
    APIView
):

    authentication_classes = []
    permission_classes = []

    def get(
        self,
        request,
    ):

        settings = (
            PlatformSettings.get_settings()
        )

        return Response(
            {
                "success": True,

                "platform": {
                    "name": settings.platform_name,
                    "currency": settings.default_currency,
                    "timezone": settings.default_timezone,
                    "language": settings.default_language,
                },

                "support": {
                    "email": settings.support_email,
                    "phone": settings.support_phone,
                    "website": settings.support_website,
                },

                "maintenance": {
                    "enabled": settings.maintenance_mode,
                    "message": settings.maintenance_message,
                },

                "access": {
                    "allow_customer_registration": (
                        settings.allow_customer_registration
                    ),
                },

                "announcement": (
                    settings.platform_announcement
                ),
            }
        )