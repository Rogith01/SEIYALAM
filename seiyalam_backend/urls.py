from django.contrib import admin
from django.urls import path, include

from django.conf import settings
from django.conf.urls.static import static

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)

from api.founder_auth import (
    SeiyalamTokenObtainPairView,
    FounderTokenObtainPairView,
    CustomerTokenObtainPairView,
)

from rest_framework_simplejwt.views import (
    TokenRefreshView,
)


urlpatterns = [

    path(
        "admin/",
        admin.site.urls,
    ),

    path(
        "api/",
        include("api.urls"),
    ),

    path(
        "api/token/",
        SeiyalamTokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),

    path(
        "api/token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),

    path(
        "api/founder/token/",
        FounderTokenObtainPairView.as_view(),
        name="founder_token_obtain_pair",
    ),

    path(
    "api/customer/login/",
    CustomerTokenObtainPairView.as_view(),
    name="customer_token_obtain_pair",
    ),

    path(
        "api/schema/",
        SpectacularAPIView.as_view(),
        name="schema",
    ),

    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(
            url_name="schema"
        ),
        name="swagger-ui",
    ),
]

if settings.DEBUG:

    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )