from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_user_contact_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='credential_status',
            field=models.CharField(blank=True, default='', max_length=30),
        ),
        migrations.AddField(
            model_name='user',
            name='professional_bio',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='user',
            name='professional_license',
            field=models.CharField(blank=True, default='', max_length=80),
        ),
        migrations.AddField(
            model_name='user',
            name='specialty',
            field=models.CharField(blank=True, default='', max_length=120),
        ),
    ]
