import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

app = Celery("backend")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.conf.beat_schedule_filename = "celerybeat-schedule"
app.autodiscover_tasks()




from celery.schedules import crontab

app.conf.beat_schedule = {
    'delete-expired-confirmation-codes': {
        'task': 'users.tasks.delete_expired_confirmation_codes',
        'schedule': crontab(minute='*/5'),  # every 5 minutes
    },
    'delete-inactive-users': {
        'task': 'users.tasks.delete_inactive_users',
        'schedule': crontab(minute='*/1'),  # every 5 minutes
    },
    'delete-expired-standups': {
        'task': 'users.tasks.delete_expired_standups',
        'schedule': crontab(hour='*'),  # every hour
    },
    'delete-expired-invites': {
        'task': 'users.tasks.delete_expired_invites',
        'schedule': crontab(hour='*/1'),  # every hour
    },
}
