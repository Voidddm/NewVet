import uuid

from django.db import migrations, models
from django.db.models import Q


class Migration(migrations.Migration):

    dependencies = [
        ('appointments', '0011_appointment_pet_avatar_data_url'),
    ]

    operations = [
        migrations.AddField(
            model_name='appointment',
            name='finalized_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='appointment',
            name='reminder_24h_sent',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='appointment',
            name='reminder_30m_sent',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='appointment',
            name='started_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='appointment',
            name='teleconsulta_link',
            field=models.UUIDField(blank=True, help_text='UUID privado de la sala de teleconsulta.', null=True, unique=True),
        ),
        migrations.AlterField(
            model_name='appointment',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending', 'Pendiente'),
                    ('accepted', 'Aceptada'),
                    ('in_progress', 'En curso'),
                    ('finalized', 'Finalizada'),
                    ('rejected', 'Rechazada'),
                    ('cancelled', 'Cancelada'),
                    ('completed', 'Completada'),
                ],
                default='pending',
                max_length=20,
            ),
        ),
        migrations.RemoveConstraint(
            model_name='appointment',
            name='unique_appointment_per_slot',
        ),
        migrations.AddConstraint(
            model_name='appointment',
            constraint=models.UniqueConstraint(
                condition=Q(status__in=['pending', 'accepted', 'in_progress']),
                fields=('veterinarian', 'date', 'time'),
                name='unique_appointment_per_slot',
            ),
        ),
        migrations.RunSQL(
            sql=(
                "UPDATE appointments_appointment "
                "SET teleconsulta_link = lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || "
                "substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || "
                "substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))) "
                "WHERE mode = 'online' AND teleconsulta_link IS NULL"
            ),
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
