from django.db import models
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import  AbstractBaseUser , PermissionsMixin 
import uuid
from django.utils import timezone
from django.conf import settings
from teams.models import Team



# Create your models here.
class CustomBaseUserManager(BaseUserManager):
    def _create_user(self,username,password,**extra_fields):
        if not username:
            raise ValueError("Username is required")
        
        user = self.model(username=username,**extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    def create_user(self,username=None,password=None,**extra_fields):
        extra_fields.setdefault('is_staff',False)
        extra_fields.setdefault('is_superuser',False)
        return self._create_user(username, password, **extra_fields)

    def create_superuser(self, username=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get('is_superuser') is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self._create_user(username, password, **extra_fields)
    
class User(AbstractBaseUser, PermissionsMixin):
    AGENT = 'Team member'
    ADMIN = 'Team leader'

    ROLES_CHOICES = (
        (AGENT, 'Team member'),
        (ADMIN, 'Team leader'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLES_CHOICES, default=AGENT)
    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, null=True, blank=True, related_name='members')
    
    objects = CustomBaseUserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.username

# model to save confirmation code   
class ConfirmationCode(models.Model):
    user = models.ForeignKey(User,on_delete=models.CASCADE)
    code = models.CharField(blank=True,null=True,max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        expiry_time = self.created_at + timezone.timedelta(minutes=10)
        return timezone.now() > expiry_time

