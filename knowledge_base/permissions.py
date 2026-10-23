
from rest_framework.permissions import BasePermission


class IsCompanyKnowledgeAdmin(BasePermission):
    """
    Only authenticated Founder or Admin users may manage
    company knowledge documents.
    """

    message = (
        "Only authorized company administrators can manage "
        "knowledge documents."
    )

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if user.role == "ADMIN":
            return user.company_id is not None

        # Founders may manage documents for a company only
        # through a separately authorized company selection.
        return user.role == "FOUNDER"
