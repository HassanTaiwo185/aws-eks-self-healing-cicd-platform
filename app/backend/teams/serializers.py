from rest_framework import serializers
from .models import Team , TeamInvite

# Team serialiser
class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ['id', 'name', 'created_by', 'created_at']
        read_only_fields = ['created_by', 'created_at']

# Team invite serialiser
class TeamInviteSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamInvite
        fields = ['id', 'team', 'token', 'used', 'created_at', 'invitee_email']
        read_only_fields = ['token', 'used', 'created_at']
