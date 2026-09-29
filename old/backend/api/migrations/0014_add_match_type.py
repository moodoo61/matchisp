# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0013_add_voting_to_match'),
    ]

    operations = [
        migrations.AddField(
            model_name='match',
            name='match_type',
            field=models.CharField(
                choices=[('national', 'منتخبات'), ('club', 'أندية')],
                default='club',
                max_length=20,
                verbose_name='نوع المباراة'
            ),
        ),
    ]

