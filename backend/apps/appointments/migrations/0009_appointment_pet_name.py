from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('appointments', '0008_appointment_messaging_and_case_notes'),
    ]

    operations = [
        migrations.AddField(
            model_name='appointment',
            name='pet_name',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
    ]
