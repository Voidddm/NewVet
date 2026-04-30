from datetime import timedelta

from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils import timezone

User = settings.AUTH_USER_MODEL


class Appointment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pendiente'
        ACCEPTED = 'accepted', 'Aceptada'
        REJECTED = 'rejected', 'Rechazada'
        CANCELLED = 'cancelled', 'Cancelada'
        COMPLETED = 'completed', 'Completada'

    class Mode(models.TextChoices):
        ONLINE = 'online', 'Teleconsulta'
        HOME = 'home', 'Domicilio'
        SURGERY = 'surgery', 'Cirugia'

    client = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='client_appointments',
    )
    veterinarian = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='vet_appointments',
    )
    service = models.ForeignKey(
        'services.Service',
        on_delete=models.CASCADE,
        related_name='appointments',
    )

    date = models.DateField()
    time = models.TimeField()
    mode = models.CharField(max_length=10, choices=Mode.choices)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    surgery_room = models.ForeignKey(
        'appointments.SurgeryRoom',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='appointments',
    )
    referral_file = models.FileField(
        upload_to='appointments/referrals/',
        null=True,
        blank=True,
    )
    is_surgery_approved = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date', '-time']
        constraints = [
            models.UniqueConstraint(
                fields=['veterinarian', 'date', 'time'],
                condition=Q(status__in=['pending', 'accepted']),
                name='unique_appointment_per_slot',
            )
        ]

    def save(self, *args, **kwargs):
        if self.status == self.Status.PENDING and self.expires_at is None:
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)

    def accept(self):
        self.status = self.Status.ACCEPTED
        self.accepted_at = timezone.now()
        self.save(update_fields=['status', 'accepted_at'])

    def reject(self):
        self.status = self.Status.REJECTED
        self.save(update_fields=['status'])

    def cancel(self):
        self.status = self.Status.CANCELLED
        self.cancelled_at = timezone.now()
        self.save(update_fields=['status', 'cancelled_at'])

    def complete(self):
        self.status = self.Status.COMPLETED
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'completed_at'])

    @classmethod
    def cancel_expired_pending(cls):
        return cls.objects.filter(
            status=cls.Status.PENDING,
            expires_at__lt=timezone.now(),
        ).update(status=cls.Status.CANCELLED, cancelled_at=timezone.now())

    def __str__(self):
        return f"{self.date} {self.time} - {self.veterinarian}"
