from django.conf import settings
from django.db import models

User = settings.AUTH_USER_MODEL


class MedicalFile(models.Model):
    class FileType(models.TextChoices):
        IMAGE = 'image', 'Imagen'
        PDF = 'pdf', 'PDF'
        AUDIO = 'audio', 'Audio'
        OTHER = 'other', 'Otro'

    appointment = models.ForeignKey(
        'appointments.Appointment',
        on_delete=models.CASCADE,
        related_name='medical_files',
    )
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='uploaded_medical_files',
    )
    file = models.FileField(upload_to='appointments/medical-files/')
    file_type = models.CharField(
        max_length=20,
        choices=FileType.choices,
        default=FileType.OTHER,
    )
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.appointment_id} - {self.file_type}"
