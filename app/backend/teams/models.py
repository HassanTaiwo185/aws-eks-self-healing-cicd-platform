from django.db import models
from django.utils import timezone
import uuid
from datetime import timedelta
from django.conf import settings


# Create your models here.
class Team(models.Model):
    name = models.CharField(max_length=50)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="teams_created")
    created_at = models.DateTimeField(auto_now_add=True)
    
    
    def __str__(self):
        
        return self.name
    
class TeamInvite(models.Model):
    team = models.ForeignKey(Team,on_delete=models.CASCADE, related_name="invites")
    token = models.UUIDField(default=uuid.uuid4,unique=True,editable=False)
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    invitee_email = models.EmailField(null=False, blank=False)

    def is_expired(self):
        expiry_time = self.created_at + timedelta(minutes=1440)  
        return timezone.now() > expiry_time

    
    def __str__(self):
        return f"Invite to {self.team.name} - {'Used' if self.used else 'Unused'}"
        
    
