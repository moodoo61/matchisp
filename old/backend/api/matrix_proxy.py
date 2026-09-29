"""
Matrix Proxy - إعادة توجيه طلبات Matrix من الواجهة الأمامية إلى Matrix server المحلي
"""
from django.http import HttpResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import requests
import logging

from .models import SiteSettings

logger = logging.getLogger(__name__)


@csrf_exempt
def matrix_proxy(request, path=''):
    """
    Proxy لجميع طلبات Matrix
    يقوم بإعادة توجيه الطلبات من المتصفح إلى Matrix server المحلي
    """
    try:
        # الحصول على عنوان Matrix المحلي
        site_settings = SiteSettings.load()
        matrix_url = site_settings.matrix_homeserver_url or 'http://localhost:8008'
        
        # استخدام localhost دائماً للاتصال المحلي
        if '172.16.1.2' in matrix_url or '0.0.0.0' in matrix_url:
            matrix_url = 'http://localhost:8008'
        
        # بناء URL الكامل
        full_path = request.get_full_path()
        # إزالة /api/matrix-proxy/ من المسار
        matrix_path = full_path.replace('/api/matrix-proxy/', '/')
        target_url = f"{matrix_url}{matrix_path}"
        
        # إعداد Headers
        headers = {}
        for key, value in request.headers.items():
            # تجاهل بعض headers
            if key.lower() not in ['host', 'connection', 'content-length']:
                headers[key] = value
        
        # إعداد البيانات
        data = None
        if request.method in ['POST', 'PUT', 'PATCH']:
            data = request.body
        
        # إعداد معاملات الاستعلام
        params = dict(request.GET)
        
        logger.debug(f"Matrix Proxy: {request.method} {target_url}")
        
        # إرسال الطلب إلى Matrix
        try:
            response = requests.request(
                method=request.method,
                url=target_url,
                headers=headers,
                data=data,
                params=params,
                timeout=60,
                stream=True  # للدعم long-polling
            )
            
            # إذا كان طلب sync (long-polling)، استخدم StreamingHttpResponse
            if '_matrix/client' in matrix_path and 'sync' in matrix_path:
                def generate():
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            yield chunk
                
                django_response = StreamingHttpResponse(
                    generate(),
                    status=response.status_code,
                    content_type=response.headers.get('Content-Type', 'application/json')
                )
            else:
                # طلب عادي
                django_response = HttpResponse(
                    response.content,
                    status=response.status_code,
                    content_type=response.headers.get('Content-Type', 'application/json')
                )
            
            # نسخ headers من الاستجابة
            for key, value in response.headers.items():
                if key.lower() not in ['content-encoding', 'content-length', 'transfer-encoding', 'connection']:
                    django_response[key] = value
            
            # إضافة CORS headers
            django_response['Access-Control-Allow-Origin'] = '*'
            django_response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            django_response['Access-Control-Allow-Headers'] = '*'
            
            return django_response
            
        except requests.exceptions.Timeout:
            logger.error(f"Timeout connecting to Matrix: {target_url}")
            return HttpResponse(
                '{"errcode": "M_UNKNOWN", "error": "Request timeout"}',
                status=504,
                content_type='application/json'
            )
        except requests.exceptions.ConnectionError as e:
            logger.error(f"Connection error to Matrix: {target_url} - {str(e)}")
            return HttpResponse(
                '{"errcode": "M_UNKNOWN", "error": "Cannot connect to Matrix server"}',
                status=502,
                content_type='application/json'
            )
            
    except Exception as e:
        logger.error(f"Matrix Proxy error: {str(e)}")
        import traceback
        traceback.print_exc()
        return HttpResponse(
            f'{{"errcode": "M_UNKNOWN", "error": "{str(e)}"}}',
            status=500,
            content_type='application/json'
        )


@csrf_exempt
@require_http_methods(["OPTIONS"])
def matrix_proxy_options(request, path=''):
    """معالجة طلبات OPTIONS للـ CORS"""
    response = HttpResponse()
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response['Access-Control-Allow-Headers'] = '*'
    response['Access-Control-Max-Age'] = '86400'
    return response

