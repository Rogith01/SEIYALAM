from pathlib import Path
import os

from dotenv import load_dotenv


# ============================================================
# BASE DIRECTORY
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent


# ============================================================
# ENVIRONMENT VARIABLES
# ============================================================

load_dotenv(BASE_DIR / ".env")


# ============================================================
# SECURITY
# ============================================================

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "django-insecure-development-key",
)

DEBUG = os.getenv(
    "DEBUG",
    "True",
).lower() == "true"


ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv(
        "ALLOWED_HOSTS",
        "127.0.0.1,localhost",
    ).split(",")
    if host.strip()
]


# ============================================================
# APPLICATIONS
# ============================================================

INSTALLED_APPS = [
    # Django
     "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "drf_spectacular",
    "channels",

    # SEIYALAM apps
    "accounts",
    "companies",
    "service_requests",
    "work_orders",
    "work_logs",
    "api",
    "notifications",
]


# ============================================================
# MIDDLEWARE
# ============================================================

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",

    # CORS
    "corsheaders.middleware.CorsMiddleware",

    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# ============================================================
# URL CONFIGURATION
# ============================================================

ROOT_URLCONF = "seiyalam_backend.urls"


# ============================================================
# TEMPLATES
# ============================================================

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",

        "DIRS": [],

        "APP_DIRS": True,

        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# ============================================================
# WSGI
# ============================================================

WSGI_APPLICATION = "seiyalam_backend.wsgi.application"

ASGI_APPLICATION = "seiyalam_backend.asgi.application"

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [
                ("127.0.0.1", 6379),
            ],
        },
    },
}


# ============================================================
# DATABASE - MYSQL
# ============================================================

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",

        "NAME": os.getenv(
            "DB_NAME",
            "seiyalam_db",
        ),

        "USER": os.getenv(
            "DB_USER",
            "root",
        ),

        "PASSWORD": os.getenv(
            "DB_PASSWORD",
            "",
        ),

        "HOST": os.getenv(
            "DB_HOST",
            "127.0.0.1",
        ),

        "PORT": os.getenv(
            "DB_PORT",
            "3306",
        ),
    }
}


# ============================================================
# CUSTOM USER MODEL
# ============================================================

AUTH_USER_MODEL = "accounts.User"


# ============================================================
# PASSWORD VALIDATION
# ============================================================

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "UserAttributeSimilarityValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "MinimumLengthValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "CommonPasswordValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "NumericPasswordValidator"
        ),
    },
]


# ============================================================
# INTERNATIONALIZATION
# ============================================================

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# ============================================================
# STATIC FILES
# ============================================================

STATIC_URL = "static/"

STATIC_ROOT = BASE_DIR / "staticfiles"


# ============================================================
# MEDIA FILES
# ============================================================

MEDIA_URL = "/media/"

MEDIA_ROOT = BASE_DIR / "media"


# ============================================================
# DEFAULT PRIMARY KEY
# ============================================================

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ============================================================
# DJANGO REST FRAMEWORK
# ============================================================

# ============================================================
# DJANGO REST FRAMEWORK
# ============================================================

REST_FRAMEWORK = {

    # JWT authentication
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "api.platform_access.SeiyalamJWTAuthentication",
    ),

    # Login required by default
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),

    # Pagination
    "DEFAULT_PAGINATION_CLASS": (
        "rest_framework.pagination.PageNumberPagination"
    ),

    "PAGE_SIZE": 20,

    # Consistent error handling
    "EXCEPTION_HANDLER": (
        "api.exceptions.custom_exception_handler"
    ),

    # Swagger / OpenAPI
    "DEFAULT_SCHEMA_CLASS": (
        "drf_spectacular.openapi.AutoSchema"
    ),

}

# ============================================================
# CORS
# ============================================================

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "",
    ).split(",")
    if origin.strip()
]


# ============================================================
# API DOCUMENTATION
# ============================================================

SPECTACULAR_SETTINGS = {

    "TITLE": "SEIYALAM API",

    "DESCRIPTION": (
        "Service Request, Work Order, Worker, "
        "Customer and Work Management API"
    ),

    "VERSION": "1.0.0",

    "SERVE_INCLUDE_SCHEMA": False,

    "COMPONENT_SPLIT_REQUEST": True,

    "COMPONENTS": {
        "securitySchemes": {
            "BearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
            }
        }
    },
}


# ============================================================
# PRODUCTION SECURITY
# ============================================================

if not DEBUG:

    SECURE_BROWSER_XSS_FILTER = True

    SECURE_CONTENT_TYPE_NOSNIFF = True

    X_FRAME_OPTIONS = "DENY"

    SECURE_REFERRER_POLICY = "same-origin"

    SECURE_HSTS_SECONDS = 31536000

    SECURE_HSTS_INCLUDE_SUBDOMAINS = True

    SECURE_HSTS_PRELOAD = True

    SESSION_COOKIE_SECURE = True

    CSRF_COOKIE_SECURE = True