from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL


class Availability(models.Model):

    class Mode(models.TextChoices):
        ONLINE = 'online', 'Teleconsulta'
        HOME = 'home', 'Domicilio'

    veterinarian = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    day_of_week = models.IntegerField()  # 0=Lunes ... 6=Domingo

    start_time = models.TimeField()
    end_time = models.TimeField()

    mode = models.CharField(
        max_length=10,
        choices=Mode.choices
    )

    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.veterinarian} - {self.day_of_week} {self.start_time}-{self.end_time} ({self.mode})"