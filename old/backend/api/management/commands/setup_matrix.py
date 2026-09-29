"""
Django Management Command لإعداد غرف Matrix
استخدام: python manage.py setup_matrix
"""

import sys
import io

# إصلاح مشكلة الترميز في Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import LiveChannel, ChatRoom, SiteSettings
from api.matrix_service import MatrixService
import requests


class Command(BaseCommand):
    help = 'إعداد غرف Matrix للقنوات النشطة'

    def add_arguments(self, parser):
        parser.add_argument(
            '--test-only',
            action='store_true',
            help='اختبار الاتصال فقط بدون إنشاء الغرف',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='إعادة إنشاء الغرف حتى لو كانت موجودة',
        )

    def handle(self, *args, **options):
        test_only = options['test_only']
        force = options['force']
        
        self.stdout.write("=" * 60)
        self.stdout.write(self.style.SUCCESS("إعداد غرف Matrix للقنوات"))
        self.stdout.write("=" * 60)
        
        # اختبار الاتصال
        if not self.test_connection():
            self.stdout.write(self.style.ERROR("\n❌ فشل اختبار الاتصال. يرجى التحقق من إعدادات Matrix أولاً."))
            return
        
        if test_only:
            self.stdout.write(self.style.SUCCESS("\n✓ تم اختبار الاتصال بنجاح!"))
            return
        
        # إنشاء الغرف
        self.setup_rooms(force)

    def test_connection(self):
        """اختبار الاتصال بسيرفر Matrix"""
        self.stdout.write("\nاختبار الاتصال بسيرفر Matrix...")
        
        site_settings = SiteSettings.load()
        
        if not site_settings.matrix_homeserver_url:
            self.stdout.write(self.style.ERROR("❌ خطأ: عنوان سيرفر Matrix غير مُعد!"))
            self.stdout.write("يرجى إعداد عنوان سيرفر Matrix في Django Admin -> إعدادات الموقع")
            return False
        
        self.stdout.write(f"عنوان السيرفر: {site_settings.matrix_homeserver_url}")
        
        try:
            # اختبار endpoint الإصدارات
            versions_url = f"{site_settings.matrix_homeserver_url.rstrip('/')}/_matrix/client/versions"
            self.stdout.write(f"اختبار الاتصال: {versions_url}")
            
            response = requests.get(versions_url, timeout=5)
            response.raise_for_status()
            
            versions = response.json()
            self.stdout.write(self.style.SUCCESS("✓ الاتصال ناجح!"))
            self.stdout.write(f"  إصدارات Matrix المدعومة: {versions.get('versions', [])}")
            
            # اختبار تسجيل الدخول (إن وجدت بيانات الإدارة)
            if site_settings.matrix_admin_user and site_settings.matrix_admin_password:
                self.stdout.write(f"\nاختبار تسجيل الدخول: {site_settings.matrix_admin_user}")
                matrix_service = MatrixService(site_settings.matrix_homeserver_url)
                login_response = matrix_service.login(
                    site_settings.matrix_admin_user,
                    site_settings.matrix_admin_password
                )
                self.stdout.write(self.style.SUCCESS("✓ تسجيل الدخول ناجح!"))
                self.stdout.write(f"  User ID: {login_response.get('user_id')}")
            else:
                self.stdout.write(self.style.WARNING("\n⚠️ بيانات الإدارة غير موجودة - تم تخطي اختبار تسجيل الدخول"))
            
            return True
            
        except requests.exceptions.ConnectionError:
            self.stdout.write(self.style.ERROR("❌ خطأ: فشل الاتصال بسيرفر Matrix"))
            self.stdout.write("  تأكد من أن Synapse يعمل وأن العنوان صحيح")
            return False
        except requests.exceptions.Timeout:
            self.stdout.write(self.style.ERROR("❌ خطأ: انتهت مهلة الاتصال"))
            return False
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ خطأ: {str(e)}"))
            return False

    def setup_rooms(self, force=False):
        """إنشاء غرف Matrix لجميع القنوات النشطة"""
        self.stdout.write("\n" + "-" * 60)
        self.stdout.write("إنشاء غرف Matrix للقنوات")
        self.stdout.write("-" * 60)
        
        site_settings = SiteSettings.load()
        matrix_service = MatrixService(site_settings.matrix_homeserver_url)
        
        # الحصول على Access Token للإدارة (إن وجد)
        admin_token = None
        if site_settings.matrix_admin_user and site_settings.matrix_admin_password:
            try:
                self.stdout.write(f"جاري تسجيل دخول الإدارة: {site_settings.matrix_admin_user}...")
                login_response = matrix_service.login(
                    site_settings.matrix_admin_user,
                    site_settings.matrix_admin_password
                )
                admin_token = login_response.get('access_token')
                self.stdout.write(self.style.SUCCESS("✓ تم تسجيل دخول الإدارة بنجاح"))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"⚠️ تحذير: فشل تسجيل دخول الإدارة: {e}"))
                self.stdout.write("سيتم إنشاء الغرف بدون صلاحيات إدارية")
        else:
            self.stdout.write(self.style.WARNING("⚠️ تحذير: بيانات الإدارة غير موجودة"))
            self.stdout.write("سيتم إنشاء الغرف بدون صلاحيات إدارية")
        
        # الحصول على جميع القنوات النشطة
        channels = LiveChannel.objects.filter(is_active=True).order_by('order', 'id')
        
        if not channels.exists():
            self.stdout.write(self.style.ERROR("❌ لا توجد قنوات نشطة!"))
            return
        
        self.stdout.write(f"\nتم العثور على {channels.count()} قناة نشطة")
        
        # إنشاء أو الحصول على Space الرئيسي
        space_id = site_settings.matrix_space_id
        if not space_id and admin_token:
            try:
                self.stdout.write("\nإنشاء Space رئيسي جديد...")
                space_response = matrix_service.create_space(
                    name="MATCH Chat Rooms",
                    alias="match_chat_rooms",
                    topic="مجموعة غرف الدردشة لشبكة MATCH",
                    access_token=admin_token
                )
                space_id = space_response.get('room_id')
                site_settings.matrix_space_id = space_id
                site_settings.save()
                self.stdout.write(self.style.SUCCESS(f"✓ تم إنشاء Space رئيسي: {space_id}"))
            except Exception as space_error:
                self.stdout.write(self.style.WARNING(f"⚠️ فشل في إنشاء Space (سيتم إنشاء الغرف بدون Space): {space_error}"))
        elif space_id:
            self.stdout.write(f"\nاستخدام Space موجود: {space_id}")
        
        success_count = 0
        skip_count = 0
        error_count = 0
        
        for channel in channels:
            self.stdout.write(f"\nالقناة: {self.style.SUCCESS(channel.name)} (ID: {channel.id})")
            
            # التحقق من وجود غرفة سابقة
            if not force and hasattr(channel, 'chat_room') and channel.chat_room.matrix_room_id:
                self.stdout.write(f"  ⏭️  الغرفة موجودة بالفعل: {channel.chat_room.matrix_room_id[:50]}...")
                skip_count += 1
                continue
            
            try:
                # إنشاء الغرفة
                room_name = channel.name
                room_alias = f"{site_settings.matrix_room_prefix}{channel.id}"
                
                self.stdout.write(f"  📝 إنشاء الغرفة: {room_name}")
                
                room_response = matrix_service.create_room(
                    name=room_name,
                    alias=room_alias,
                    topic=channel.description or f"غرفة دردشة {channel.name}",
                    is_public=True,
                    access_token=admin_token,
                    space_id=space_id  # إضافة الغرفة إلى Space
                )
                
                room_id = room_response.get('room_id')
                room_alias_full = room_response.get('room_alias')
                
                self.stdout.write(self.style.SUCCESS(f"  ✓ تم إنشاء الغرفة: {room_id}"))
                
                # إنشاء أو تحديث ChatRoom في Django
                with transaction.atomic():
                    chat_room, created = ChatRoom.objects.get_or_create(
                        channel=channel,
                        defaults={
                            'name': room_name,
                            'description': channel.description,
                            'matrix_room_id': room_id,
                            'matrix_room_alias': room_alias_full
                        }
                    )
                    
                    if not created or force:
                        chat_room.matrix_room_id = room_id
                        chat_room.matrix_room_alias = room_alias_full
                        chat_room.name = room_name
                        if channel.description:
                            chat_room.description = channel.description
                        chat_room.save()
                
                self.stdout.write(self.style.SUCCESS("  ✓ تم حفظ الغرفة في قاعدة البيانات"))
                success_count += 1
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  ❌ خطأ: {str(e)}"))
                error_count += 1
                continue
        
        # ملخص النتائج
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("ملخص النتائج:"))
        self.stdout.write("=" * 60)
        self.stdout.write(self.style.SUCCESS(f"✓ تم إنشاء {success_count} غرفة بنجاح"))
        self.stdout.write(f"⏭️  تم تخطي {skip_count} غرفة (موجودة مسبقاً)")
        if error_count > 0:
            self.stdout.write(self.style.ERROR(f"❌ فشل في إنشاء {error_count} غرفة"))
        self.stdout.write("=" * 60)

