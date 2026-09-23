import uuid

from django.conf import settings
from django.db import models

User = settings.AUTH_USER_MODEL


class ClinicalRecord(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Borrador'
        CLOSED = 'closed', 'Inmutable'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    appointment = models.OneToOneField(
        'appointments.Appointment',
        on_delete=models.CASCADE,
        related_name='clinical_record',
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='clinical_records',
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)

    consultation_reason = models.TextField(blank=True, default='')
    anamnesis = models.TextField()
    clinical_exam = models.TextField(blank=True, default='')
    diagnosis = models.TextField()
    weight_kg = models.DecimalField(max_digits=6, decimal_places=2)
    temperature_c = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    heart_rate_bpm = models.PositiveIntegerField(null=True, blank=True)
    respiratory_rate_rpm = models.PositiveIntegerField(null=True, blank=True)
    mucous_membranes = models.CharField(max_length=120, blank=True, default='')
    capillary_refill_time = models.CharField(max_length=120, blank=True, default='')
    prescription = models.TextField(blank=True, default='')
    attachment = models.FileField(upload_to='appointments/clinical-records/', null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def is_closed(self):
        return self.status == self.Status.CLOSED

    def __str__(self):
        return f"Ficha {self.id} - cita {self.appointment_id}"
