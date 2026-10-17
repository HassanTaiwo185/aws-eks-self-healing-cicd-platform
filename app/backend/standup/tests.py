from django.test import TestCase
from users.models import User
from .models import StandUp
from .serializers import StandUpSerializer
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from users.models import User
from .models import StandUp

# Create your tests here.
class TestStandUpSerializer(TestCase):
    def setUp(self):
       self.user = User.objects.create_user(username="taiwo",password="pas1234",email = "taiwp@gmail.com")
       
       # testing standup serializer if its meet expected outcome
    def test_valid_serializer(self):
        standup = StandUp.objects.create(title="Sync", progress="50%", user=self.user)
        serializer = StandUpSerializer(standup)
        self.assertEqual(serializer.data["title"],"Sync")
        self.assertEqual(serializer.data["progress"], "50%")
        self.assertEqual(serializer.data["user"], self.user.id)
        self.assertIn("created_at", serializer.data)
       
    # testing standup serializer with valid data and verify expected outcome
    def test_valid_data_deserialization(self):
        data = {
            "title": "Update",
            "progress": "80%",
            "user": self.user.id
        }
        serializer = StandUpSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
      
      # testing standup serializer with missing required fields and check if it will not validate
    def test_missing_required_fields(self):
        data = {"progress": "20%"}
        serializer = StandUpSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("title", serializer.errors)


    # testing standup serializer if read only fields is enfored
    def test_read_only_fields_enforced(self):
        data = {
            "title": "Final",
            "progress": "90%",
            "user": self.user.id,
            "id": "some-fake-id",
            "created_at": "2023-01-01T00:00:00Z"
        }
        serializer = StandUpSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertNotIn("id", serializer.validated_data)
        self.assertNotIn("created_at", serializer.validated_data)

# testing standup views
class StandUpViewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="pass1234"
        )
        self.client.login(username="testuser", password="pass1234")

     # testing create standup view
    def test_create_standup(self):
        url = reverse("create-standup")
        data = {"title": "Daily Update", "progress": "50%"}
        self.client.force_authenticate(user=self.user)
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(StandUp.objects.count(), 1)
        self.assertEqual(StandUp.objects.first().title, "Daily Update")

       # testing list standup view
    def test_list_standups(self):
        StandUp.objects.create(title="Morning Check", progress="25%", user=self.user)
        url = reverse("list-standup")
        self.client.force_authenticate(user=self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

      # testing edit standup view
    def test_update_standup(self):
        standup = StandUp.objects.create(title="Initial", progress="0%", user=self.user)
        url = reverse("edit-standup", args=[standup.id])
        self.client.force_authenticate(user=self.user)
        data = {"title": "Updated", "progress": "80%"}
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        standup.refresh_from_db()
        self.assertEqual(standup.title, "Updated")

      # testing delete standup view as non admin
    def test_delete_standup_as_non_admin(self):
        standup = StandUp.objects.create(title="Temp", progress="40%", user=self.user)
        url = reverse("delete-standup", args=[standup.id])
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    # testing delete standup as a staff
    def test_delete_standup_as_staff(self):
        
        admin_user = User.objects.create_user(username="admin", email="admin@example.com", password="adminpass")
        admin_user.is_staff = True
        admin_user.save()
        
        standup = StandUp.objects.create(title="Morning Sync", progress="In Progress", user=self.user)
        self.client.force_authenticate(user=admin_user)

        
        
        url = reverse('delete-standup', kwargs={"pk": standup.pk})

        response = self.client.delete(url)
        self.assertEqual(response.status_code, 204)
        self.assertFalse(StandUp.objects.filter(pk=standup.pk).exists())


    