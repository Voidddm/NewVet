from django.contrib.auth import get_user_model
from rest_framework import serializers


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'role', 'is_active', 'is_staff', 'created_at')
        read_only_fields = ('id', 'email', 'role', 'is_active', 'is_staff', 'created_at')

    def validate_name(self, value):
        if not value or not str(value).strip():
            raise serializers.ValidationError('El nombre no puede estar vacio.')
        return str(value).strip()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'password', 'role')

    def validate_name(self, value):
        if not value or not str(value).strip():
            raise serializers.ValidationError('El nombre no puede estar vacio.')
        return str(value).strip()

    def create(self, validated_data):
        password = validated_data.pop('password')
        return User.objects.create_user(password=password, **validated_data)
