from django.urls import path
from .views import CreateTeamView, GenerateTeamInviteView , DeleteTeam

urlpatterns = [
    path('create/', CreateTeamView.as_view(), name='create-team'),
    path('invite/', GenerateTeamInviteView.as_view(), name='generate-invite'),
   path('delete/<int:pk>/', DeleteTeam.as_view(), name='delete-team'),

]
