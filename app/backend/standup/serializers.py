from rest_framework import serializers
from .models import StandUp

class StandUpSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta :
        model = StandUp
        fields = ["title","progress","id","created_at","username","user"]
        read_only_fields = ["id","username","created_at","user"]