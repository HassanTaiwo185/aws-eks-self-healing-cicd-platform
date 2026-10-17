from django.test import TestCase
from users.models import User
from teams.models import Team, TeamInvite
from teams.serializers import TeamSerializer, TeamInviteSerializer
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from users.models import User
from teams.models import TeamInvite, Team

# testing teams serializer 
class TeamSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="owner", email="owner@example.com", password="pass123"
        )

  # testing with valid data by giving all required fields
    def test_team_serializer_valid_data(self):
        team = Team.objects.create(name="My Team", created_by=self.user)
        serializer = TeamSerializer(team)

        self.assertEqual(serializer.data["name"], "My Team")
        self.assertEqual(serializer.data["created_by"], self.user.id)

     # testing with invalid data by missing all required fields
    def test_team_serializer_invalid_data(self):
        # name is required but missing 
        data = {"name": ""}  
        serializer = TeamSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn("name", serializer.errors)


# testing team invite serialiser 
class TeamInviteSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="leader", email="leader@example.com", password="pass123"
        )
        self.team = Team.objects.create(name="Cool Team", created_by=self.user)

    # testing with valid data by giving all required fields
    def test_team_invite_serializer_valid_data(self):
        invite = TeamInvite.objects.create(
            team=self.team, invitee_email="test@example.com"
        )
        serializer = TeamInviteSerializer(invite)

        self.assertEqual(serializer.data["team"], self.team.id)
        self.assertEqual(serializer.data["invitee_email"], "test@example.com")
        self.assertIn("token", serializer.data)
        self.assertFalse(serializer.data["used"])

    # testing with invalid data by missing all required fields
    def test_team_invite_serializer_invalid_data(self):
        # Missing required invitee_email field
        data = {"team": self.team.id}
        serializer = TeamInviteSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn("invitee_email", serializer.errors)


class TeamAPITests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='teamleader',
            email='leader@example.com',
            password='pass123',
            is_staff=True  
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

     # testing if create team views can create team with valid data
    def test_create_team(self):
        url = reverse('create-team')
        data = {
            'name': 'Test Team'
        }

        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Test Team')
        self.assertEqual(response.data['created_by'], self.user.id)

      # testing if staff can generate link
    def test_generate_invite_staff(self):
        team = Team.objects.create(name='Invite Team', created_by=self.user)
        self.user.team = team
        self.user.save()
        url = reverse('generate-invite')
        data = {
            'invitee_email': 'newmember@example.com'
        }

        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('invite_link', response.data)
        self.assertEqual(response.data['invite']['invitee_email'], 'newmember@example.com')

    # testing invalid data for generate link 
    def test_generate_invite_missing_data(self):
        url = reverse('generate-invite')
        response = self.client.post(url, {})  
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('error', response.data)
    
    # testing if non staff can generate invite link
    def test_generate_invite_permission_denied(self):
        # Make a non-staff user
        user2 = User.objects.create_user(username='nonadmin', email='n@example.com', password='pass123')
        self.client.force_authenticate(user=user2)

        team = Team.objects.create(name='Blocked Team', created_by=user2)
        url = reverse('generate-invite')
        data = {
            'team': team.id,
            'invitee_email': 'someone@example.com'
        }

        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
