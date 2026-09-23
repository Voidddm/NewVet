import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('appointments', '0012_teleconsultation_fields_and_statuses'),
    ]

    operations = [
        migrations.CreateModel(
            name='ClinicalRecord',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('status', models.CharField(choices=[('draft', 'Borrador'), ('closed', 'Inmutable')], default='draft', max_length=20)),
                ('consultation_reason', models.TextField(blank=True, default='')),
                ('anamnesis', models.TextField()),
                ('clinical_exam', models.TextField(blank=True, default='')),
                ('diagnosis', models.TextField()),
                ('weight_kg', models.DecimalField(decimal_places=2, max_digits=6)),
                ('temperature_c', models.DecimalField(blank=True, decimal_places=1, max_digits=4, null=True)),
                ('heart_rate_bpm', models.PositiveIntegerField(blank=True, null=True)),
                ('respiratory_rate_rpm', models.PositiveIntegerField(blank=True, null=True)),
                ('mucous_membranes', models.CharField(blank=True, default='', max_length=120)),
                ('capillary_refill_time', models.CharField(blank=True, default='', max_length=120)),
                ('prescription', models.TextField(blank=True, default='')),
                ('attachment', models.FileField(blank=True, null=True, upload_to='appointments/clinical-records/')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('closed_at', models.DateTimeField(blank=True, null=True)),
                ('appointment', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='clinical_record', to='appointments.appointment')),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='clinical_records', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
