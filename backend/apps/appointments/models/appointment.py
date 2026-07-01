from datetime import timedelta
import uuid

from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils import timezone

User = settings.AUTH_USER_MODEL


class Appointment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pendiente'
        ACCEPTED = 'accepted', 'Aceptada'
        IN_PROGRESS = 'in_progress', 'En curso'
        FINALIZED = 'finalized', 'Finalizada'
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
    messaging_enabled = models.BooleanField(
        default=False,
        help_text='El veterinario habilita el chat con el tutor para esta cita.',
    )
    client_case_notes = models.TextField(
        blank=True,
        default='',
        help_text='Notas del tutor sobre la mascota o el caso.',
    )
    pet_name = models.CharField(
        max_length=255,
        blank=True,
        default='',
        help_text='Nombre de la mascota asociada a la reserva.',
    )
    pet_avatar_data_url = models.TextField(
        blank=True,
        default='',
        help_text='Foto local de la mascota al momento de reservar.',
    )
    teleconsulta_link = models.UUIDField(
        unique=True,
        null=True,
        blank=True,
        help_text='UUID privado de la sala de teleconsulta.',
    )
    reminder_24h_sent = models.BooleanField(default=False)
    reminder_30m_sent = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finalized_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date', '-time']
        constraints = [
            models.UniqueConstraint(
                fields=['veterinarian', 'date', 'time'],
                condition=Q(status__in=['pending', 'accepted', 'in_progress']),
                name='unique_appointment_per_slot',
            )
        ]

    def save(self, *args, **kwargs):
        if self.status == self.Status.PENDING and self.expires_at is None:
            self.expires_at = timezone.now() + timedelta(hours=24)
        if self.mode == self.Mode.ONLINE and self.teleconsulta_link is None:
            self.teleconsulta_link = uuid.uuid4()
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

    def start_teleconsulta(self):
        self.status = self.Status.IN_PROGRESS
        self.started_at = timezone.now()
        self.save(update_fields=['status', 'started_at'])

    def finalize_teleconsulta(self):
        self.status = self.Status.FINALIZED
        self.finalized_at = timezone.now()
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'finalized_at', 'completed_at'])

    @classmethod
    def cancel_expired_pending(cls):
        return cls.objects.filter(
            status=cls.Status.PENDING,
            expires_at__lt=timezone.now(),
        ).update(status=cls.Status.CANCELLED, cancelled_at=timezone.now())

    def __str__(self):
        return f"{self.date} {self.time} - {self.veterinarian}"
