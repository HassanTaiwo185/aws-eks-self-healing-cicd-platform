from django.db import models
import uuid
from users.models import User

# Create your models here.
class StandUp(models.Model):
    id = models.UUIDField(default=uuid.uuid4,primary_key = True , editable=False)
    title = models.CharField(max_length=50)
    progress = models.CharField(max_length=255)
    user = models.ForeignKey(User,on_delete=models.CASCADE,related_name='standups')
    created_at = models.DateTimeField(auto_now_add=True)
    
    
    def __str__(self):
        return self.title
    
