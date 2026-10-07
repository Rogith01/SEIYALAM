from django.urls import path

from .views import (
    CurrentUserView,
    ChangePasswordView,
    SendPhoneOTPView,
    VerifyPhoneOTPView,
    SendChangePhoneOTPView,
    VerifyChangePhoneOTPView,
    SendForgotPasswordOTPView,
    ForgotPasswordResetView,
    WSTicketView,
    CompanyListView,
    CompanyDetailView,
    CustomerCompanyListView,
    CustomerListView,
    SkillListCreateView,
    WorkerListView,
    WorkerCreateView,
    WorkerDetailView,
    ServiceRequestListCreateView,
    MyServiceRequestListView,
    ServiceRequestDetailView,
    WorkOrderListCreateView,
    MyWorkOrderListView,
    WorkOrderDetailView,
    WorkOrderActionView,
    WorkLogListCreateView,
    WorkEvidenceListCreateView,
    NotificationListView,
    NotificationReadView,
    AuditLogListView,
    AdminDashboardView,
    WorkerDashboardView,
    CustomerDashboardView,
    CustomerRegistrationView,
    CustomerProfileUpdateView,
)

from .founder_views import (
    FounderDashboardView,
    FounderCompanyDetailView,
)

from .founder_company_views import (
    FounderCompanyCreateView,
)

from .founder_admin_views import (
    FounderAdminCreateView,
    FounderCompanyAdminListView,
)

from .founder_company_list_views import (
    FounderCompanyListView,
)
from .founder_management_views import (
    FounderStatsView,
    FounderCompanyStatusView,
    FounderAdminStatusView,
    FounderAdminPasswordResetView,
    FounderUsersView,
    FounderAdminDeleteView,
)
from .founder_settings_views import (
    FounderPlatformSettingsView,
)

from .platform_settings_views import (
    PublicPlatformSettingsView,
)
urlpatterns = [

    # ========================================================
    # CURRENT USER
    # ========================================================

    path(
        "me/",
        CurrentUserView.as_view(),
        name="current-user",
    ),

    # ========================================================
    # AUTHENTICATION
    # ========================================================

    path(
        "auth/change-password/",
        ChangePasswordView.as_view(),
        name="change-password",
    ),

    path(
        "auth/send-phone-otp/",
        SendPhoneOTPView.as_view(),
        name="send-phone-otp",
    ),

    path(
        "auth/verify-phone-otp/",
        VerifyPhoneOTPView.as_view(),
        name="verify-phone-otp",
    ),

    path(
        "auth/send-change-phone-otp/",
        SendChangePhoneOTPView.as_view(),
        name="send-change-phone-otp",
    ),

    path(
        "auth/verify-change-phone-otp/",
        VerifyChangePhoneOTPView.as_view(),
        name="verify-change-phone-otp",
    ),

    path(
        "auth/forgot-password/send-otp/",
        SendForgotPasswordOTPView.as_view(),
        name="forgot-password-send-otp",
    ),

    path(
        "auth/forgot-password/reset/",
        ForgotPasswordResetView.as_view(),
        name="forgot-password-reset",
    ),

    path(
        "auth/ws-ticket/",
        WSTicketView.as_view(),
        name="ws-ticket",
    ),

    # ========================================================
    # COMPANIES
    # ========================================================

    path(
        "companies/",
        CompanyListView.as_view(),
        name="company-list",
    ),

    path(
        "companies/<int:pk>/",
        CompanyDetailView.as_view(),
        name="company-detail",
    ),

    path(
        "customer/companies/",
        CustomerCompanyListView.as_view(),
        name="customer-company-list",
    ),

    # ========================================================
    # CUSTOMERS
    # ========================================================

    path(
    "customer/register/",
    CustomerRegistrationView.as_view(),
    name="customer-register",
    ),

    path(
        "customers/",
        CustomerListView.as_view(),
        name="customer-list",
    ),

    path(
    "me/update/",
    CustomerProfileUpdateView.as_view(),
    name="customer-profile-update",
    ),

    # ========================================================
    # SKILLS
    # ========================================================

    path(
        "skills/",
        SkillListCreateView.as_view(),
        name="skill-list-create",
    ),

    # ========================================================
    # WORKERS
    # ========================================================

    path(
        "workers/",
        WorkerListView.as_view(),
        name="worker-list",
    ),

    path(
        "workers/create/",
        WorkerCreateView.as_view(),
        name="worker-create",
    ),

    path(
        "workers/<int:pk>/",
        WorkerDetailView.as_view(),
        name="worker-detail",
    ),

    # ========================================================
    # SERVICE REQUESTS
    # ========================================================

    path(
        "service-requests/",
        ServiceRequestListCreateView.as_view(),
        name="service-request-list-create",
    ),

    path(
        "service-requests/my/",
        MyServiceRequestListView.as_view(),
        name="my-service-requests",
    ),

    path(
        "service-requests/<int:pk>/",
        ServiceRequestDetailView.as_view(),
        name="service-request-detail",
    ),

    # ========================================================
    # WORK ORDERS
    # ========================================================

    path(
        "work-orders/",
        WorkOrderListCreateView.as_view(),
        name="work-order-list-create",
    ),

    path(
        "work-orders/my/",
        MyWorkOrderListView.as_view(),
        name="my-work-orders",
    ),

    path(
        "work-orders/<int:pk>/",
        WorkOrderDetailView.as_view(),
        name="work-order-detail",
    ),

    path(
        "work-orders/<int:pk>/<str:action>/",
        WorkOrderActionView.as_view(),
        name="work-order-action",
    ),

    # ========================================================
    # WORK LOGS
    # ========================================================

    path(
        "work-logs/",
        WorkLogListCreateView.as_view(),
        name="work-log-list-create",
    ),

    path(
        "work-evidence/",
        WorkEvidenceListCreateView.as_view(),
        name="work-evidence-list-create",
    ),

    # ========================================================
    # NOTIFICATIONS
    # ========================================================

    path(
        "notifications/",
        NotificationListView.as_view(),
        name="notification-list",
    ),

    path(
        "notifications/<int:pk>/read/",
        NotificationReadView.as_view(),
        name="notification-read",
    ),

    # ========================================================
    # AUDIT LOGS
    # ========================================================

    path(
        "audit-logs/",
        AuditLogListView.as_view(),
        name="audit-log-list",
    ),

    # ========================================================
    # DASHBOARDS
    # ========================================================

    path(
        "dashboard/admin/",
        AdminDashboardView.as_view(),
        name="admin-dashboard",
    ),

    path(
        "dashboard/worker/",
        WorkerDashboardView.as_view(),
        name="worker-dashboard",
    ),

    path(
        "dashboard/customer/",
        CustomerDashboardView.as_view(),
        name="customer-dashboard",
    ),

    # ========================================================
    # FOUNDER
    # ========================================================

    path(
        "founder/dashboard/",
        FounderDashboardView.as_view(),
        name="founder-dashboard",
    ),

    path(
        "founder/companies/",
        FounderCompanyCreateView.as_view(),
        name="founder-company-create",
    ),

    path(
    "founder/companies/<int:pk>/",
    FounderCompanyDetailView.as_view(),
    name="founder-company-detail",
),

    path(
        "founder/companies/<int:company_id>/admin/",
        FounderAdminCreateView.as_view(),
        name="founder-admin-create",
    ),

    path(
        "founder/companies/list/",
        FounderCompanyListView.as_view(),
        name="founder-company-list",
    ),

    path(
    "founder/companies/<int:company_id>/admins/",
    FounderCompanyAdminListView.as_view(),
    name="founder-company-admin-list",
),

path(
    "founder/stats/",
    FounderStatsView.as_view(),
    name="founder-stats",
),

path(
    "founder/companies/<int:company_id>/status/",
    FounderCompanyStatusView.as_view(),
    name="founder-company-status",
),

path(
    "founder/companies/<int:company_id>/admin/",
    FounderAdminCreateView.as_view(),
    name="founder-company-admin-create",
),

path(
    "founder/companies/<int:company_id>/admins/",
    FounderCompanyAdminListView.as_view(),
    name="founder-company-admin-list",
),

path(
    "founder/admins/<int:admin_id>/status/",
    FounderAdminStatusView.as_view(),
    name="founder-admin-status",
),

path(
    "founder/admins/<int:admin_id>/reset-password/",
    FounderAdminPasswordResetView.as_view(),
    name="founder-admin-password-reset",
),

path(
    "founder/users/",
    FounderUsersView.as_view(),
    name="founder-users",
),
path(
    "founder/admins/<int:admin_id>/delete/",
    FounderAdminDeleteView.as_view(),
    name="founder-admin-delete",
),

path(
    "founder/settings/",
    FounderPlatformSettingsView.as_view(),
    name="founder-platform-settings",
),

path(
    "platform/settings/",
    PublicPlatformSettingsView.as_view(),
    name="public-platform-settings",
),

]