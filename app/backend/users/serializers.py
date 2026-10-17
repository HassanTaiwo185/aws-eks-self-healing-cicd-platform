from rest_framework import serializers
from .models import User , ConfirmationCode
from teams.models import TeamInvite ,Team
from django.utils import timezone


#Creating user serializer for validation
class CreateUser(serializers.ModelSerializer):
    invite_token = serializers.UUIDField(write_only= True , required=False)
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'password',
            'avatar',
            'role',
            'is_active',
            'is_staff',
            'invite_token'
        ]
        read_only_fields = ['role', 'is_active', 'is_staff']
        extra_kwargs = {
            "password":{"write_only":True},
            
            
        }

    #validating invite token to check if existed and maybe it already expires
    def validate_invite_token(self,value):
        if not value:
            return None
        try:
            invite = TeamInvite.objects.get(token=value,used=False)
            
            if invite.is_expired() :
                raise serializers.ValidationError("Invitaion link already expired")
            
            if invite.used == True:
                raise serializers.ValidationError("Invitaion link Has been used")
                
        except TeamInvite.DoesNotExist:
            raise serializers.ValidationError("Invitaion does not exist")
        
        return invite

    # creating user and assigning role based on invite link or not 
    def create(self, validated_data):
        invite = validated_data.pop("invite_token",None)
       

        #Has invitation link :Create team mem and set is staff to false 
        if invite :
            validated_data["role"] = "Team member"
            validated_data['is_staff'] = False
            invite.used = True
            invite.save()

            user = User.objects.create_user(**validated_data)
            user.team = invite.team
            user.save()


        #No invitation link :Create Team leader and set is staff to True  
        else:
           validated_data["role"] = "Team leader"
           validated_data["is_staff"] = True
           user = User.objects.create_user(**validated_data)
           
           #CREATE TEAM AS user sign sign in with no invitation link
           team = Team.objects.create(name=f"{user.username}'s Team", created_by=user)
           user.team = team
           user.save()

          
       
        return user 
    
    # serializer to update user profile
class UpdateUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['role', 'is_staff', 'username', 'email']
        read_only_fields = ['is_staff'] 
     
     # serialiser forgot password
class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    username = serializers.CharField()

    def validate(self, data):
        email = data.get('email').strip().lower()
        username = data.get('username')
        user_exists = User.objects.filter(username=username, email__iexact=email).exists()
        if not user_exists:
            raise serializers.ValidationError("User with this username and email does not exist.")
        return data



class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    username = serializers.CharField()
    code = serializers.CharField()
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = User.objects.filter(username=data['username'], email__iexact=data['email']).first()
        if not user:
            raise serializers.ValidationError("User not found.")
        if not user.is_active:
            raise serializers.ValidationError("Inactive user.")
        
        # Check confirmation code exists and not expired
        try:
            conf_code = ConfirmationCode.objects.get(user=user, code=data['code'])
        except ConfirmationCode.DoesNotExist:
            raise serializers.ValidationError("Invalid or expired confirmation code.")

        if conf_code.is_expired():
            raise serializers.ValidationError("Confirmation code expired.")

        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match.")
        
        data['user'] = user
        return data
    
# get current user        
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "role"] 
        read_only_fields = ["role"]


