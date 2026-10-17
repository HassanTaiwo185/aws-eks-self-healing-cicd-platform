from celery import shared_task
from datetime import timedelta
from django.utils import timezone

@shared_task
def delete_expired_confirmation_codes():
    from users.models import ConfirmationCode 
    expiry_time = timezone.now() - timedelta(minutes=10)
    ConfirmationCode.objects.filter(created_at__lt=expiry_time).delete()

@shared_task
def delete_inactive_users():
    from users.models import User
    expiry_time = timezone.now() - timedelta(minutes=1)
    deleted_count, _ = User.objects.filter(is_active=False, date_joined__lt=expiry_time).delete()
    print(f"Deleted {deleted_count} inactive users")

@shared_task
def delete_expired_standups():
    from standup.models import StandUp
    expiry_time = timezone.now() - timedelta(hours=24)
    StandUp.objects.filter(created_at__lt=expiry_time).delete()

@shared_task
def delete_expired_invites():
    from teams.models import TeamInvite
    expiry_time = timezone.now() - timedelta(hours=48)
    TeamInvite.objects.filter(created_at__lt=expiry_time, used=False).delete()
