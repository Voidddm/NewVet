from django.db import models


class Service(models.Model):
    SERVICE_TYPE_CHOICES = (
        ('clinic', 'Clinica'),
        ('home', 'Domicilio'),
        ('online', 'Teleconsulta'),
        ('surgery', 'Cirugia'),
    )

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    duration_minutes = models.PositiveIntegerField()
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPE_CHOICES)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.duration_minutes} min)"
