"""
ASGI config for seiyalam_backend project.
"""

import os

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "seiyalam_backend.settings",
)

from django.core.asgi import get_asgi_application

django_application = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter

from notifications.routing import websocket_urlpatterns
from seiyalam_backend.websocket_auth import (
    WebSocketTicketMiddleware,
)


application = ProtocolTypeRouter(
    {
        "http": django_application,
        "websocket": WebSocketTicketMiddleware(
            URLRouter(websocket_urlpatterns)
        ),
    }
)