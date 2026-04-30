from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('appointments', '0006_appointment_ordering'),
    ]

    operations = [
        migrations.AddField(
            model_name='availability',
            name='mode',
            field=models.CharField(
                choices=[('online', 'Teleconsulta'), ('home', 'Domicilio')],
                default='online',
                max_length=10,
            ),
            preserve_default=False,
        ),
    ]
