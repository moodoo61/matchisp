# Generated manually for StatusButton model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('general', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='StatusButton',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text='النص الذي سيظهر على الزر', max_length=200, verbose_name='اسم الزر')),
                ('url', models.CharField(help_text='مسار الزر (مثل: live2/index.html أو $(link-break))', max_length=500, verbose_name='المسار')),
                ('is_active', models.BooleanField(default=True, help_text='عند التعطيل، لن يظهر الزر في صفحة الحالة', verbose_name='الحالة')),
                ('order', models.IntegerField(default=0, help_text='الرقم الأقل يظهر أولاً', verbose_name='الترتيب')),
                ('icon', models.CharField(blank=True, help_text='اسم الأيقونة من fontello (مثل: icon-globe, icon-stop)', max_length=100, null=True, verbose_name='أيقونة')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الإنشاء')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='تاريخ التحديث')),
            ],
            options={
                'verbose_name': 'زر صفحة الحالة',
                'verbose_name_plural': 'أزرار صفحة الحالة',
                'ordering': ['order', 'created_at'],
                'db_table': 'api_statusbutton',
            },
        ),
    ]
