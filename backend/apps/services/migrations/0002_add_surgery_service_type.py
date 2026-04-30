from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('services', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='service',
            name='service_type',
            field=models.CharField(
                choices=[
                    ('clinic', 'Clinica'),
                    ('home', 'Domicilio'),
                    ('online', 'Teleconsulta'),
                    ('surgery', 'Cirugia'),
                ],
                max_length=20,
            ),
        ),
    ]
