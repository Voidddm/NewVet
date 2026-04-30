from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView

from .views import CurrentUserView, RegisterUserView, VeterinarianListView

urlpatterns = [
    path('register/', RegisterUserView.as_view(), name='register-user'),
    path('login/', TokenObtainPairView.as_view(), name='login-user'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('veterinarians/', VeterinarianListView.as_view(), name='veterinarian-list'),
]
