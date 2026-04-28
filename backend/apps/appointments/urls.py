from django.urls import path

from .views import AppointmentCreateView

urlpatterns = [
    path('', AppointmentCreateView.as_view(), name='appointment-create'),
]
