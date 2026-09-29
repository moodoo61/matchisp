"""
Cache بسيط لـ Admin Token لتجنب كثرة الطلبات
"""
from datetime import datetime, timedelta
import threading
import time
import logging

logger = logging.getLogger(__name__)

# Cache بسيط في الذاكرة
_admin_token_cache = {
    'token': None,
    'expires_at': None,
    'last_attempt': None,
    'lock': threading.Lock()
}

# مدة صلاحية Token (ساعة واحدة)
TOKEN_CACHE_DURATION = timedelta(hours=1)
# الحد الأدنى بين المحاولات (10 دقائق لتجنب Rate Limiting)
MIN_RETRY_INTERVAL = timedelta(minutes=10)


def get_admin_token(matrix_service, admin_user, admin_password, force_refresh=False):
    """
    الحصول على Admin Token مع استخدام Cache
    
    Args:
        matrix_service: MatrixService instance
        admin_user: اسم مستخدم الإدارة
        admin_password: كلمة مرور الإدارة
        force_refresh: إجبار تحديث Token (افتراضي: False)
    
    Returns:
        Admin access token أو None
    """
    global _admin_token_cache
    
    with _admin_token_cache['lock']:
        now = datetime.now()
        
        # التحقق من وجود Token صالح في Cache
        if not force_refresh and _admin_token_cache['token'] and _admin_token_cache['expires_at']:
            if now < _admin_token_cache['expires_at']:
                return _admin_token_cache['token']
        
        # التحقق من الحد الأدنى بين المحاولات (لتجنب Rate Limiting)
        if _admin_token_cache['last_attempt']:
            time_since_last = now - _admin_token_cache['last_attempt']
            if time_since_last < MIN_RETRY_INTERVAL:
                # استخدم Token القديم إن وجد (حتى لو انتهت صلاحيته)
                if _admin_token_cache['token']:
                    logger.info(f"استخدام Token القديم لتجنب Rate Limiting. الوقت المتبقي: {int((MIN_RETRY_INTERVAL - time_since_last).total_seconds())} ثانية")
                    return _admin_token_cache['token']
                # إذا لم يكن هناك Token، ارفع خطأ
                remaining_seconds = int((MIN_RETRY_INTERVAL - time_since_last).total_seconds())
                raise Exception(f"كثرة الطلبات. يرجى الانتظار {remaining_seconds} ثانية قبل المحاولة مرة أخرى. (لتجنب Rate Limiting من Synapse)")
        
        # تحديث وقت المحاولة
        _admin_token_cache['last_attempt'] = now
        
        # الحصول على Token جديد
        try:
            # اختبار الاتصال أولاً لتجنب Rate Limiting غير الضروري
            connection_test = matrix_service.test_connection()
            if not connection_test.get('success'):
                # إذا فشل الاتصال، استخدم Token القديم إن وجد
                if _admin_token_cache['token']:
                    logger.warning(f"فشل الاتصال، استخدام Token القديم: {connection_test.get('error')}")
                    return _admin_token_cache['token']
                raise Exception(connection_test.get('error', 'فشل الاتصال بسيرفر Matrix'))
            
            login_response = matrix_service.login(admin_user, admin_password)
            token = login_response.get('access_token')
            
            if token:
                _admin_token_cache['token'] = token
                _admin_token_cache['expires_at'] = now + TOKEN_CACHE_DURATION
                logger.info("تم الحصول على Admin Token جديد")
                return token
        except Exception as e:
            error_msg = str(e)
            # في حالة Too Many Requests، استخدم Token القديم إن وجد
            if 'Too Many Requests' in error_msg or 'M_LIMIT_EXCEEDED' in error_msg or 'كثرة الطلبات' in error_msg:
                if _admin_token_cache['token']:
                    logger.warning(f"Rate Limiting، استخدام Token القديم: {error_msg}")
                    return _admin_token_cache['token']
                # إذا لم يكن هناك Token، ارفع الخطأ مع رسالة واضحة
                raise Exception(f"كثرة الطلبات. يرجى الانتظار قبل المحاولة مرة أخرى. {error_msg}")
            raise
    
    return None


def clear_admin_token_cache():
    """مسح Cache"""
    global _admin_token_cache
    with _admin_token_cache['lock']:
        _admin_token_cache['token'] = None
        _admin_token_cache['expires_at'] = None

