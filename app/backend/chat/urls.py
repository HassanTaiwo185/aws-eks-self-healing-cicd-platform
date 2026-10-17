from django.urls import path
from .views import RoomViews, MessageViews , ListMessagesByStandup ,DeleteMessageView

urlpatterns = [
    path("rooms/", RoomViews.as_view(), name="room-list-create"),
    path("messages/", MessageViews.as_view(), name="message-list-create"),
    path("messages/standup/<uuid:standup_id>/", ListMessagesByStandup.as_view(), name="messages-by-standup"),
    path("messages/standup/delete/<int:pk>/", DeleteMessageView.as_view(), name="delete-message"),
]
