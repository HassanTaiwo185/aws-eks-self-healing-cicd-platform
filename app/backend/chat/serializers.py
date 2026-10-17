from rest_framework import serializers
from .models import Room, Message
from users.models import User
from standup.models import StandUp

class RoomSerializer(serializers.ModelSerializer):
    members = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), many=True)
    standup = serializers.PrimaryKeyRelatedField(queryset=StandUp.objects.all(), required=False, allow_null=True)


    class Meta:
        model = Room
        fields = ['id', 'name', 'members', 'standup', 'created_at']
        read_only_fields = ['id', 'created_at']

class MessageSerializer(serializers.ModelSerializer):
    standup = serializers.PrimaryKeyRelatedField( queryset=StandUp.objects.all(), required=False, allow_null=True )
    sender = serializers.PrimaryKeyRelatedField(read_only=True, default=serializers.CurrentUserDefault())
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    room = serializers.PrimaryKeyRelatedField( required=False, allow_null=True, read_only=True)
    room_id = serializers.UUIDField(source="room.id", read_only=True)


    class Meta:
        model = Message
        fields = ['standup', 'sender', 'room', 'content', 'timestamp','room_id','id','sender_username']
        read_only_fields = ['sender','timestamp','room_id','id']

    def validate(self, attrs):
        request = self.context['request']
        user = request.user
        standup = attrs.get('standup')
        room = attrs.get('room')

        # Neither room nor standup provided
        if not standup and not room:
            raise serializers.ValidationError({
                'non_field_errors': ['Either "room" or "standup" must be provided.']
            })

        # Trying to reply to a standup outside your team
        if standup and standup.user.team != user.team:
            raise serializers.ValidationError({
                'non_field_errors': ['You cannot reply to a standup outside your team.']
            })

        return attrs

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data["sender"] = user
        standup = validated_data.pop('standup', None)
        room = validated_data.pop('room', None)

        if standup and not room:
            # Try to find existing room linked to this standup
            room_qs = Room.objects.filter(standup=standup)

            if room_qs.exists():
                room = room_qs.first()
            else:
                # Create a new room for this standup
                room = Room.objects.create(
                    standup=standup,
                    name=f"Chat for {standup.title}"
                )
                room.members.set(User.objects.filter(team=user.team))

        # Final safety check
        if not room:
            raise serializers.ValidationError("Unable to determine a room to save the message in.")

        message = Message.objects.create(
            room=room , **validated_data
        )
        return message
    

       
class DeleteMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id','content']
        read_only_fields = ["id"]
        
    def validate(self,attrs):
            request = self.context['request']
            user = request.user
            message_id = attrs.pop('id')
            
            try :
                Message.objects.get(id=message_id,sender=user)
            except Message.DoesNotExist:
                raise serializers.ValidationError("Message does not exist or you are not the sender.")
            return attrs 
            
        
            
       
