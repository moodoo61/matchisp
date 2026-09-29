# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_alter_match_options'),
    ]

    operations = [
        migrations.AddField(
            model_name='match',
            name='team1_votes',
            field=models.IntegerField(default=0, help_text='عدد التصويتات للفريق الأول', verbose_name='تصويتات الفريق الأول'),
        ),
        migrations.AddField(
            model_name='match',
            name='team2_votes',
            field=models.IntegerField(default=0, help_text='عدد التصويتات للفريق الثاني', verbose_name='تصويتات الفريق الثاني'),
        ),
    ]

