from django.urls import re_path,path
from . import consumers


websocket_urlpatterns = [
    re_path(r"api/ws/(?P<room_uuid>[0-9a-f\-]+)/$", consumers.ChatConsumer.as_asgi()),
]
