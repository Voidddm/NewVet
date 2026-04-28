from rest_framework import generics, permissions

from .serializers import RegisterSerializer


class RegisterUserView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
