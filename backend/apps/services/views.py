from django.apps import apps as django_apps
from rest_framework import generics, permissions

from .serializers import ServiceSerializer


class ServiceListView(generics.ListAPIView):
    serializer_class = ServiceSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        try:
            service_model = django_apps.get_model('services', 'Service')
        except LookupError:
            return []
        return service_model.objects.all().order_by('name')
