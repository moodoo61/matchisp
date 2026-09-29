"""
أمر Django لإصلاح مشكلة Rate Limiting في Matrix
"""
from django.core.management.base import BaseCommand
from api.models import SiteSettings
from api.matrix_service import MatrixService
from api.matrix_cache import clear_admin_token_cache
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'إصلاح مشكلة Rate Limiting في Matrix'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear-cache',
            action='store_true',
            help='مسح Cache للـ Admin Token',
        )
        parser.add_argument(
            '--test-connection',
            action='store_true',
            help='اختبار الاتصال فقط',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n=== إصلاح مشكلة Rate Limiting في Matrix ===\n'))
        
        site_settings = SiteSettings.load()
        
        if not site_settings.matrix_homeserver_url:
            self.stdout.write(self.style.ERROR('❌ خطأ: عنوان سيرفر Matrix غير مُعد!'))
            self.stdout.write('يرجى إعداد عنوان سيرفر Matrix في Django Admin -> إعدادات الموقع')
            return
        
        # مسح Cache إذا طُلب
        if options['clear_cache']:
            self.stdout.write('مسح Cache للـ Admin Token...')
            clear_admin_token_cache()
            self.stdout.write(self.style.SUCCESS('✓ تم مسح Cache'))
        
        # اختبار الاتصال
        if options['test_connection']:
            self.test_connection(site_settings)
        else:
            # عرض معلومات
            self.stdout.write(f'عنوان السيرفر: {site_settings.matrix_homeserver_url}')
            self.stdout.write(f'بيانات الإدارة موجودة: {"نعم" if site_settings.matrix_admin_user else "لا"}')
            
            # اختبار الاتصال
            self.test_connection(site_settings)
            
            # نصائح
            self.stdout.write(self.style.WARNING('\n=== نصائح لتجنب Rate Limiting ==='))
            self.stdout.write('1. تأكد من تعديل إعدادات Rate Limiting في Synapse (homeserver.yaml)')
            self.stdout.write('2. استخدم Cache للـ Admin Token (يعمل تلقائياً)')
            self.stdout.write('3. انتظر بين المحاولات (10 دقائق على الأقل)')
            self.stdout.write('4. راجع ملف: backend/MATRIX_RATE_LIMIT_FIX.md')
    
    def test_connection(self, site_settings):
        """اختبار الاتصال"""
        self.stdout.write('\nاختبار الاتصال...')
        matrix_service = MatrixService(site_settings.matrix_homeserver_url)
        
        connection_test = matrix_service.test_connection()
        if connection_test.get('success'):
            self.stdout.write(self.style.SUCCESS('✓ الاتصال ناجح'))
            versions = connection_test.get('versions', [])
            if versions:
                self.stdout.write(f'  الإصدارات المدعومة: {", ".join(versions)}')
        else:
            self.stdout.write(self.style.ERROR('❌ فشل الاتصال'))
            self.stdout.write(f'  الخطأ: {connection_test.get("error")}')
            return
        
        # اختبار تسجيل الدخول بمستخدم الإدارة
        if site_settings.matrix_admin_user and site_settings.matrix_admin_password:
            self.stdout.write('\nاختبار تسجيل الدخول بمستخدم الإدارة...')
            admin_test = matrix_service.test_admin_login(
                site_settings.matrix_admin_user,
                site_settings.matrix_admin_password
            )
            
            if admin_test.get('success'):
                self.stdout.write(self.style.SUCCESS('✓ تسجيل الدخول ناجح'))
                self.stdout.write(f'  User ID: {admin_test.get("user_id")}')
            else:
                self.stdout.write(self.style.ERROR('❌ فشل تسجيل الدخول'))
                error = admin_test.get('error', 'خطأ غير معروف')
                self.stdout.write(f'  الخطأ: {error}')
                
                if 'كثرة الطلبات' in error or 'M_LIMIT_EXCEEDED' in error:
                    self.stdout.write(self.style.WARNING('\n⚠️ Rate Limiting نشط!'))
                    self.stdout.write('  - انتظر بضع دقائق قبل المحاولة مرة أخرى')
                    self.stdout.write('  - راجع ملف: backend/MATRIX_RATE_LIMIT_FIX.md')
                    self.stdout.write('  - استخدم: python manage.py fix_matrix_rate_limit --clear-cache')

