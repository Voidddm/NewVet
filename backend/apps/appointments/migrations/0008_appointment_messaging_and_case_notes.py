from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('appointments', '0007_availability_mode'),
    ]

    operations = [
        migrations.AddField(
            model_name='appointment',
            name='messaging_enabled',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='appointment',
            name='client_case_notes',
            field=models.TextField(blank=True, default=''),
        ),
    ]
