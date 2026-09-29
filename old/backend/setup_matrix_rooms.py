"""
سكريبت لإعداد غرف Matrix للقنوات النشطة
استخدام: python manage.py shell < setup_matrix_rooms.py
أو: python manage.py runscript setup_matrix_rooms (إذا كان django-extensions مثبت)
"""

import os
import sys
import django

# إعداد Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'match_api.settings')
django.setup()

from api.models import LiveChannel, ChatRoom, SiteSettings
from api.matrix_service import MatrixService

def setup_matrix_rooms():
    """إنشاء غرف Matrix لجميع القنوات النشطة"""
    
    print("=" * 60)
    print("إعداد غرف Matrix للقنوات")
    print("=" * 60)
    
    # الحصول على إعدادات Matrix
    site_settings = SiteSettings.load()
    
    if not site_settings.matrix_homeserver_url:
        print("❌ خطأ: عنوان سيرفر Matrix غير مُعد!")
        print("يرجى إعداد عنوان سيرفر Matrix في Django Admin -> إعدادات الموقع")
        return False
    
    print(f"✓ عنوان سيرفر Matrix: {site_settings.matrix_homeserver_url}")
    
    # تهيئة Matrix Service
    matrix_service = MatrixService(site_settings.matrix_homeserver_url)
    
    # الحصول على Access Token للإدارة (إن وجد)
    admin_token = None
    if site_settings.matrix_admin_user and site_settings.matrix_admin_password:
        try:
            print(f"جاري تسجيل دخول الإدارة: {site_settings.matrix_admin_user}...")
            login_response = matrix_service.login(
                site_settings.matrix_admin_user,
                site_settings.matrix_admin_password
            )
            admin_token = login_response.get('access_token')
            print("✓ تم تسجيل دخول الإدارة بنجاح")
        except Exception as e:
            print(f"⚠️ تحذير: فشل تسجيل دخول الإدارة: {e}")
            print("سيتم إنشاء الغرف بدون صلاحيات إدارية")
    else:
        print("⚠️ تحذير: بيانات الإدارة غير موجودة")
        print("سيتم إنشاء الغرف بدون صلاحيات إدارية")
    
    # الحصول على جميع القنوات النشطة
    channels = LiveChannel.objects.filter(is_active=True).order_by('order', 'id')
    
    if not channels.exists():
        print("❌ لا توجد قنوات نشطة!")
        return False
    
    print(f"\nتم العثور على {channels.count()} قناة نشطة")
    print("-" * 60)
    
    success_count = 0
    skip_count = 0
    error_count = 0
    
    for channel in channels:
        print(f"\nالقناة: {channel.name} (ID: {channel.id})")
        
        # التحقق من وجود غرفة سابقة
        if hasattr(channel, 'chat_room') and channel.chat_room.matrix_room_id:
            print(f"  ⏭️  الغرفة موجودة بالفعل: {channel.chat_room.matrix_room_id[:50]}...")
            skip_count += 1
            continue
        
        try:
            # إنشاء الغرفة
            room_name = channel.name
            room_alias = f"{site_settings.matrix_room_prefix}{channel.id}"
            
            print(f"  📝 إنشاء الغرفة: {room_name}")
            print(f"  📝 الاسم المستعار: {room_alias}")
            
            room_response = matrix_service.create_room(
                name=room_name,
                alias=room_alias,
                topic=channel.description or f"غرفة دردشة {channel.name}",
                is_public=True,
                access_token=admin_token
            )
            
            room_id = room_response.get('room_id')
            room_alias_full = room_response.get('room_alias')
            
            print(f"  ✓ تم إنشاء الغرفة: {room_id}")
            
            # إنشاء أو تحديث ChatRoom في Django
            chat_room, created = ChatRoom.objects.get_or_create(
                channel=channel,
                defaults={
                    'name': room_name,
                    'description': channel.description,
                    'matrix_room_id': room_id,
                    'matrix_room_alias': room_alias_full
                }
            )
            
            if not created:
                chat_room.matrix_room_id = room_id
                chat_room.matrix_room_alias = room_alias_full
                chat_room.name = room_name
                if channel.description:
                    chat_room.description = channel.description
                chat_room.save()
            
            print(f"  ✓ تم حفظ الغرفة في قاعدة البيانات")
            success_count += 1
            
        except Exception as e:
            print(f"  ❌ خطأ: {str(e)}")
            error_count += 1
            continue
    
    # ملخص النتائج
    print("\n" + "=" * 60)
    print("ملخص النتائج:")
    print("=" * 60)
    print(f"✓ تم إنشاء {success_count} غرفة بنجاح")
    print(f"⏭️  تم تخطي {skip_count} غرفة (موجودة مسبقاً)")
    print(f"❌ فشل في إنشاء {error_count} غرفة")
    print("=" * 60)
    
    return error_count == 0


def test_matrix_connection():
    """اختبار الاتصال بسيرفر Matrix"""
    
    print("=" * 60)
    print("اختبار الاتصال بسيرفر Matrix")
    print("=" * 60)
    
    site_settings = SiteSettings.load()
    
    if not site_settings.matrix_homeserver_url:
        print("❌ خطأ: عنوان سيرفر Matrix غير مُعد!")
        return False
    
    print(f"عنوان السيرفر: {site_settings.matrix_homeserver_url}")
    
    try:
        # اختبار الاتصال البسيط
        import requests
        
        # اختبار endpoint الإصدارات
        versions_url = f"{site_settings.matrix_homeserver_url.rstrip('/')}/_matrix/client/versions"
        print(f"\nاختبار الاتصال: {versions_url}")
        
        response = requests.get(versions_url, timeout=5)
        response.raise_for_status()
        
        versions = response.json()
        print(f"✓ الاتصال ناجح!")
        print(f"  إصدارات Matrix المدعومة: {versions.get('versions', [])}")
        
        # اختبار تسجيل الدخول (إن وجدت بيانات الإدارة)
        if site_settings.matrix_admin_user and site_settings.matrix_admin_password:
            print(f"\nاختبار تسجيل الدخول: {site_settings.matrix_admin_user}")
            matrix_service = MatrixService(site_settings.matrix_homeserver_url)
            login_response = matrix_service.login(
                site_settings.matrix_admin_user,
                site_settings.matrix_admin_password
            )
            print(f"✓ تسجيل الدخول ناجح!")
            print(f"  User ID: {login_response.get('user_id')}")
        else:
            print("\n⚠️ بيانات الإدارة غير موجودة - تم تخطي اختبار تسجيل الدخول")
        
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ خطأ: فشل الاتصال بسيرفر Matrix")
        print("  تأكد من أن Synapse يعمل وأن العنوان صحيح")
        return False
    except requests.exceptions.Timeout:
        print("❌ خطأ: انتهت مهلة الاتصال")
        return False
    except Exception as e:
        print(f"❌ خطأ: {str(e)}")
        return False


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        # اختبار الاتصال فقط
        test_matrix_connection()
    else:
        # اختبار الاتصال أولاً
        if test_matrix_connection():
            print("\n")
            # ثم إنشاء الغرف
            setup_matrix_rooms()
        else:
            print("\n❌ فشل اختبار الاتصال. يرجى التحقق من إعدادات Matrix أولاً.")

