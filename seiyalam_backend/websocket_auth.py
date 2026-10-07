from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.core import signing
from django.contrib.auth import get_user_model


User = get_user_model()


@database_sync_to_async
def get_user_from_ticket(ticket):

    try:

        data = signing.loads(
            ticket,
            max_age=60,
        )

        user_id = data.get(
            "user_id"
        )

        if not user_id:
            return None

        return User.objects.filter(
            id=user_id,
            is_active=True,
        ).first()

    except (
        signing.BadSignature,
        signing.SignatureExpired,
    ):

        return None


class WebSocketTicketMiddleware:

    def __init__(
        self,
        inner,
    ):

        self.inner = inner

    async def __call__(
        self,
        scope,
        receive,
        send,
    ):

        query_string = scope.get(
            "query_string",
            b"",
        ).decode()

        query_params = parse_qs(
            query_string
        )

        tickets = query_params.get(
            "ticket"
        )

        user = None

        if tickets:

            ticket = tickets[0]

            user = await get_user_from_ticket(
                ticket
            )

        if not user:

            await send(
                {
                    "type": "websocket.close",
                    "code": 4401,
                }
            )

            return

        scope["user"] = user

        return await self.inner(
            scope,
            receive,
            send,
        )