from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('appointments', '0005_clinical_appointment_panel'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='appointment',
            options={'ordering': ['-date', '-time']},
        ),
    ]
