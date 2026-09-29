"""
API Views للتفاعل مع Matrix/Synapse
"""
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from datetime import timedelta
import json
import logging

from .models import ChatUser, ChatRoom, LiveChannel, SiteSettings
from .matrix_service import MatrixService
from .matrix_cache import get_admin_token

logger = logging.getLogger(__name__)


@require_http_methods(["POST"])
@csrf_exempt
def matrix_register(request):
    """
    تسجيل مستخدم جديد في Matrix
    POST /api/matrix/register
    Body: {
        "username": "user123",
        "password": "secure_password",
        "display_name": "اسم المستخدم"
    }
    """
    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        display_name = data.get('display_name', username)
        
        if not username or not password:
            return JsonResponse({
                'success': False,
                'error': 'اسم المستخدم وكلمة المرور مطلوبان'
            }, status=400, json_dumps_params={'ensure_ascii': False})
        
        # تنظيف وتحقق من صحة اسم المستخدم
        # Matrix يسمح فقط بـ: a-z, A-Z, 0-9, ., _, -, =
        import re
        # إزالة جميع الأحرف غير المسموحة
        username_clean = re.sub(r'[^a-zA-Z0-9._=-]', '', username)
        # إزالة الأحرف الخاصة في البداية والنهاية
        username_clean = username_clean.strip('._-')
        
        if not username_clean or len(username_clean) < 3:
            return JsonResponse({
                'success': False,
                'error': 'اسم المستخدم غير صحيح. يجب أن يحتوي على 3 أحرف على الأقل وأن يحتوي فقط على: حروف، أرقام، وعلامات (._-=)'
            }, status=400, json_dumps_params={'ensure_ascii': False})
        
        if len(username_clean) > 64:
            username_clean = username_clean[:64]
        
        # التحقق من وجود كلمة المرور
        if not password:
            return JsonResponse({
                'success': False,
                'error': 'كلمة المرور مطلوبة'
            }, status=400, json_dumps_params={'ensure_ascii': False})
        
        # استخدام الاسم النظيف
        username = username_clean
        
        # الحصول على إعدادات Matrix
        site_settings = SiteSettings.load()
        if not site_settings.matrix_homeserver_url:
            return JsonResponse({
                'success': False,
                'error': 'سيرفر Matrix غير مُعد. يرجى إعداد عنوان سيرفر Matrix في إعدادات الموقع'
            }, status=500, json_dumps_params={'ensure_ascii': False})
        
        # إنشاء المستخدم في Matrix
        matrix_service = MatrixService(site_settings.matrix_homeserver_url)
        
        # اختبار الاتصال قبل المحاولة (اختياري - يمكن تعطيله إذا كان يسبب مشاكل)
        # connection_test = matrix_service.test_connection()
        # if not connection_test.get('success'):
        #     return JsonResponse({
        #         'success': False,
        #         'error': connection_test.get('error', 'فشل الاتصال بسيرفر Matrix')
        #     }, status=500, json_dumps_params={'ensure_ascii': False})
        
        # التحقق من وجود مستخدم مع access_token صالح في قاعدة البيانات
        try:
            chat_user = ChatUser.objects.get(username=username)
            if chat_user.access_token and chat_user.matrix_user_id:
                if chat_user.token_expires_at and chat_user.token_expires_at > timezone.now():
                    logger.info(f"استخدام access_token موجود للمستخدم (من التسجيل): {username}")
                    return JsonResponse({
                        'success': True,
                        'user_id': chat_user.matrix_user_id,
                        'access_token': chat_user.access_token,
                        'device_id': chat_user.device_id,
                        'from_cache': True
                    }, json_dumps_params={'ensure_ascii': False})
        except ChatUser.DoesNotExist:
            pass
        
        # محاولة التسجيل العادي أولاً (إذا كان مفعّل)
        admin_token = None
        try:
            # محاولة التسجيل العادي أولاً
            matrix_response = matrix_service.register_user(
                username=username,
                password=password,
                display_name=display_name or username,
                admin_access_token=None
            )
        except Exception as e:
            # إذا فشل بسبب تعطيل التسجيل، جرب مع Admin Token
            error_msg = str(e)
            if 'Registration' in error_msg or 'M_FORBIDDEN' in error_msg or 'التسجيل معطل' in error_msg:
                logger.info(f"التسجيل العادي معطل، محاولة باستخدام Admin API")
                # الحصول على Access Token للإدارة (إن وجد)
                if site_settings.matrix_admin_user and site_settings.matrix_admin_password:
                    try:
                        admin_token = get_admin_token(
                            matrix_service,
                            site_settings.matrix_admin_user,
                            site_settings.matrix_admin_password
                        )
                    except Exception as admin_error:
                        admin_error_msg = str(admin_error)
                        logger.warning(f"فشل في الحصول على Admin Token: {admin_error_msg}")
                        
                        # إذا كان الخطأ بسبب كثرة الطلبات، ارفع رسالة واضحة
                        if 'كثرة الطلبات' in admin_error_msg or 'M_LIMIT_EXCEEDED' in admin_error_msg or 'Too Many Requests' in admin_error_msg:
                            # استخدام Exception عادي مع علامة خاصة
                            rate_limit_error = Exception(admin_error_msg)
                            rate_limit_error.is_rate_limit = True
                            raise rate_limit_error
                        
                        # إذا كان الخطأ بسبب Invalid username or password
                        if 'M_FORBIDDEN' in admin_error_msg or 'Invalid username or password' in admin_error_msg:
                            raise Exception("بيانات مستخدم الإدارة غير صحيحة. يرجى التحقق من إعدادات Matrix في لوحة التحكم.")
                        
                        # خطأ آخر
                        raise Exception("التسجيل معطل في Synapse ولا يمكن الحصول على Admin Token. يرجى التحقق من إعدادات Matrix.")
                
                if not admin_token:
                    raise Exception("التسجيل معطل في Synapse. يرجى إعداد بيانات مستخدم الإدارة في إعدادات Matrix.")
                
                # محاولة التسجيل مع Admin Token
                try:
                    matrix_response = matrix_service.register_user(
                        username=username,
                        password=password,
                        display_name=display_name or username,
                        admin_access_token=admin_token
                    )
                except Exception as admin_register_error:
                    admin_register_error_msg = str(admin_register_error)
                    logger.error(f"فشل التسجيل باستخدام Admin API: {admin_register_error_msg}")
                    
                    # إذا كان المستخدم موجوداً بالفعل، جرب تسجيل الدخول
                    if '409' in admin_register_error_msg or 'موجود' in admin_register_error_msg:
                        logger.info(f"المستخدم موجود بالفعل، محاولة تسجيل الدخول: {username}")
                        try:
                            matrix_response = matrix_service.login(username, password)
                        except Exception as login_error:
                            raise Exception(f"المستخدم موجود بالفعل ولكن فشل تسجيل الدخول: {str(login_error)}")
                    else:
                        raise
            else:
                # خطأ آخر، ارفعه كما هو
                raise
        
        # حفظ في Django
        chat_user, created = ChatUser.objects.get_or_create(
            username=username,
            defaults={
                'password': password,  # حفظ كلمة المرور
                'matrix_user_id': matrix_response.get('user_id'),
                'access_token': matrix_response.get('access_token'),
                'device_id': matrix_response.get('device_id'),
                'token_expires_at': timezone.now() + timedelta(days=90)  # 90 يوم
            }
        )
        
        if not created:
            # تحديث البيانات
            chat_user.password = password  # تحديث كلمة المرور
            chat_user.matrix_user_id = matrix_response.get('user_id')
            chat_user.access_token = matrix_response.get('access_token')
            chat_user.device_id = matrix_response.get('device_id')
            chat_user.token_expires_at = timezone.now() + timedelta(days=90)
            chat_user.save()
        
        return JsonResponse({
            'success': True,
            'user_id': matrix_response.get('user_id'),
            'access_token': matrix_response.get('access_token'),
            'device_id': matrix_response.get('device_id')
        }, json_dumps_params={'ensure_ascii': False})
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"خطأ في تسجيل مستخدم Matrix: {error_msg}")
        
        # معالجة Rate Limiting
        is_rate_limit = (
            'كثرة الطلبات' in error_msg or 
            'M_LIMIT_EXCEEDED' in error_msg or 
            'Too Many Requests' in error_msg or
            hasattr(e, 'is_rate_limit') and e.is_rate_limit
        )
        if is_rate_limit:
            # استخراج الوقت المتبقي من الرسالة إن وجد
            retry_after_match = None
            if 'بعد' in error_msg:
                import re
                retry_match = re.search(r'بعد (\d+) ثانية', error_msg)
                if retry_match:
                    retry_after_match = int(retry_match.group(1))
            
            error_message = "تم تطبيق Rate Limiting من سيرفر Matrix. هذا يحدث عندما تكون هناك محاولات كثيرة جداً في وقت قصير."
            if retry_after_match:
                error_message += f" يرجى الانتظار {retry_after_match} ثانية قبل المحاولة مرة أخرى."
            else:
                error_message += " يرجى الانتظار بضع دقائق قبل المحاولة مرة أخرى."
            error_message += " (يمكنك تعديل إعدادات Rate Limiting في Synapse لتقليل هذه المشكلة - راجع ملف MATRIX_RATE_LIMIT_FIX.md)"
            
            return JsonResponse({
                'success': False,
                'error': error_message,
                'rate_limited': True,
                'retry_after': retry_after_match
            }, status=429, json_dumps_params={'ensure_ascii': False})
        
        return JsonResponse({
            'success': False,
            'error': error_msg
        }, status=500, json_dumps_params={'ensure_ascii': False})


@require_http_methods(["POST"])
@csrf_exempt
def matrix_login(request):
    """
    تسجيل الدخول في Matrix
    POST /api/matrix/login
    Body: {
        "username": "user123",
        "password": "secure_password"
    }
    """
    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        
        if not username or not password:
            return JsonResponse({
                'success': False,
                'error': 'اسم المستخدم وكلمة المرور مطلوبان'
            }, status=400, json_dumps_params={'ensure_ascii': False})
        
        # تنظيف اسم المستخدم (نفس المنطق في التسجيل)
        import re
        username_clean = re.sub(r'[^a-zA-Z0-9._=-]', '', username)
        username_clean = username_clean.strip('._-')
        
        if not username_clean:
            return JsonResponse({
                'success': False,
                'error': 'اسم المستخدم غير صحيح'
            }, status=400, json_dumps_params={'ensure_ascii': False})
        
        username = username_clean
        
        # التحقق من وجود مستخدم مع access_token صالح في قاعدة البيانات
        try:
            chat_user = ChatUser.objects.get(username=username)
            # التحقق من أن access_token موجود وصالح
            if chat_user.access_token and chat_user.matrix_user_id:
                # التحقق من انتهاء الصلاحية
                if chat_user.token_expires_at and chat_user.token_expires_at > timezone.now():
                    logger.info(f"استخدام access_token موجود للمستخدم: {username}")
                    return JsonResponse({
                        'success': True,
                        'user_id': chat_user.matrix_user_id,
                        'access_token': chat_user.access_token,
                        'device_id': chat_user.device_id,
                        'from_cache': True
                    }, json_dumps_params={'ensure_ascii': False})
                else:
                    logger.info(f"access_token منتهي الصلاحية للمستخدم: {username}")
        except ChatUser.DoesNotExist:
            pass
        
        site_settings = SiteSettings.load()
        if not site_settings.matrix_homeserver_url:
            return JsonResponse({
                'success': False,
                'error': 'سيرفر Matrix غير مُعد'
            }, status=500, json_dumps_params={'ensure_ascii': False})
        
        matrix_service = MatrixService(site_settings.matrix_homeserver_url)
        
        try:
            matrix_response = matrix_service.login(username, password)
        except Exception as login_error:
            # معالجة أخطاء تسجيل الدخول بشكل واضح
            error_msg = str(login_error)
            
            # معالجة Rate Limiting
            if 'M_LIMIT_EXCEEDED' in error_msg or 'كثرة الطلبات' in error_msg or 'Too Many Requests' in error_msg:
                logger.warning(f"Rate Limiting في تسجيل الدخول: {error_msg}")
                # استخراج الوقت المتبقي من الرسالة إن وجد
                retry_after_match = None
                if 'بعد' in error_msg:
                    import re
                    retry_match = re.search(r'بعد (\d+) ثانية', error_msg)
                    if retry_match:
                        retry_after_match = int(retry_match.group(1))
                
                error_message = "تم تطبيق Rate Limiting من سيرفر Matrix. هذا يحدث عندما تكون هناك محاولات كثيرة جداً في وقت قصير."
                if retry_after_match:
                    error_message += f" يرجى الانتظار {retry_after_match} ثانية قبل المحاولة مرة أخرى."
                else:
                    error_message += " يرجى الانتظار بضع دقائق قبل المحاولة مرة أخرى."
                error_message += " (يمكنك تعديل إعدادات Rate Limiting في Synapse لتقليل هذه المشكلة)"
                
                return JsonResponse({
                    'success': False,
                    'error': error_message,
                    'rate_limited': True,
                    'retry_after': retry_after_match
                }, status=429, json_dumps_params={'ensure_ascii': False})
            
            # إذا كان المستخدم غير موجود أو كلمة المرور خاطئة
            if 'M_FORBIDDEN' in error_msg or 'Invalid username or password' in error_msg:
                logger.info(f"فشل تسجيل الدخول (مستخدم غير موجود أو كلمة مرور خاطئة): {username}")
                return JsonResponse({
                    'success': False,
                    'error': 'اسم المستخدم أو كلمة المرور غير صحيحة'
                }, status=401, json_dumps_params={'ensure_ascii': False})
            
            # خطأ آخر
            logger.error(f"خطأ في تسجيل الدخول إلى Matrix: {error_msg}")
            return JsonResponse({
                'success': False,
                'error': error_msg
            }, status=500, json_dumps_params={'ensure_ascii': False})
        
        # تحديث ChatUser
        try:
            chat_user = ChatUser.objects.get(username=username)
            chat_user.password = password  # تحديث كلمة المرور
            chat_user.access_token = matrix_response.get('access_token')
            chat_user.device_id = matrix_response.get('device_id')
            chat_user.matrix_user_id = matrix_response.get('user_id')
            chat_user.is_online = True
            chat_user.token_expires_at = timezone.now() + timedelta(days=90)
            chat_user.save()
        except ChatUser.DoesNotExist:
            chat_user = ChatUser.objects.create(
                username=username,
                password=password,  # حفظ كلمة المرور
                matrix_user_id=matrix_response.get('user_id'),
                access_token=matrix_response.get('access_token'),
                device_id=matrix_response.get('device_id'),
                is_online=True,
                token_expires_at=timezone.now() + timedelta(days=90)
            )
        
        return JsonResponse({
            'success': True,
            'user_id': matrix_response.get('user_id'),
            'access_token': matrix_response.get('access_token'),
            'device_id': matrix_response.get('device_id')
        }, json_dumps_params={'ensure_ascii': False})
        
    except Exception as e:
        logger.error(f"خطأ غير متوقع في تسجيل الدخول إلى Matrix: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500, json_dumps_params={'ensure_ascii': False})


@require_http_methods(["POST"])
@csrf_exempt
def create_channel_room(request, channel_id):
    """
    إنشاء غرفة Matrix للقناة
    POST /api/matrix/rooms/<channel_id>/create
    """
    try:
        channel = LiveChannel.objects.get(id=channel_id)
        
        # التحقق من وجود غرفة سابقة
        if hasattr(channel, 'chat_room') and channel.chat_room.matrix_room_id:
            return JsonResponse({
                'success': False,
                'error': 'الغرفة موجودة بالفعل',
                'room_id': channel.chat_room.matrix_room_id,
                'room_alias': channel.chat_room.matrix_room_alias
            }, status=400, json_dumps_params={'ensure_ascii': False})
        
        site_settings = SiteSettings.load()
        if not site_settings.matrix_homeserver_url:
            return JsonResponse({
                'success': False,
                'error': 'سيرفر Matrix غير مُعد'
            }, status=500, json_dumps_params={'ensure_ascii': False})
        
        matrix_service = MatrixService(site_settings.matrix_homeserver_url)
        
        # استخدام مستخدم الإدارة لإنشاء الغرفة
        admin_token = None
        if site_settings.matrix_admin_user and site_settings.matrix_admin_password:
            try:
                admin_token = get_admin_token(
                    matrix_service,
                    site_settings.matrix_admin_user,
                    site_settings.matrix_admin_password
                )
            except Exception as e:
                logger.warning(f"فشل تسجيل دخول الإدارة، سيتم إنشاء غرفة عامة: {str(e)}")
        
        # إنشاء أو الحصول على Space الرئيسي
        space_id = site_settings.matrix_space_id
        if not space_id and admin_token:
            try:
                logger.info("إنشاء Space رئيسي جديد...")
                space_response = matrix_service.create_space(
                    name="MATCH Chat Rooms",
                    alias="match_chat_rooms",
                    topic="مجموعة غرف الدردشة لشبكة MATCH",
                    access_token=admin_token
                )
                space_id = space_response.get('room_id')
                site_settings.matrix_space_id = space_id
                site_settings.save()
                logger.info(f"تم إنشاء Space رئيسي: {space_id}")
            except Exception as space_error:
                logger.warning(f"فشل في إنشاء Space (سيتم إنشاء الغرفة بدون Space): {space_error}")
        
        # إنشاء الغرفة
        room_name = channel.name
        room_alias = f"{site_settings.matrix_room_prefix}{channel_id}"
        
        room_response = matrix_service.create_room(
            name=room_name,
            alias=room_alias,
            topic=channel.description or f"غرفة دردشة {channel.name}",
            is_public=True,
            access_token=admin_token,
            space_id=space_id  # إضافة الغرفة إلى Space
        )
        
        # إنشاء أو تحديث ChatRoom
        chat_room, created = ChatRoom.objects.get_or_create(
            channel=channel,
            defaults={
                'name': room_name,
                'description': channel.description,
                'matrix_room_id': room_response.get('room_id'),
                'matrix_room_alias': room_response.get('room_alias')
            }
        )
        
        if not created:
            chat_room.matrix_room_id = room_response.get('room_id')
            chat_room.matrix_room_alias = room_response.get('room_alias')
            chat_room.name = room_name
            if channel.description:
                chat_room.description = channel.description
            chat_room.save()
        
        return JsonResponse({
            'success': True,
            'room_id': room_response.get('room_id'),
            'room_alias': room_response.get('room_alias')
        }, json_dumps_params={'ensure_ascii': False})
        
    except LiveChannel.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'القناة غير موجودة'
        }, status=404, json_dumps_params={'ensure_ascii': False})
    except Exception as e:
        logger.error(f"خطأ في إنشاء غرفة Matrix: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500, json_dumps_params={'ensure_ascii': False})


@require_http_methods(["GET"])
def get_channel_room_info(request, channel_id):
    """
    الحصول على معلومات غرفة Matrix للقناة
    GET /api/matrix/rooms/<channel_id>/info
    """
    try:
        channel = LiveChannel.objects.get(id=channel_id)
        
        if not hasattr(channel, 'chat_room') or not channel.chat_room.matrix_room_id:
            return JsonResponse({
                'success': False,
                'error': 'الغرفة غير موجودة. يرجى إنشاء الغرفة أولاً',
                'room_id': None
            }, status=404, json_dumps_params={'ensure_ascii': False})
        
        chat_room = channel.chat_room
        
        return JsonResponse({
            'success': True,
            'room_id': chat_room.matrix_room_id,
            'room_alias': chat_room.matrix_room_alias,
            'name': chat_room.name,
            'description': chat_room.description
        }, json_dumps_params={'ensure_ascii': False})
        
    except LiveChannel.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'القناة غير موجودة'
        }, status=404, json_dumps_params={'ensure_ascii': False})
    except Exception as e:
        logger.error(f"خطأ في الحصول على معلومات الغرفة: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500, json_dumps_params={'ensure_ascii': False})


@require_http_methods(["GET"])
def matrix_config(request):
    """
    الحصول على إعدادات Matrix للعميل
    GET /api/matrix/config
    """
    try:
        site_settings = SiteSettings.load()
        
        if not site_settings.matrix_homeserver_url:
            return JsonResponse({
                'success': False,
                'error': 'سيرفر Matrix غير مُعد'
            }, status=500, json_dumps_params={'ensure_ascii': False})
        
        # بناء عنوان proxy بناءً على عنوان الطلب الحالي
        # المتصفح سيتصل بـ Django proxy بدلاً من Matrix مباشرة
        scheme = 'https' if request.is_secure() else 'http'
        host = request.get_host()  # سيكون 172.16.1.2:8000
        proxy_url = f"{scheme}://{host}/api/matrix-proxy"
        
        return JsonResponse({
            'success': True,
            'homeserver_url': proxy_url,  # استخدام proxy بدلاً من Matrix مباشرة
            'room_prefix': site_settings.matrix_room_prefix
        }, json_dumps_params={'ensure_ascii': False})
        
    except Exception as e:
        logger.error(f"خطأ في الحصول على إعدادات Matrix: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500, json_dumps_params={'ensure_ascii': False})


@require_http_methods(["GET"])
def matrix_test_connection(request):
    """
    اختبار الاتصال بسيرفر Matrix والتحقق من الإعدادات
    GET /api/matrix/test-connection
    """
    try:
        site_settings = SiteSettings.load()
        
        if not site_settings.matrix_homeserver_url:
            return JsonResponse({
                'success': False,
                'error': 'سيرفر Matrix غير مُعد. يرجى إعداد عنوان سيرفر Matrix في إعدادات الموقع'
            }, status=500, json_dumps_params={'ensure_ascii': False})
        
        matrix_service = MatrixService(site_settings.matrix_homeserver_url)
        
        # اختبار الاتصال الأساسي
        connection_test = matrix_service.test_connection()
        
        result = {
            'connection': connection_test,
            'admin_configured': bool(site_settings.matrix_admin_user and site_settings.matrix_admin_password),
            'homeserver_url': site_settings.matrix_homeserver_url
        }
        
        # إذا كان الاتصال ناجحاً وهناك بيانات إدارة، اختبر تسجيل الدخول
        if connection_test.get('success') and site_settings.matrix_admin_user and site_settings.matrix_admin_password:
            admin_test = matrix_service.test_admin_login(
                site_settings.matrix_admin_user,
                site_settings.matrix_admin_password
            )
            result['admin_login'] = admin_test
        
        # تحديد الحالة العامة
        if not connection_test.get('success'):
            result['success'] = False
            result['error'] = connection_test.get('error', 'فشل الاتصال')
        elif result.get('admin_login') and not result['admin_login'].get('success'):
            # إذا كان الاتصال ناجحاً لكن تسجيل الدخول فشل
            admin_error = result['admin_login'].get('error', '')
            if 'كثرة الطلبات' in admin_error or 'M_LIMIT_EXCEEDED' in admin_error:
                result['success'] = False
                result['error'] = admin_error
                result['warning'] = 'الاتصال ناجح لكن هناك Rate Limiting. يرجى الانتظار قليلاً.'
            else:
                result['success'] = False
                result['error'] = admin_error
        else:
            result['success'] = True
        
        status_code = 200 if result.get('success') else 500
        return JsonResponse(result, status=status_code, json_dumps_params={'ensure_ascii': False})
        
    except Exception as e:
        logger.error(f"خطأ في اختبار الاتصال: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500, json_dumps_params={'ensure_ascii': False})

