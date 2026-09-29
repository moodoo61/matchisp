# Generated migration for adding Team model and updating Match

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('streaming', '0001_initial'),
    ]

    operations = [
        # 1. إنشاء نموذج Team
        migrations.CreateModel(
            name='Team',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200, verbose_name='اسم الفريق')),
                ('team_type', models.CharField(choices=[('national', 'منتخب'), ('club', 'نادي')], default='club', max_length=20, verbose_name='نوع الفريق')),
                ('logo', models.ImageField(upload_to='teams/logos/', verbose_name='شعار الفريق')),
                ('is_active', models.BooleanField(default=True, verbose_name='نشط')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الإنشاء')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='تاريخ التحديث')),
            ],
            options={
                'verbose_name': 'فريق',
                'verbose_name_plural': 'الفرق',
                'db_table': 'api_team',
                'ordering': ['team_type', 'name'],
            },
        ),
        
        # 2. إضافة حقل نوع المباراة
        migrations.AddField(
            model_name='match',
            name='match_type',
            field=models.CharField(choices=[('national', 'منتخبات'), ('club', 'أندية')], default='club', max_length=20, verbose_name='نوع المباراة'),
        ),
        
        # 3. إضافة الحقول الجديدة للفرق (nullable مؤقتاً)
        migrations.AddField(
            model_name='match',
            name='team1',
            field=models.ForeignKey(null=True, blank=True, on_delete=django.db.models.deletion.CASCADE, related_name='home_matches', to='streaming.team', verbose_name='الفريق الأول'),
        ),
        migrations.AddField(
            model_name='match',
            name='team2',
            field=models.ForeignKey(null=True, blank=True, on_delete=django.db.models.deletion.CASCADE, related_name='away_matches', to='streaming.team', verbose_name='الفريق الثاني'),
        ),
        
        # 4. حذف الحقول القديمة
        migrations.RemoveField(
            model_name='match',
            name='team1_name',
        ),
        migrations.RemoveField(
            model_name='match',
            name='team1_logo',
        ),
        migrations.RemoveField(
            model_name='match',
            name='team2_name',
        ),
        migrations.RemoveField(
            model_name='match',
            name='team2_logo',
        ),
        migrations.RemoveField(
            model_name='match',
            name='channel',
        ),
        
        # 5. تحديث live_channel ليكون nullable
        migrations.AlterField(
            model_name='match',
            name='live_channel',
            field=models.ForeignKey(blank=True, help_text='القناة التي ستنقل المباراة', null=True, on_delete=django.db.models.deletion.SET_NULL, to='streaming.livechannel', verbose_name='قناة البث المباشر'),
        ),
    ]

