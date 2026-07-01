from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('appointments', '0010_merge_20260504_2118'),
    ]

    operations = [
        migrations.AddField(
            model_name='appointment',
            name='pet_avatar_data_url',
            field=models.TextField(blank=True, default=''),
        ),
    ]
