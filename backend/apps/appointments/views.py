from django.apps import apps as django_apps
from rest_framework import generics

from .serializers import AppointmentSerializer


class AppointmentCreateView(generics.CreateAPIView):
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        try:
            appointment_model = django_apps.get_model('appointments', 'Appointment')
        except LookupError:
            return []
        return appointment_model.objects.all()

    def perform_create(self, serializer):
        try:
            django_apps.get_model('appointments', 'Appointment')
        except LookupError:
            return
        serializer.save()
