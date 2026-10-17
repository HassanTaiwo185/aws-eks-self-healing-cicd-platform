from django.test import TestCase
from users.models import User
from standup.models import StandUp
from chat.models import Room
from chat.serializers import RoomSerializer
from chat.models import Message
from chat.serializers import MessageSerializer
from types import SimpleNamespace
from teams.models import Team 
from rest_framework.test import APIClient
from rest_framework import status

# Create your tests here.
class RoomSerializerTest(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username="hassan", password="pass123")
        self.user2 = User.objects.create_user(username="zainab", password="pass456")
        self.user2.team = self.user1.team
        self.user2.save()

        self.standup = StandUp.objects.create(title="Daily Update", progress="70%", user=self.user1)

    def test_room_serializer_valid(self):
        data = {
            "name": "Project Chat",
            "members": [self.user1.id, self.user2.id],
            "standup": str(self.standup.id)
        }
        serializer = RoomSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        room = serializer.save()
        self.assertEqual(room.name, "Project Chat")
        self.assertSetEqual(set(room.members.all()), {self.user1, self.user2})
        self.assertEqual(room.standup, self.standup)

    def test_room_serializer_missing_members(self):
        data = {
            "name": "No Members Room",
            "standup": str(self.standup.id)
        }
        serializer = RoomSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("members", serializer.errors)
        
class TestMessageSerializer(TestCase):
    def setUp(self):
        # Create a team
        team = Team.objects.create(name="Test Team")

        # Create users and assign them to the team
        self.user1 = User.objects.create_user(username="user1", password="pass123", team=team)
        self.user2 = User.objects.create_user(username="user2", password="pass123", team=team)

        # Create standup by user1
        self.standup = StandUp.objects.create(title="Standup A", progress="50%", user=self.user1)

     # test create message with existing room
    def test_create_message_with_existing_room(self):
        # Create room with standup and add members
        room = Room.objects.create(name="Room A", standup=self.standup)
        room.members.set([self.user1, self.user2])

        data = {
            "standup": self.standup.id,
            "content": "Hello!"
        }

        context = {"request": SimpleNamespace(user=self.user1)}
        serializer = MessageSerializer(data=data, context=context)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        message = serializer.save()

        self.assertEqual(message.content, "Hello!")
        self.assertEqual(message.sender, self.user1)
        self.assertEqual(message.room, room)

      # test create message with no existing room 
    def test_create_message_creates_new_room_from_standup(self):
        # Delete any room for this standup
        Room.objects.filter(standup=self.standup).delete()

        data = {
            "standup": self.standup.id,
            "content": "First reply!"
        }

        context = {"request": SimpleNamespace(user=self.user1)}
        serializer = MessageSerializer(data=data, context=context)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        message = serializer.save()

        self.assertEqual(message.sender, self.user1)
        self.assertEqual(message.content, "First reply!")
        self.assertIsNotNone(message.room)
        self.assertEqual(message.room.standup, self.standup)


    # test non team memeber replying to standup 
    def test_invalid_cross_team_message(self):
        outsider = User.objects.create_user(username="outsider", password="pass")
        outsider_standup = StandUp.objects.create(title="Foreign", progress="90%", user=outsider)

        data = {
            "standup": outsider_standup.id,
            "content": "Trying to reply!"
        }

        context = {"request": SimpleNamespace(user=self.user1)}
        serializer = MessageSerializer(data=data, context=context)
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)


    # test missing room and stand up while creating a message
    def test_missing_room_and_standup(self):
        data = {
            "content": "Where is the room?"
        }

        context = {"request": SimpleNamespace(user=self.user1)}
        serializer = MessageSerializer(data=data, context=context)
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)
    

# test chat views
class ChatViewsTestCase(TestCase):
    # set up for chat room and messages
    def setUp(self):
        self.team = Team.objects.create(name="Alpha Team")
        self.user1 = User.objects.create_user(username="user1", password="pass123", team=self.team)
        self.user2 = User.objects.create_user(username="user2", password="pass123", team=self.team)

        self.client = APIClient()
        self.client.force_authenticate(user=self.user1) 

        self.standup = StandUp.objects.create(title="Daily", progress="80%", user=self.user1)

        self.room = Room.objects.create(name="Test Room", standup=self.standup)
        self.room.members.set([self.user1, self.user2])

        self.message = Message.objects.create(room=self.room, sender=self.user1, content="Hello from user1")

     # test how many rooms have been created in user team
    def test_list_rooms_for_user_team(self):
        response = self.client.get("/api/chats/rooms/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], str(self.room.id))

      # test if a new chat room can be created successfully with a new standup
    def test_create_room_successfully(self):
        new_standup = StandUp.objects.create(title="New Standup", progress="20%", user=self.user1)

        response = self.client.post("/api/chats/rooms/", {
            "name": "New Room",
            "members": [self.user1.id, self.user2.id],
            "standup": new_standup.id
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Room.objects.count(), 2)

  # test how many messages are have been created in user's team
    def test_list_messages_for_user_team(self):
        response = self.client.get("/api/chats/messages/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['content'], "Hello from user1")

      # test create a new message for a pre existing room
    def test_create_message_for_existing_room(self):
     response = self.client.post("/api/chats/messages/", {
        "standup": self.standup.id,  
        "content": "New message"
    })
     self.assertEqual(response.status_code, status.HTTP_201_CREATED)
     self.assertEqual(Message.objects.count(), 2)

   # test creat a new message and new chat room from a standup
    def test_create_message_creates_room_from_standup(self):
        Room.objects.all().delete()

        response = self.client.post("/api/chats/messages/", {
            "standup": self.standup.id,
            "content": "Starting new room with this"
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Room.objects.count(), 1)
        self.assertEqual(Message.objects.count(), 1)

  # test if user that is not in the team can access chat room or message of other team .
    def test_user_cannot_access_other_team_rooms_or_messages(self):
        outsider = User.objects.create_user(username="outsider", password="1234")

        # Use new client and force_authenticate instead of .login()
        outsider_client = APIClient()
        outsider_client.force_authenticate(user=outsider)

        response = outsider_client.get("/api/chats/rooms/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

        response = outsider_client.get("/api/chats/messages/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

        response = outsider_client.post("/api/chats/messages/", {
            "standup": self.standup.id,
            "content": "Unauthorized post"
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)