from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView

from .views import RegisterUserView

urlpatterns = [
    path('register/', RegisterUserView.as_view(), name='register-user'),
    path('login/', TokenObtainPairView.as_view(), name='login-user'),
]
