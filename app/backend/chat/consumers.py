from channels.generic.websocket import AsyncJsonWebsocketConsumer
from asgiref.sync import sync_to_async
import json
from django.utils.timesince import timesince
from .models import Message , Room
from users.models import User


ROOM_STATUS_OPEN = "open"
ROOM_STATUS_CLOSED = "closed"

class ChatConsumer(AsyncJsonWebsocketConsumer):
    # connecting to websocket
    async def connect(self):
     self.room_uuid = self.scope['url_route']['kwargs']['room_uuid']
     self.room_group_name = f"chat{self.room_uuid}"
     self.user = self.scope['user']
    
    # FIX: Check authentication BEFORE doing anything else
     if not self.user.is_authenticated:
        print("WebSocket user is not authenticated!")
        await self.close(code=4001)  # Close with custom code
        return  # Important: return early
        
     await self.get_room()
    
     if self.room is None:
        await self.close()
        return
          
     await self.channel_layer.group_add(self.room_group_name, self.channel_name)
     await self.accept()
        
        # disconnecting 
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name,self.channel_name)
        await self.set_room_closed()
        
        # receiving data from frontend and turing it to python 
    async def receive(self , text_data):
        data = json.loads(text_data)
        type = data.get('type')
        content = data.get('content')
        sender = self.user.username

        
        if type == 'message':
            new_message = await self.create_message(content)
            
            await self.channel_layer.group_send(self.room_group_name,{
                'type': "chat_message",
                'id': new_message.id,
                 'content': content,
                'sender':self.scope["user"].username,
                "created_at": new_message.timestamp.isoformat(),
            })
        elif type == 'update':
            
            await self.channel_layer.group_send(
                self.room_group_name,{
                    "type": "writing_active",
                    "content":content,
                    "sender": self.scope["user"].username,
                }
            )
            
        elif type == 'delete':
         message_id = data.get("id")
         deleted = await self.delete_message(message_id)
         if deleted:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_delete",
                    "id": message_id,
                    "sender": sender,
                }
            )

    
    # sending data to frontend to render message
    async def chat_message(self,event) :
        await self.send(text_data=json.dumps({
            "type": "chat_message",
            "content": event["content"],
             "id": event.get("id"),
            "sender": event["sender"],
            "created_at":event['created_at']
        })) 
    
    # sending data to frontend indicating user is typing
    async def writing_active(self,event) :
        await self.send(text_data=json.dumps({
            "type": "writing_active",
            "content": event["content"],
            "sender": event["sender"],
        })) 
        
    async def chat_delete(self, event):
     await self.send(text_data=json.dumps({
        "type": "chat_delete",
        "id": event["id"],  # message that was deleted
        "sender": event["sender"],
    }))

        
        # getting room 
    @sync_to_async
    def get_room(self):
     try:
        self.room = Room.objects.get(id=self.room_uuid)
        
     except Room.DoesNotExist:
        self.room = None
        
        # closing room 
    @sync_to_async
    def set_room_closed(self):
        try:
          room = Room.objects.get(id=self.room_uuid)
          room.status = ROOM_STATUS_CLOSED
          room.save()
        except Room.DoesNotExist:
          pass
        
        # creating new message
    @sync_to_async
    def create_message(self, content):
            
        if not self.user.is_authenticated:
            raise Exception("Unauthenticated WebSocket user")
    
        try:
           user = User.objects.get(id=self.user.id)
        except User.DoesNotExist:
          raise Exception(f"User with id {self.user.id} does not exist")
    
        return Message.objects.create( content=content,sender=user, room=self.room
    )
        
    @sync_to_async
    def delete_message(self, message_id):
      try:
        message = Message.objects.get(id=message_id, room=self.room)
        message.delete()
        return True
      except Message.DoesNotExist:
        return False


    