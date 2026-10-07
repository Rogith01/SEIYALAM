from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
)

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
)

from rest_framework.exceptions import (
    AuthenticationFailed,
)

from accounts.models import User

from companies.models import PlatformSettings


class SeiyalamTokenObtainPairSerializer(
    TokenObtainPairSerializer
):

    @classmethod
    def get_token(cls, user):

        token = super().get_token(user)

        token["role"] = user.role

        if user.company_id:

            token["company_id"] = (
                user.company_id
            )

        return token

    def validate(self, attrs):

        data = super().validate(attrs)

        user = self.user

        # ----------------------------------------------------
        # Account status
        # ----------------------------------------------------

        if not user.is_active:

            raise AuthenticationFailed(
                "This account is inactive."
            )

        # ----------------------------------------------------
        # Founder is handled separately and is never blocked
        # by platform maintenance mode.
        # ----------------------------------------------------

        if user.role == User.Role.FOUNDER:

            return data

        # ----------------------------------------------------
        # MAINTENANCE MODE
        #
        # Customer/Admin/Worker login is blocked.
        # Founder login remains available.
        # ----------------------------------------------------

        settings = (
            PlatformSettings.get_settings()
        )

        if settings.maintenance_mode:

            message = (
                settings.maintenance_message
                or (
                    "SEIYALAM is currently under "
                    "maintenance. Please try again later."
                )
            )

            raise AuthenticationFailed(
                message
            )

        # ----------------------------------------------------
        # ADMIN / WORKER COMPANY VALIDATION
        # ----------------------------------------------------

        if user.role in [
            User.Role.ADMIN,
            User.Role.WORKER,
        ]:

            if not user.company:

                raise AuthenticationFailed(
                    "This account is not linked "
                    "to a company."
                )

            if (
                user.company.status
                != user.company.Status.ACTIVE
            ):

                raise AuthenticationFailed(
                    "This company is currently "
                    f"{user.company.status.lower()}."
                )

        return data


class SeiyalamTokenObtainPairView(
    TokenObtainPairView
):

    serializer_class = (
        SeiyalamTokenObtainPairSerializer
    )


class FounderTokenObtainPairSerializer(
    TokenObtainPairSerializer
):

    @classmethod
    def get_token(cls, user):

        token = super().get_token(user)

        token["role"] = user.role

        return token

    def validate(self, attrs):

        data = super().validate(attrs)

        user = self.user

        if user.role != User.Role.FOUNDER:

            raise AuthenticationFailed(
                "Founder access required."
            )

        if not user.is_active:

            raise AuthenticationFailed(
                "Founder account is inactive."
            )

        # ----------------------------------------------------
        # IMPORTANT:
        #
        # Founder login is NOT affected by maintenance mode.
        # ----------------------------------------------------

        return data


class FounderTokenObtainPairView(
    TokenObtainPairView
):

    serializer_class = (
        FounderTokenObtainPairSerializer
    )

# ============================================================
# CUSTOMER LOGIN
# ============================================================

class CustomerTokenObtainPairSerializer(
    TokenObtainPairSerializer
):

    def validate(self, attrs):

        login = attrs.get("username")
        password = attrs.get("password")

        if not login or not password:

            raise AuthenticationFailed(
                "Username/mobile and password are required."
            )

        login = login.strip()

        # ----------------------------------------------------
        # FIND CUSTOMER
        #
        # If login is a 10-digit mobile number, search only
        # CUSTOMER accounts.
        #
        # This allows the same phone number to exist on a
        # staff account and a customer account.
        # ----------------------------------------------------

        if login.isdigit() and len(login) == 10:

            user = User.objects.filter(
                phone=login,
                role=User.Role.CUSTOMER,
            ).first()

        else:

            user = User.objects.filter(
                username__iexact=login,
                role=User.Role.CUSTOMER,
            ).first()

        if not user:

            raise AuthenticationFailed(
                "Invalid customer username/mobile or password."
            )

        # ----------------------------------------------------
        # PASSWORD
        # ----------------------------------------------------

        if not user.check_password(password):

            raise AuthenticationFailed(
                "Invalid customer username/mobile or password."
            )

        # ----------------------------------------------------
        # ACCOUNT STATUS
        # ----------------------------------------------------

        if not user.is_active:

            raise AuthenticationFailed(
                "This customer account is inactive."
            )

        # ----------------------------------------------------
        # MAINTENANCE MODE
        # ----------------------------------------------------

        settings = (
            PlatformSettings.get_settings()
        )

        if settings.maintenance_mode:

            message = (
                settings.maintenance_message
                or (
                    "SEIYALAM is currently under "
                    "maintenance. Please try again later."
                )
            )

            raise AuthenticationFailed(
                message
            )

        # ----------------------------------------------------
        # CREATE JWT TOKEN
        # ----------------------------------------------------

        self.user = user

        data = {}

        refresh = self.get_token(user)

        data["refresh"] = str(refresh)

        data["access"] = str(
            refresh.access_token
        )

        return data

    @classmethod
    def get_token(cls, user):

        token = super().get_token(user)

        token["role"] = user.role

        if user.company_id:

            token["company_id"] = (
                user.company_id
            )

        return token


class CustomerTokenObtainPairView(
    TokenObtainPairView
):

    serializer_class = (
        CustomerTokenObtainPairSerializer
    )