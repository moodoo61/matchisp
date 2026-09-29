"""
Signals للتفاعل التلقائي مع Matrix
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
import logging

from .models import ChatUser, ChatRoom, SiteSettings
from .matrix_service import MatrixService

logger = logging.getLogger(__name__)


@receiver(post_save, sender=ChatUser)
def create_matrix_user_on_save(sender, instance, created, **kwargs):
    """
    إنشاء مستخدم في Matrix تلقائياً عند إنشاء ChatUser من Django Admin
    """
    # فقط عند إنشاء مستخدم جديد وليس لديه معرف Matrix
    if created and not instance.matrix_user_id:
        # استخدام كلمة المرور الثابتة إذا لم تكن موجودة
        password = instance.password if instance.password else '123'
        try:
            site_settings = SiteSettings.load()
            
            if not site_settings.matrix_homeserver_url:
                logger.warning("سيرفر Matrix غير مُعد - لا يمكن إنشاء المستخدم في Matrix")
                return
            
            matrix_service = MatrixService(site_settings.matrix_homeserver_url)
            
            # محاولة إنشاء المستخدم في Matrix
            logger.info(f"محاولة إنشاء مستخدم Matrix تلقائياً: {instance.username}")
            
            try:
                # محاولة التسجيل العادي أولاً
                matrix_response = matrix_service.register_user(
                    username=instance.username,
                    password=password,
                    display_name=instance.username,
                    admin_access_token=None
                )
            except Exception as e:
                # إذا فشل، جرب مع Admin Token
                error_msg = str(e)
                if 'Registration' in error_msg or 'M_FORBIDDEN' in error_msg or 'التسجيل معطل' in error_msg:
                    logger.info("التسجيل العادي معطل، محاولة باستخدام Admin API")
                    
                    if not site_settings.matrix_admin_user or not site_settings.matrix_admin_password:
                        logger.warning("بيانات مستخدم الإدارة غير مُعدة - لا يمكن إنشاء المستخدم")
                        return
                    
                    # تسجيل دخول الإدارة
                    from .matrix_cache import get_admin_token
                    admin_token = get_admin_token(
                        matrix_service,
                        site_settings.matrix_admin_user,
                        site_settings.matrix_admin_password
                    )
                    
                    # محاولة التسجيل مع Admin Token
                    try:
                        matrix_response = matrix_service.register_user(
                            username=instance.username,
                            password=password,
                            display_name=instance.username,
                            admin_access_token=admin_token
                        )
                    except Exception as admin_error:
                        # إذا كان المستخدم موجوداً بالفعل، جرب تسجيل الدخول
                        if '409' in str(admin_error) or 'موجود' in str(admin_error):
                            logger.info(f"المستخدم موجود في Matrix، محاولة تسجيل الدخول: {instance.username}")
                            try:
                                matrix_response = matrix_service.login(instance.username, password)
                            except Exception as login_error:
                                logger.error(f"فشل تسجيل الدخول للمستخدم الموجود: {str(login_error)}")
                                return
                        else:
                            logger.error(f"فشل إنشاء المستخدم في Matrix: {str(admin_error)}")
                            return
                else:
                    logger.error(f"خطأ في إنشاء المستخدم في Matrix: {error_msg}")
                    return
            
            # تحديث بيانات المستخدم في Django
            instance.matrix_user_id = matrix_response.get('user_id')
            instance.access_token = matrix_response.get('access_token')
            instance.device_id = matrix_response.get('device_id')
            instance.token_expires_at = timezone.now() + timedelta(days=90)
            instance.password = password  # حفظ كلمة المرور
            
            # حفظ بدون تفعيل signal مرة أخرى
            ChatUser.objects.filter(pk=instance.pk).update(
                password=password,
                matrix_user_id=instance.matrix_user_id,
                access_token=instance.access_token,
                device_id=instance.device_id,
                token_expires_at=instance.token_expires_at
            )
            
            logger.info(f"تم إنشاء مستخدم Matrix بنجاح: {instance.username} -> {instance.matrix_user_id}")
            
        except Exception as e:
            logger.error(f"خطأ في signal إنشاء مستخدم Matrix: {str(e)}")


# تم نقل منطق إنشاء غرف Matrix إلى ChatRoom.save() method
# بدلاً من استخدام post_save signal لضمان عدم الحفظ في Django
# إلا إذا تم إنشاء الغرفة بنجاح في Matrix Server

