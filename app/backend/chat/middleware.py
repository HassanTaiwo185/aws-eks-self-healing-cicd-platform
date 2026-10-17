# chat/middleware.py - Alternative approach
from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model

User = get_user_model()

@database_sync_to_async
def get_user(user_id):
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return AnonymousUser()

class JWTAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token = params.get("token", [None])[0]

        scope = dict(scope)
        scope['user'] = AnonymousUser()

        if token:
            try:
                # Try using AccessToken instead of UntypedToken
                access_token = AccessToken(token)
                user_id = access_token.get("user_id")
                
                if user_id:
                    user = await get_user(user_id)
                    scope['user'] = user
                    print(f"WebSocket authenticated user: {user.username}")
                    
            except (InvalidToken, TokenError) as e:
                print(f"Token validation failed: {e}")
                scope['user'] = AnonymousUser()
            except Exception as e:
                print(f"Unexpected error: {e}")
                scope['user'] = AnonymousUser()
        else:
            print("No token provided in WebSocket connection")

        return await self.app(scope, receive, send)