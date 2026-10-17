from django.shortcuts import render
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated , IsAdminUser
from .serializers import StandUpSerializer
from .models import StandUp

# Create your views here.
class CreateStandUp(generics.CreateAPIView):
    queryset = StandUp.objects.all()
    serializer_class = StandUpSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
       serializer.save(user=self.request.user)
       
class EditStandUp(generics.UpdateAPIView):
    serializer_class = StandUpSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return StandUp.objects.filter(user = user)
    

    
    
class DeleteStandUp(generics.DestroyAPIView):
    serializer_class = StandUpSerializer
    permission_classes = [IsAuthenticated,IsAdminUser]
    
    def get_queryset(self):
        user = self.request.user
        return StandUp.objects.filter(user__team=user.team)
    

class ListStandUp(generics.ListAPIView):
    serializer_class = StandUpSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
     user = self.request.user
     return StandUp.objects.filter(user__team=user.team).order_by("created_at")

    
class StandUpDetail(generics.RetrieveAPIView):
    serializer_class = StandUpSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
     user = self.request.user
     return StandUp.objects.filter(user__team=user.team)

    
   

    
