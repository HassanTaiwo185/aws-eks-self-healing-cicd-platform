from django.shortcuts import render
from rest_framework import generics
from rest_framework.permissions import IsAdminUser ,AllowAny ,IsAuthenticated
from .serializers import RoomSerializer , MessageSerializer ,DeleteMessageSerializer
from .models import Room ,Message
from users.models import User
from rest_framework.exceptions import NotFound

# Create your views here.
class RoomViews(generics.ListCreateAPIView):
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Room.objects.filter(members__team=user.team).distinct()

class MessageViews(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(room__members__team=user.team).distinct()

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

class ListMessagesByStandup(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        standup_id = self.kwargs.get("standup_id")

        try:
            room = Room.objects.get(standup__id=standup_id)
        except Room.DoesNotExist:
            raise NotFound("Room for this standup does not exist.")

        return Message.objects.filter(room=room).order_by("timestamp")

# delete message 
class DeleteMessageView(generics.DestroyAPIView):
    serializer_class = DeleteMessageSerializer
    permission_classes = [IsAuthenticated]
   
    def get_queryset(self):
        return Message.objects.filter(sender=self.request.user)


   