from django.test import TestCase
from .models import User
from .serializers import CreateUser
from rest_framework.test import APITestCase, APIClient
from django.urls import reverse
from users.models import User

# Create your tests here.
class CreateUserSerializerTest(TestCase):

    # testing create user serializer (no invitation link) with valid data
    # Should assign role be "Team leader" and set is_staff to True
    def test_create_team_leader_valid_input(self):
        data = {
            "username": "leader",
            "email": "leader@gmail.com",
            "password": "Password123",
        }
        serializer = CreateUser(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

        user = serializer.save()
        self.assertEqual(user.role, "Team leader")
        self.assertTrue(user.is_staff)

     # testing create user serializer (no invitation link) with invalid data
     #should serialiser  validation be false or not 
    def test_create_team_leader_invalid_input(self):
        data = {
            "username": "testleader",
            "email": "leader@gmail.com",
           
        }
        serializer = CreateUser(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

#testing users views 
class UserViewTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('create-user')  

     # testing create user view with all valid input 
    def test_create_user_valid_input(self):
        data = {
            "email": "apiuser@example.com",
            "username": "apiuser",
            "password": "password123",
            "role": "Team member",
        }
        response = self.client.post(self.url, data, format='multipart')  
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['email'], data['email'])
        self.assertEqual(response.data['username'], data['username'])
        self.assertFalse('password' in response.data) 

        # Check user is inactive initially (due to email confirmation flow)
        user = User.objects.get(username=data['username'])
        self.assertFalse(user.is_active)

     # testing create user view with all invalid input
    def test_create_user_invalid_input(self):
     data = {
        "email": "user@example.com",
        "username": "user",
        "role": "Team member",
    }
     response = self.client.post(self.url, data, format='multipart')
     # Expecting bad request
     self.assertEqual(response.status_code, 400)  
     self.assertIn('password', response.data)
     

     # test edit user as team member 
    def test_edit_user_as_member(self):
        # no authentication
        user = User.objects.create_user(
            username='editme2', password='pass123', email='editme2@example.com'
        )
        edit_url = reverse('edit-user', kwargs={'pk': user.pk})

        data = {
            "username": "updateduser2",
            "email": "updated2@example.com"
        }
        response = self.client.patch(edit_url, data, format='json')
        # Expecting bad request (authorized)
        self.assertEqual(response.status_code, 401)  
        
        
    # test edit user as team leader
    def test_edit_user_as_leader(self):
        staff = User.objects.create_user(username='staffuser', password='staffpass', email='staff@example.com', is_staff=True)
        self.client.force_authenticate(user=staff)

        user = User.objects.create_user(username='editme2', password='pass123', email='editme2@example.com')
        edit_url = reverse('edit-user', kwargs={'pk': user.pk})

        data = {"username": "updateduser2", "email": "updated2@example.com"}
        response = self.client.patch(edit_url, data, format='json')
        self.assertEqual(response.status_code, 200)

        user.refresh_from_db()
        self.assertEqual(user.username, "updateduser2")
        
    # test delete user as team leader
    def test_delete_user_as_leader(self):
        staff = User.objects.create_user(username='staffuser2', password='staffpass2', email='staff2@example.com', is_staff=True)
        self.client.force_authenticate(user=staff)

        user = User.objects.create_user(username='deleteme2', password='pass123', email='deleteme2@example.com')
        delete_url = reverse('delete-user', kwargs={'pk': user.pk})

        response = self.client.delete(delete_url)
        # Expect successful response
        self.assertEqual(response.status_code, 204)
        # deleted user must not exist again
        self.assertFalse(User.objects.filter(pk=user.pk).exists())

   # test delete user as team member
    def test_delete_user_as_member(self):
        user = User.objects.create_user(username='deleteme3', password='pass123', email='deleteme3@example.com')
        delete_url = reverse('delete-user', kwargs={'pk': user.pk})

        response = self.client.delete(delete_url)
        # Expecting bad request (authorized)
        self.assertEqual(response.status_code, 401)  




    