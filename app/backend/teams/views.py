from django.shortcuts import render
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.conf import settings
from .models import Team, TeamInvite
from .serializers import TeamSerializer, TeamInviteSerializer
import requests
import os


# Send email via Brevo HTTP API
def send_brevo_email(to_email, subject, message):
    api_key = os.getenv('BREVO_API_KEY')
    requests.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={
            "api-key": api_key,
            "Content-Type": "application/json"
        },
        json={
            "sender": {"email": "ayindehassan776@gmail.com", "name": "CollabsUp"},
            "to": [{"email": to_email}],
            "subject": subject,
            "textContent": message
        }
    )


# Create your views here.

# Create Team View
class CreateTeamView(generics.CreateAPIView):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# Generate Invite View
class GenerateTeamInviteView(generics.CreateAPIView):
    serializer_class = TeamInviteSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def create(self, request, *args, **kwargs):
        team = request.user.team
        invitee_email = request.data.get("invitee_email")

        # checking if team and invitee_email are provided
        if not team or not invitee_email:
            return Response(
                {"error": "Both 'team' and 'invitee_email' are required."}
            )

        # creating team invite
        invite = TeamInvite.objects.create(team=team, invitee_email=invitee_email)
        invite_link = f"{settings.FRONTEND_URL}/#/register/?invite_token={invite.token}"

        # Email invitee via Brevo API
        send_brevo_email(
            to_email=invitee_email,
            subject="You're invited to join a team on CollabsUp!",
            message=f"Click here to join the team '{team.name}': {invite_link}"
        )

        # Email inviter via Brevo API
        send_brevo_email(
            to_email=request.user.email,
            subject="Invite link created successfully",
            message=f"You invited {invitee_email}."
        )

        serializer = self.get_serializer(invite)
        return Response({
            "invite_link": invite_link,
            "invite": serializer.data
        })


class DeleteTeam(generics.DestroyAPIView):
    permission_classes = [IsAdminUser, IsAuthenticated]
    serializer_class = Team

    def get_queryset(self):
        return Team.objects.filter(created_by=self.request.user)