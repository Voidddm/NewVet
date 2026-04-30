from django.conf import settings
from django.db import migrations, models
from django.db.models import Q
import django.db.models.deletion


def normalize_appointment_status(apps, schema_editor):
    Appointment = apps.get_model('appointments', 'Appointment')
    Appointment.objects.filter(status='booked').update(status='pending')
    Appointment.objects.filter(status='confirmed').update(status='accepted')


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('appointments', '0004_alter_availability_day_of_week_and_more'),
        ('services', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='SurgeryRoom',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('address', models.CharField(blank=True, max_length=255, null=True)),
                ('description', models.TextField(blank=True, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.RunPython(normalize_appointment_status, migrations.RunPython.noop),
        migrations.AddField(
            model_name='appointment',
            name='mode',
            field=models.CharField(
                choices=[('online', 'Teleconsulta'), ('home', 'Domicilio'), ('surgery', 'Cirugia')],
                default='online',
                max_length=10,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='appointment',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AddField(
            model_name='appointment',
            name='accepted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='appointment',
            name='expires_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='appointment',
            name='cancelled_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='appointment',
            name='completed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='appointment',
            name='referral_file',
            field=models.FileField(blank=True, null=True, upload_to='appointments/referrals/'),
        ),
        migrations.AddField(
            model_name='appointment',
            name='is_surgery_approved',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='appointment',
            name='surgery_room',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='appointments',
                to='appointments.surgeryroom',
            ),
        ),
        migrations.AlterField(
            model_name='appointment',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending', 'Pendiente'),
                    ('accepted', 'Aceptada'),
                    ('rejected', 'Rechazada'),
                    ('cancelled', 'Cancelada'),
                    ('completed', 'Completada'),
                ],
                default='pending',
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name='appointment',
            name='service',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='appointments',
                to='services.service',
            ),
        ),
        migrations.AddConstraint(
            model_name='appointment',
            constraint=models.UniqueConstraint(
                condition=Q(status__in=['pending', 'accepted']),
                fields=('veterinarian', 'date', 'time'),
                name='unique_appointment_per_slot',
            ),
        ),
        migrations.CreateModel(
            name='MedicalFile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('file', models.FileField(upload_to='appointments/medical-files/')),
                ('file_type', models.CharField(
                    choices=[('image', 'Imagen'), ('pdf', 'PDF'), ('audio', 'Audio'), ('other', 'Otro')],
                    default='other',
                    max_length=20,
                )),
                ('description', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('appointment', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='medical_files',
                    to='appointments.appointment',
                )),
                ('uploaded_by', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='uploaded_medical_files',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='Message',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('read_at', models.DateTimeField(blank=True, null=True)),
                ('appointment', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='messages',
                    to='appointments.appointment',
                )),
                ('sender', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='appointment_messages',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'ordering': ['created_at']},
        ),
    ]
