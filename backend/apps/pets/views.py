from rest_framework import generics, permissions

from .serializers import PetSerializer


class PetListView(generics.ListAPIView):
    serializer_class = PetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return []
