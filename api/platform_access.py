from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed

from companies.models import PlatformSettings
from accounts.models import User


class SeiyalamJWTAuthentication(JWTAuthentication):

    def authenticate(self, request):

        result = super().authenticate(request)

        if result is None:
            return None

        user, validated_token = result

        # Founder can always access the platform,
        # even when maintenance mode is enabled.
        if user.role == User.Role.FOUNDER:
            return user, validated_token

        settings = PlatformSettings.get_settings()

        # Block normal users during maintenance mode.
        if settings.maintenance_mode:

            message = (
                settings.maintenance_message
                or (
                    "SEIYALAM is currently under maintenance. "
                    "Please try again later."
                )
            )

            raise AuthenticationFailed(message)

        return user, validated_token