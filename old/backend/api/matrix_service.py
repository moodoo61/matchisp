"""
خدمة للتفاعل مع سيرفر Matrix/Synapse
"""
import requests
import json
from typing import Optional, Dict
import logging

logger = logging.getLogger(__name__)


class MatrixService:
    """
    خدمة للتفاعل مع سيرفر Matrix/Synapse
    """
    
    def __init__(self, homeserver_url: str):
        """
        تهيئة خدمة Matrix
        
        Args:
            homeserver_url: عنوان سيرفر Matrix (مثال: http://172.16.1.2:8008)
        """
        self.homeserver_url = homeserver_url.rstrip('/')
        # إزالة المسار إذا كان موجوداً (مثل /_matrix)
        if '/_matrix' in self.homeserver_url:
            self.homeserver_url = self.homeserver_url.split('/_matrix')[0]
        self.api_base = f"{self.homeserver_url}/_matrix/client/v3"
    
    def test_connection(self) -> Dict:
        """
        اختبار الاتصال بسيرفر Matrix
        
        Returns:
            {
                'success': True/False,
                'message': 'رسالة الحالة',
                'versions': [قائمة الإصدارات المدعومة],
                'error': 'رسالة الخطأ إن وجدت'
            }
        """
        try:
            # اختبار endpoint الإصدارات (لا يتطلب مصادقة)
            versions_url = f"{self.homeserver_url}/_matrix/client/versions"
            response = requests.get(versions_url, timeout=5)
            response.raise_for_status()
            
            versions_data = response.json()
            versions = versions_data.get('versions', [])
            
            logger.info(f"الاتصال بسيرفر Matrix ناجح. الإصدارات المدعومة: {versions}")
            return {
                'success': True,
                'message': 'الاتصال ناجح',
                'versions': versions,
                'homeserver_url': self.homeserver_url
            }
        except requests.exceptions.ConnectionError:
            error_msg = f"فشل الاتصال بسيرفر Matrix: {self.homeserver_url}"
            logger.error(error_msg)
            return {
                'success': False,
                'message': 'فشل الاتصال',
                'error': f'لا يمكن الوصول إلى سيرفر Matrix. تأكد من أن Synapse يعمل وأن العنوان صحيح: {self.homeserver_url}'
            }
        except requests.exceptions.Timeout:
            error_msg = f"انتهت مهلة الاتصال بسيرفر Matrix: {self.homeserver_url}"
            logger.error(error_msg)
            return {
                'success': False,
                'message': 'انتهت مهلة الاتصال',
                'error': 'انتهت مهلة الاتصال. تأكد من أن Synapse يعمل وأن العنوان صحيح'
            }
        except Exception as e:
            error_msg = f"خطأ في اختبار الاتصال: {str(e)}"
            logger.error(error_msg)
            return {
                'success': False,
                'message': 'خطأ في الاتصال',
                'error': str(e)
            }
    
    def test_admin_login(self, admin_user: str, admin_password: str) -> Dict:
        """
        اختبار تسجيل الدخول بمستخدم الإدارة
        
        Args:
            admin_user: اسم مستخدم الإدارة
            admin_password: كلمة مرور الإدارة
        
        Returns:
            {
                'success': True/False,
                'message': 'رسالة الحالة',
                'user_id': 'معرف المستخدم إن نجح',
                'error': 'رسالة الخطأ إن وجدت'
            }
        """
        try:
            login_response = self.login(admin_user, admin_password)
            logger.info(f"تسجيل الدخول بمستخدم الإدارة ناجح: {admin_user}")
            return {
                'success': True,
                'message': 'تسجيل الدخول ناجح',
                'user_id': login_response.get('user_id')
            }
        except Exception as e:
            error_msg = str(e)
            logger.error(f"فشل تسجيل الدخول بمستخدم الإدارة: {error_msg}")
            
            # معالجة Rate Limiting
            if 'M_LIMIT_EXCEEDED' in error_msg or 'كثرة الطلبات' in error_msg:
                return {
                    'success': False,
                    'message': 'كثرة الطلبات',
                    'error': error_msg
                }
            
            # معالجة بيانات خاطئة
            if 'M_FORBIDDEN' in error_msg or 'Invalid username or password' in error_msg:
                return {
                    'success': False,
                    'message': 'بيانات غير صحيحة',
                    'error': 'اسم المستخدم أو كلمة المرور غير صحيحة'
                }
            
            return {
                'success': False,
                'message': 'فشل تسجيل الدخول',
                'error': error_msg
            }
    
    def register_user(self, username: str, password: str, 
                     display_name: Optional[str] = None,
                     admin_access_token: Optional[str] = None) -> Dict:
        """
        إنشاء مستخدم جديد في Matrix
        
        Args:
            username: اسم المستخدم
            password: كلمة المرور
            display_name: الاسم المعروض (اختياري)
            admin_access_token: Access Token للإدارة (لإنشاء المستخدم عند تعطيل التسجيل)
        
        Returns:
            {
                'user_id': '@username:domain.com',
                'access_token': 'token...',
                'device_id': 'device_id...'
            }
        
        Raises:
            requests.RequestException: في حالة فشل الطلب
        """
        # إذا كان لدينا admin token، استخدم Admin API مباشرة
        if admin_access_token:
            logger.info(f"استخدام Admin API لإنشاء المستخدم: {username}")
            return self._register_user_via_admin(username, password, display_name, admin_access_token)
        
        # محاولة التسجيل العادي بدون مصادقة
        url = f"{self.api_base}/register"
        
        data = {
            'username': username,
            'password': password,
            'auth': {
                'type': 'm.login.dummy'
            }
        }
        
        if display_name:
            data['initial_device_display_name'] = display_name
        
        try:
            response = requests.post(url, json=data, timeout=10)
            response.raise_for_status()
            result = response.json()
            
            logger.info(f"تم إنشاء مستخدم Matrix: {username}")
            return {
                'user_id': result.get('user_id'),
                'access_token': result.get('access_token'),
                'device_id': result.get('device_id')
            }
        except requests.exceptions.HTTPError as e:
            error_data = {}
            try:
                error_data = e.response.json()
            except:
                error_data = {'errcode': 'UNKNOWN', 'error': str(e)}
            
            # إذا كان التسجيل معطل، ارفع الخطأ
            if error_data.get('errcode') == 'M_FORBIDDEN' and 'Registration' in error_data.get('error', ''):
                raise Exception("التسجيل معطل في Synapse. يرجى استخدام مستخدم إدارة لإنشاء المستخدمين.")
            
            logger.error(f"فشل في إنشاء مستخدم Matrix: {error_data}")
            raise Exception(f"فشل في إنشاء المستخدم: {error_data.get('error', str(e))}")
    
    def _register_user_via_admin(self, username: str, password: str,
                                 display_name: Optional[str] = None,
                                 admin_access_token: str = None) -> Dict:
        """
        إنشاء مستخدم جديد باستخدام Admin API (عند تعطيل التسجيل العادي)
        """
        from urllib.parse import urlparse
        
        # الحصول على domain من homeserver_url
        parsed = urlparse(self.homeserver_url)
        domain = parsed.netloc.split(':')[0] if ':' in parsed.netloc else parsed.netloc
        
        # استخدام Admin API لإنشاء المستخدم
        # يجب استخدام user_id الكامل: @username:domain
        user_id = f"@{username}:{domain}"
        url = f"{self.homeserver_url}/_synapse/admin/v2/users/{user_id}"
        
        headers = {
            'Authorization': f'Bearer {admin_access_token}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'password': password,
            'displayname': display_name or username,
            'admin': False
        }
        
        try:
            response = requests.put(url, json=data, headers=headers, timeout=10)
            
            # إذا كان المستخدم موجوداً بالفعل (409)، جرب تسجيل الدخول
            if response.status_code == 409:
                logger.info(f"المستخدم موجود بالفعل، محاولة تسجيل الدخول: {username}")
                return self.login(username, password)
            
            response.raise_for_status()
            
            # بعد إنشاء المستخدم، نحتاج لتسجيل الدخول للحصول على access_token
            login_response = self.login(username, password)
            
            logger.info(f"تم إنشاء مستخدم Matrix عبر Admin API: {username}")
            return login_response
            
        except requests.exceptions.HTTPError as e:
            error_data = {}
            try:
                error_data = e.response.json()
            except:
                error_data = {'errcode': 'UNKNOWN', 'error': str(e)}
            
            # إذا كان المستخدم موجوداً، جرب تسجيل الدخول
            if hasattr(e, 'response') and e.response.status_code == 409:
                try:
                    logger.info(f"المستخدم موجود، محاولة تسجيل الدخول: {username}")
                    return self.login(username, password)
                except:
                    pass
            
            logger.error(f"فشل في إنشاء مستخدم عبر Admin API: {error_data}")
            raise Exception(f"فشل في إنشاء المستخدم: {error_data.get('error', str(e))}")
    
    def login(self, username: str, password: str, 
             device_name: Optional[str] = None) -> Dict:
        """
        تسجيل الدخول والحصول على Access Token
        
        Args:
            username: اسم المستخدم (أو user_id الكامل)
            password: كلمة المرور
            device_name: اسم الجهاز (اختياري)
        
        Returns:
            {
                'user_id': '@username:domain.com',
                'access_token': 'token...',
                'device_id': 'device_id...'
            }
        
        Raises:
            requests.RequestException: في حالة فشل الطلب
        """
        url = f"{self.api_base}/login"
        
        # تحديد نوع المعرف
        identifier = {
            'type': 'm.id.user',
            'user': username
        }
        
        data = {
            'type': 'm.login.password',
            'identifier': identifier,
            'password': password
        }
        
        if device_name:
            data['initial_device_display_name'] = device_name
        
        try:
            response = requests.post(url, json=data, timeout=10)
            response.raise_for_status()
            result = response.json()
            
            logger.info(f"تم تسجيل الدخول: {username}")
            return {
                'user_id': result.get('user_id'),
                'access_token': result.get('access_token'),
                'device_id': result.get('device_id')
            }
        except requests.exceptions.HTTPError as e:
            error_data = {}
            try:
                error_data = e.response.json()
            except:
                error_data = {'errcode': 'UNKNOWN', 'error': str(e)}
            
            # معالجة حالة Too Many Requests
            if error_data.get('errcode') == 'M_LIMIT_EXCEEDED':
                retry_after = error_data.get('retry_after_ms', 60000) / 1000  # تحويل إلى ثواني
                error_msg = f"كثرة الطلبات. يرجى المحاولة مرة أخرى بعد {int(retry_after)} ثانية"
                logger.warning(f"Too Many Requests: {error_msg}")
                raise Exception(error_msg)
            
            # معالجة حالة Invalid username or password
            if error_data.get('errcode') == 'M_FORBIDDEN':
                error_msg = error_data.get('error', 'Invalid username or password')
                logger.warning(f"فشل في تسجيل الدخول: {error_msg}")
                raise Exception(f"فشل في تسجيل الدخول: {error_msg}")
            
            logger.error(f"فشل في تسجيل الدخول: {error_data}")
            raise Exception(f"فشل في تسجيل الدخول: {error_data.get('error', str(e))}")
    
    def create_space(self, name: str, alias: Optional[str] = None,
                     topic: Optional[str] = None,
                     access_token: Optional[str] = None) -> Dict:
        """
        إنشاء Space (مجموعة) جديدة في Matrix
        
        Args:
            name: اسم الـ Space
            alias: الاسم المستعار (اختياري، بدون #)
            topic: وصف الـ Space (اختياري)
            access_token: Access Token للمصادقة
        
        Returns:
            {
                'room_id': '!space_id:domain.com',
                'room_alias': '#alias:domain.com' (إن وجد)
            }
        
        Raises:
            requests.RequestException: في حالة فشل الطلب
        """
        url = f"{self.api_base}/createRoom"
        
        headers = {}
        if access_token:
            headers['Authorization'] = f'Bearer {access_token}'
        
        data = {
            'name': name,
            'preset': 'public_chat',
            'room_version': '10',
            'creation_content': {
                'type': 'm.space'
            }
        }
        
        if alias:
            alias = alias.lstrip('#')
            data['room_alias_name'] = alias
        
        if topic:
            data['topic'] = topic
        
        try:
            response = requests.post(url, json=data, headers=headers, timeout=10)
            response.raise_for_status()
            result = response.json()
            
            logger.info(f"تم إنشاء Space Matrix: {name}")
            return {
                'room_id': result.get('room_id'),
                'room_alias': result.get('room_alias')
            }
        except requests.exceptions.HTTPError as e:
            error_data = {}
            try:
                error_data = e.response.json()
            except:
                error_data = {'errcode': 'UNKNOWN', 'error': str(e)}
            
            logger.error(f"فشل في إنشاء Space: {error_data}")
            raise Exception(f"فشل في إنشاء Space: {error_data.get('error', str(e))}")
    
    def add_room_to_space(self, space_id: str, room_id: str, access_token: str) -> Dict:
        """
        إضافة غرفة إلى Space
        
        Args:
            space_id: معرف الـ Space
            room_id: معرف الغرفة المراد إضافتها
            access_token: Access Token للمصادقة
        
        Returns:
            معلومات الإضافة
        
        Raises:
            requests.RequestException: في حالة فشل الطلب
        """
        import uuid
        
        url = f"{self.api_base}/rooms/{space_id}/state/m.space.child/{room_id}"
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        # استخراج domain من homeserver_url
        from urllib.parse import urlparse
        parsed = urlparse(self.homeserver_url)
        domain = parsed.netloc.split(':')[0] if ':' in parsed.netloc else parsed.netloc
        
        data = {
            'via': [domain]
        }
        
        try:
            response = requests.put(url, json=data, headers=headers, timeout=10)
            response.raise_for_status()
            
            logger.info(f"تم إضافة الغرفة {room_id} إلى Space {space_id}")
            return response.json()
        except requests.exceptions.HTTPError as e:
            error_data = {}
            try:
                error_data = e.response.json()
            except:
                error_data = {'errcode': 'UNKNOWN', 'error': str(e)}
            
            logger.error(f"فشل في إضافة الغرفة إلى Space: {error_data}")
            raise Exception(f"فشل في إضافة الغرفة إلى Space: {error_data.get('error', str(e))}")
    
    def create_room(self, name: str, alias: Optional[str] = None,
                   topic: Optional[str] = None, 
                   is_public: bool = True,
                   access_token: Optional[str] = None,
                   space_id: Optional[str] = None) -> Dict:
        """
        إنشاء غرفة جديدة
        
        Args:
            name: اسم الغرفة
            alias: الاسم المستعار (اختياري، بدون #)
            topic: وصف الغرفة (اختياري)
            is_public: هل الغرفة عامة؟
            access_token: Access Token للمصادقة
        
        Returns:
            {
                'room_id': '!room_id:domain.com',
                'room_alias': '#alias:domain.com' (إن وجد)
            }
        
        Raises:
            requests.RequestException: في حالة فشل الطلب
        """
        url = f"{self.api_base}/createRoom"
        
        headers = {}
        if access_token:
            headers['Authorization'] = f'Bearer {access_token}'
        
        data = {
            'name': name,
            'preset': 'public_chat' if is_public else 'private_chat',
            'room_version': '10'
        }
        
        if alias:
            # إزالة # إذا كانت موجودة
            alias = alias.lstrip('#')
            data['room_alias_name'] = alias
        
        if topic:
            data['topic'] = topic
        
        try:
            response = requests.post(url, json=data, headers=headers, timeout=10)
            response.raise_for_status()
            result = response.json()
            
            room_id = result.get('room_id')
            room_alias = result.get('room_alias')
            
            # إذا تم تحديد Space، أضف الغرفة إليه
            if space_id and access_token:
                try:
                    self.add_room_to_space(space_id, room_id, access_token)
                    logger.info(f"تم إضافة الغرفة {room_id} إلى Space {space_id}")
                except Exception as space_error:
                    logger.warning(f"فشل في إضافة الغرفة إلى Space (سيتم تجاهل الخطأ): {space_error}")
            
            logger.info(f"تم إنشاء غرفة Matrix: {name}")
            return {
                'room_id': room_id,
                'room_alias': room_alias
            }
        except requests.exceptions.HTTPError as e:
            error_data = {}
            try:
                error_data = e.response.json()
            except:
                error_data = {'errcode': 'UNKNOWN', 'error': str(e)}
            
            logger.error(f"فشل في إنشاء الغرفة: {error_data}")
            raise Exception(f"فشل في إنشاء الغرفة: {error_data.get('error', str(e))}")
    
    def get_room_info(self, room_id: str, access_token: str) -> Dict:
        """
        الحصول على معلومات الغرفة
        
        Args:
            room_id: معرف الغرفة
            access_token: Access Token للمصادقة
        
        Returns:
            معلومات الغرفة
        
        Raises:
            requests.RequestException: في حالة فشل الطلب
        """
        url = f"{self.api_base}/rooms/{room_id}/state"
        
        headers = {
            'Authorization': f'Bearer {access_token}'
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            error_data = {}
            try:
                error_data = e.response.json()
            except:
                error_data = {'errcode': 'UNKNOWN', 'error': str(e)}
            
            logger.error(f"فشل في الحصول على معلومات الغرفة: {error_data}")
            raise Exception(f"فشل في الحصول على معلومات الغرفة: {error_data.get('error', str(e))}")
    
    def join_room(self, room_id_or_alias: str, access_token: str) -> Dict:
        """
        الانضمام لغرفة
        
        Args:
            room_id_or_alias: معرف الغرفة أو الاسم المستعار
            access_token: Access Token للمصادقة
        
        Returns:
            معلومات الانضمام
        
        Raises:
            requests.RequestException: في حالة فشل الطلب
        """
        from urllib.parse import quote
        
        # URL-encode room_id_or_alias لتجنب مشاكل مع # و :
        encoded_room = quote(room_id_or_alias, safe='')
        url = f"{self.api_base}/join/{encoded_room}"
        
        headers = {
            'Authorization': f'Bearer {access_token}'
        }
        
        try:
            response = requests.post(url, json={}, headers=headers, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            error_data = {}
            try:
                error_data = e.response.json()
            except:
                error_data = {'errcode': 'UNKNOWN', 'error': str(e)}
            
            logger.error(f"فشل في الانضمام للغرفة: {error_data}")
            raise Exception(f"فشل في الانضمام للغرفة: {error_data.get('error', str(e))}")
    
    def send_message(self, room_id: str, message: str, access_token: str) -> Dict:
        """
        إرسال رسالة للغرفة
        
        Args:
            room_id: معرف الغرفة
            message: نص الرسالة
            access_token: Access Token للمصادقة
        
        Returns:
            معلومات الرسالة المرسلة
        
        Raises:
            requests.RequestException: في حالة فشل الطلب
        """
        import uuid
        
        url = f"{self.api_base}/rooms/{room_id}/send/m.room.message/{uuid.uuid4()}"
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'msgtype': 'm.text',
            'body': message
        }
        
        try:
            response = requests.put(url, json=data, headers=headers, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            error_data = {}
            try:
                error_data = e.response.json()
            except:
                error_data = {'errcode': 'UNKNOWN', 'error': str(e)}
            
            logger.error(f"فشل في إرسال الرسالة: {error_data}")
            raise Exception(f"فشل في إرسال الرسالة: {error_data.get('error', str(e))}")

