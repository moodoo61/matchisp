from django.db import models
from django.core.validators import MinValueValidator


class Advertisement(models.Model):
    """نموذج الإعلانات"""
    name = models.CharField(max_length=200, verbose_name="اسم الإعلان", blank=True, null=True)
    image = models.ImageField(upload_to='advertisements/', verbose_name="صورة الإعلان")
    link = models.URLField(max_length=500, blank=True, null=True, verbose_name="رابط الإعلان")
    order = models.IntegerField(default=0, verbose_name="ترتيب الإعلان", 
                                help_text="الرقم الأقل يظهر أولاً")
    is_active = models.BooleanField(default=True, verbose_name="نشط")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")

    class Meta:
        app_label = 'login_page'
        db_table = 'api_advertisement'
        verbose_name = "إعلان"
        verbose_name_plural = "الإعلانات"
        ordering = ['order', 'created_at']

    def __str__(self):
        return self.name or f"إعلان #{self.id}"

    @property
    def url(self):
        """إرجاع رابط الصورة الكامل"""
        if self.image:
            return self.image.url
        return ""


class NewsTicker(models.Model):
    """نموذج الشريط المتحرك"""
    text = models.TextField(verbose_name="نص الخبر")
    order = models.IntegerField(default=0, verbose_name="ترتيب الخبر",
                                help_text="الرقم الأقل يظهر أولاً")
    is_active = models.BooleanField(default=True, verbose_name="نشط")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")

    class Meta:
        app_label = 'login_page'
        db_table = 'api_newsticker'
        verbose_name = "خبر الشريط"
        verbose_name_plural = "الشريط المتحرك"
        ordering = ['order', 'created_at']

    def __str__(self):
        return self.text[:50] + "..." if len(self.text) > 50 else self.text


class Package(models.Model):
    """نموذج الباقات"""
    name = models.CharField(max_length=200, verbose_name="اسم الباقة")
    price = models.DecimalField(max_digits=10, decimal_places=2, 
                                validators=[MinValueValidator(0)],
                                verbose_name="السعر")
    time = models.CharField(max_length=100, verbose_name="الوقت",
                           help_text="مثل: 30 يوم، 3 أشهر، إلخ")
    download = models.CharField(max_length=100, verbose_name="التحميل",
                               help_text="مثل: غير محدود، 100 GB، إلخ")
    validity = models.CharField(max_length=100, verbose_name="الصلاحية",
                               help_text="مثل: صالح لمدة 30 يوم")
    is_active = models.BooleanField(default=True, verbose_name="نشط")
    order = models.IntegerField(default=0, verbose_name="ترتيب الباقة")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")

    class Meta:
        app_label = 'login_page'
        db_table = 'api_package'
        verbose_name = "باقة"
        verbose_name_plural = "الباقات"
        ordering = ['order', 'created_at']

    def __str__(self):
        return self.name


class Agent(models.Model):
    """نموذج الوكلاء"""
    name = models.CharField(max_length=200, verbose_name="اسم الوكيل")
    address = models.TextField(verbose_name="العنوان")
    phone = models.CharField(max_length=50, verbose_name="رقم الهاتف")
    is_active = models.BooleanField(default=True, verbose_name="نشط")
    order = models.IntegerField(default=0, verbose_name="ترتيب الوكيل")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")

    class Meta:
        app_label = 'login_page'
        db_table = 'api_agent'
        verbose_name = "وكيل"
        verbose_name_plural = "الوكلاء"
        ordering = ['order', 'created_at']

    def __str__(self):
        return self.name


class SiteSettings(models.Model):
    """نموذج إعدادات الموقع - يجب أن يكون سجل واحد فقط"""
    network_name = models.CharField(max_length=200, default="شبكة MATCH LINK", 
                                    verbose_name="اسم الشبكة")
    logo = models.ImageField(upload_to='settings/', blank=True, null=True, 
                            verbose_name="شعار الموقع",
                            help_text="إذا لم يتم اختيار صورة، سيتم استخدام الشعار الافتراضي")
    admin_phone = models.CharField(max_length=50, default="779544414", 
                                   verbose_name="رقم الإدارة")
    repair_phone = models.CharField(max_length=50, default="779544414", 
                                    verbose_name="رقم الصيانة")
    enable_customer_login = models.BooleanField(default=False, 
                                                verbose_name="تفعيل لوحة دخول المشترك",
                                                help_text="عند التفعيل، سيظهر زر 'الدخول كمشترك' أسفل زر تسجيل الدخول")
    enable_chat = models.BooleanField(default=False,
                                     verbose_name="تفعيل خدمة الدردشة",
                                     help_text="عند التفعيل، سيظهر زر الدردشة في صفحة البث المباشر")
    matrix_homeserver_url = models.URLField(null=True, blank=True,
                                           verbose_name="عنوان سيرفر Matrix",
                                           help_text="عنوان سيرفر Matrix/Synapse (مثال: http://172.16.1.2:8008)")
    matrix_admin_user = models.CharField(max_length=200, null=True, blank=True,
                                        verbose_name="مستخدم إدارة Matrix",
                                        help_text="اسم مستخدم الإدارة في Matrix (لإنشاء الغرف)")
    matrix_admin_password = models.CharField(max_length=200, null=True, blank=True,
                                           verbose_name="كلمة مرور إدارة Matrix",
                                           help_text="كلمة مرور مستخدم الإدارة (يُنصح بتخزينها بشكل آمن)")
    matrix_room_prefix = models.CharField(max_length=50, default='match_channel_',
                                         verbose_name="بادئة أسماء الغرف",
                                         help_text="البادئة المستخدمة في أسماء غرف Matrix")
    matrix_space_id = models.CharField(max_length=255, null=True, blank=True,
                                      verbose_name="معرف Space الرئيسي",
                                      help_text="معرف Space (المجموعة) الرئيسي في Matrix الذي يحتوي على جميع الغرف")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")

    class Meta:
        app_label = 'general'
        db_table = 'api_sitesettings'
        verbose_name = "إعدادات الموقع"
        verbose_name_plural = "إعدادات الموقع"
        
    def __str__(self):
        return "إعدادات الموقع"
    
    def save(self, *args, **kwargs):
        # التأكد من وجود سجل واحد فقط
        self.pk = 1
        super(SiteSettings, self).save(*args, **kwargs)
    
    @classmethod
    def load(cls):
        """تحميل إعدادات الموقع أو إنشائها إذا لم تكن موجودة"""
        obj, created = cls.objects.get_or_create(pk=1)
        return obj
    
    @property
    def logo_url(self):
        """إرجاع رابط الشعار الكامل"""
        if self.logo:
            return self.logo.url
        return None


class Link(models.Model):
    """نموذج الروابط السريعة"""
    name = models.CharField(max_length=200, verbose_name="اسم الرابط")
    url = models.URLField(max_length=500, verbose_name="رابط الرابط")
    icon = models.ImageField(upload_to='links/icons/', verbose_name="أيقونة الرابط")
    order = models.IntegerField(default=0, verbose_name="ترتيب الرابط",
                                help_text="الرقم الأقل يظهر أولاً")
    is_active = models.BooleanField(default=True, verbose_name="نشط")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")

    class Meta:
        app_label = 'login_page'
        db_table = 'api_link'
        verbose_name = "رابط"
        verbose_name_plural = "الروابط"
        ordering = ['order', 'created_at']

    def __str__(self):
        return self.name
    
    @property
    def icon_url(self):
        """إرجاع رابط الأيقونة الكامل"""
        if self.icon:
            return self.icon.url
        return None


class LiveChannel(models.Model):
    """نموذج قنوات البث المباشر"""
    STREAM_TYPE_CHOICES = [
        ('flv', 'FLV'),
        ('hls', 'HLS'),
        ('mpegts', 'MPEG-TS'),
        ('dash', 'DASH'),
        ('html5', 'HTML5'),
    ]
    
    name = models.CharField(max_length=200, verbose_name="اسم القناة")
    stream_url = models.URLField(max_length=500, verbose_name="رابط البث")
    stream_type = models.CharField(max_length=10, choices=STREAM_TYPE_CHOICES, 
                                   default='hls', verbose_name="نوع البث")
    icon = models.ImageField(upload_to='channels/icons/', blank=True, null=True,
                            verbose_name="أيقونة القناة")
    description = models.TextField(blank=True, null=True, verbose_name="وصف القناة")
    order = models.IntegerField(default=0, verbose_name="ترتيب القناة",
                                help_text="الرقم الأقل يظهر أولاً")
    is_active = models.BooleanField(default=True, verbose_name="نشط")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")

    class Meta:
        app_label = 'streaming'
        db_table = 'api_livechannel'
        verbose_name = "قناة بث مباشر"
        verbose_name_plural = "قنوات البث المباشر"
        ordering = ['order', 'created_at']

    def __str__(self):
        return self.name
    
    @property
    def icon_url(self):
        """إرجاع رابط الأيقونة الكامل"""
        if self.icon:
            return self.icon.url
        return None


class Team(models.Model):
    """نموذج الفرق الرياضية"""
    TEAM_TYPE_CHOICES = [
        ('national', 'منتخب'),
        ('club', 'نادي'),
    ]
    
    name = models.CharField(max_length=200, verbose_name="اسم الفريق")
    team_type = models.CharField(max_length=20, choices=TEAM_TYPE_CHOICES,
                                 default='club', verbose_name="نوع الفريق")
    logo = models.ImageField(upload_to='teams/logos/', verbose_name="شعار الفريق")
    is_active = models.BooleanField(default=True, verbose_name="نشط")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")
    
    class Meta:
        app_label = 'streaming'
        db_table = 'api_team'
        verbose_name = "فريق"
        verbose_name_plural = "الفرق"
        ordering = ['team_type', 'name']
    
    def __str__(self):
        type_display = "🏆" if self.team_type == 'national' else "⚽"
        return f"{type_display} {self.name}"
    
    @property
    def logo_url(self):
        """إرجاع رابط الشعار الكامل"""
        if self.logo:
            return self.logo.url
        return None


class Match(models.Model):
    """نموذج المواجهات الرياضية"""
    MATCH_TYPE_CHOICES = [
        ('national', 'منتخبات'),
        ('club', 'أندية'),
    ]
    
    match_type = models.CharField(max_length=20, choices=MATCH_TYPE_CHOICES,
                                  default='club', verbose_name="نوع المباراة")
    team1 = models.ForeignKey('Team', on_delete=models.CASCADE,
                             related_name='home_matches',
                             verbose_name="الفريق الأول")
    team2 = models.ForeignKey('Team', on_delete=models.CASCADE,
                             related_name='away_matches',
                             verbose_name="الفريق الثاني")
    match_time = models.DateTimeField(verbose_name="موعد المباراة")
    live_channel = models.ForeignKey(LiveChannel, on_delete=models.SET_NULL, 
                                    blank=True, null=True,
                                    verbose_name="قناة البث المباشر",
                                    help_text="القناة التي ستنقل المباراة")
    # حقول لعبة التوقعات
    team1_votes = models.IntegerField(default=0, verbose_name="تصويتات الفريق الأول",
                                     help_text="عدد التصويتات للفريق الأول")
    team2_votes = models.IntegerField(default=0, verbose_name="تصويتات الفريق الثاني",
                                     help_text="عدد التصويتات للفريق الثاني")
    is_active = models.BooleanField(default=True, verbose_name="نشط")
    order = models.IntegerField(default=0, verbose_name="ترتيب المباراة")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")

    class Meta:
        app_label = 'streaming'
        db_table = 'api_match'
        verbose_name = "مباراة"
        verbose_name_plural = "الموجهات"
        ordering = ['match_time', 'order']

    def __str__(self):
        team1_name = self.team1.name if self.team1 else "فريق غير محدد"
        team2_name = self.team2.name if self.team2 else "فريق غير محدد"
        return f"{team1_name} vs {team2_name}"
    
    @property
    def team1_logo_url(self):
        """إرجاع رابط شعار الفريق الأول"""
        return self.team1.logo_url if self.team1 else None
    
    @property
    def team2_logo_url(self):
        """إرجاع رابط شعار الفريق الثاني"""
        return self.team2.logo_url if self.team2 else None
    
    @property
    def match_status(self):
        """حساب حالة المباراة بناءً على الموعد"""
        from django.utils import timezone
        from datetime import timedelta
        
        # التحقق من وجود موعد المباراة
        if not self.match_time:
            return {
                'status': 'unknown',
                'status_ar': 'غير محدد',
                'display': 'لم يحدد',
                'class': 'status-unknown'
            }
        
        # الحصول على الوقت الحالي بتوقيت المنطقة الزمنية المحددة
        now = timezone.now()
        
        # افتراض أن المباراة تستغرق 120 دقيقة (90 دقيقة + وقت إضافي محتمل)
        match_duration = timedelta(minutes=120)
        match_end_time = self.match_time + match_duration
        
        if now < self.match_time:
            # المباراة لم تبدأ بعد - حساب الوقت المتبقي
            time_remaining = self.match_time - now
            
            if time_remaining.days > 0:
                return {
                    'status': 'upcoming',
                    'status_ar': 'قادمة',
                    'display': f'بعد {time_remaining.days} يوم',
                    'class': 'status-upcoming'
                }
            elif time_remaining.seconds >= 3600:
                hours = time_remaining.seconds // 3600
                return {
                    'status': 'upcoming',
                    'status_ar': 'قادمة',
                    'display': f'بعد {hours} ساعة',
                    'class': 'status-upcoming'
                }
            else:
                minutes = time_remaining.seconds // 60
                return {
                    'status': 'upcoming',
                    'status_ar': 'قادمة',
                    'display': f'بعد {minutes} دقيقة',
                    'class': 'status-upcoming'
                }
        elif now >= self.match_time and now < match_end_time:
            # المباراة جارية الآن
            return {
                'status': 'live',
                'status_ar': 'جارية الآن',
                'display': '🔴 مباشر',
                'class': 'status-live'
            }
        else:
            # المباراة انتهت
            return {
                'status': 'finished',
                'status_ar': 'انتهت',
                'display': 'انتهت',
                'class': 'status-finished'
            }
    
    @property
    def channel_name(self):
        """إرجاع اسم القناة"""
        return self.live_channel.name if self.live_channel else "-"
    
    @property
    def vote_stats(self):
        """حساب إحصائيات التصويت والنسب المئوية"""
        total_votes = self.team1_votes + self.team2_votes
        
        if total_votes == 0:
            return {
                'total_votes': 0,
                'team1_votes': 0,
                'team2_votes': 0,
                'team1_percentage': 50.0,
                'team2_percentage': 50.0
            }
        
        team1_percentage = (self.team1_votes / total_votes) * 100
        team2_percentage = (self.team2_votes / total_votes) * 100
        
        return {
            'total_votes': total_votes,
            'team1_votes': self.team1_votes,
            'team2_votes': self.team2_votes,
            'team1_percentage': round(team1_percentage, 1),
            'team2_percentage': round(team2_percentage, 1)
        }


class ChatRoom(models.Model):
    """نموذج غرف الدردشة"""
    channel = models.OneToOneField(LiveChannel, on_delete=models.CASCADE,
                                   verbose_name="القناة",
                                   related_name="chat_room",
                                   help_text="القناة المرتبطة بهذه الغرفة")
    name = models.CharField(max_length=200, verbose_name="اسم الغرفة",
                           help_text="اسم الغرفة (افتراضياً اسم القناة)")
    description = models.TextField(blank=True, null=True, verbose_name="وصف الغرفة")
    is_active = models.BooleanField(default=True, verbose_name="نشط",
                                   help_text="عند التعطيل، لن يتمكن المستخدمون من الدخول")
    max_users = models.IntegerField(default=100, verbose_name="الحد الأقصى للمستخدمين",
                                    help_text="الحد الأقصى لعدد المستخدمين في الغرفة")
    matrix_room_id = models.CharField(max_length=255, unique=True, null=True, blank=True,
                                     verbose_name="معرف غرفة Matrix",
                                     help_text="معرف الغرفة في سيرفر Matrix/Synapse")
    matrix_room_alias = models.CharField(max_length=255, null=True, blank=True,
                                        verbose_name="اسم مستعار للغرفة",
                                        help_text="الاسم المستعار للغرفة في Matrix (مثل: #room:domain.com)")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")

    class Meta:
        app_label = 'chat'
        db_table = 'api_chatroom'
        verbose_name = "غرفة دردشة"
        verbose_name_plural = "غرف الدردشة"
        ordering = ['channel__order', 'created_at']

    def __str__(self):
        return self.name or f"غرفة {self.channel.name}"

    def save(self, *args, **kwargs):
        """
        حفظ الغرفة - إنشاء في Matrix قبل الحفظ في Django
        """
        import logging
        from .matrix_service import MatrixService
        from .matrix_cache import get_admin_token
        from urllib.parse import urlparse
        
        logger = logging.getLogger(__name__)
        
        # تعيين الاسم إذا لم يكن موجوداً
        if not self.name:
            self.name = self.channel.name
        
        # إذا كانت غرفة جديدة (ليس لديها ID) وليس لديها matrix_room_id
        is_new = self.pk is None
        if is_new and not self.matrix_room_id:
            logger.info(f"🔄 محاولة إنشاء غرفة Matrix قبل الحفظ: {self.name}")
            
            try:
                # جلب إعدادات Matrix
                site_settings = SiteSettings.load()
                
                if not site_settings.matrix_homeserver_url:
                    logger.error("❌ سيرفر Matrix غير مُعد - لا يمكن إنشاء الغرفة")
                    raise Exception("سيرفر Matrix غير مُعد. يرجى تكوين إعدادات Matrix في لوحة الإدارة.")
                
                if not site_settings.matrix_admin_user or not site_settings.matrix_admin_password:
                    logger.error("❌ بيانات مستخدم الإدارة غير مُعدة")
                    raise Exception("بيانات مستخدم الإدارة غير مُعدة. يرجى تكوين مستخدم الإدارة في إعدادات Matrix.")
                
                # إنشاء MatrixService
                matrix_service = MatrixService(site_settings.matrix_homeserver_url)
                
                # الحصول على Admin Token
                admin_token = get_admin_token(
                    matrix_service,
                    site_settings.matrix_admin_user,
                    site_settings.matrix_admin_password
                )
                logger.info("✅ تم الحصول على Admin Token")
                
                # تحديد الدومين
                parsed = urlparse(site_settings.matrix_homeserver_url)
                domain = parsed.netloc.split(':')[0] if ':' in parsed.netloc else parsed.netloc
                if not domain or domain == '172.16.1.2':
                    domain = 'localhost'
                
                # إنشاء أو الحصول على Space الرئيسي
                space_id = site_settings.matrix_space_id
                if not space_id:
                    try:
                        logger.info("🔄 إنشاء Space رئيسي...")
                        space_response = matrix_service.create_space(
                            name="MATCH Chat Rooms",
                            alias="match_chat_rooms",
                            topic="مجموعة غرف الدردشة لشبكة MATCH",
                            access_token=admin_token
                        )
                        space_id = space_response.get('room_id')
                        site_settings.matrix_space_id = space_id
                        site_settings.save()
                        logger.info(f"✅ تم إنشاء Space: {space_id}")
                    except Exception as space_error:
                        logger.warning(f"⚠️ فشل إنشاء Space: {space_error}")
                
                # إنشاء الغرفة في Matrix
                room_alias = f"{site_settings.matrix_room_prefix}{self.channel.id}"
                logger.info(f"🔄 إنشاء غرفة في Matrix: {room_alias}")
                
                try:
                    room_response = matrix_service.create_room(
                        name=self.name,
                        alias=room_alias,
                        topic=self.description or f"غرفة دردشة {self.name}",
                        is_public=True,
                        access_token=admin_token,
                        space_id=space_id
                    )
                    
                    # حفظ معلومات Matrix قبل الحفظ في Django
                    self.matrix_room_id = room_response.get('room_id')
                    self.matrix_room_alias = room_response.get('room_alias') or f"#{room_alias}:{domain}"
                    
                    logger.info(f"✅ تم إنشاء الغرفة في Matrix:")
                    logger.info(f"   - Room ID: {self.matrix_room_id}")
                    logger.info(f"   - Room Alias: {self.matrix_room_alias}")
                    
                except Exception as room_error:
                    error_str = str(room_error).lower()
                    
                    # إذا كانت الغرفة موجودة بالفعل، حاول الانضمام لها
                    if 'already' in error_str or 'in_use' in error_str or 'taken' in error_str:
                        logger.warning(f"⚠️ الـ alias موجودة بالفعل: {room_alias}")
                        logger.info(f"🔄 محاولة الانضمام للغرفة الموجودة...")
                        try:
                            full_alias = f"#{room_alias}:{domain}"
                            logger.info(f"   - Alias: {full_alias}")
                            join_response = matrix_service.join_room(full_alias, admin_token)
                            self.matrix_room_id = join_response.get('room_id')
                            self.matrix_room_alias = full_alias
                            logger.info(f"✅ تم الانضمام للغرفة الموجودة بنجاح!")
                            logger.info(f"   - Room ID: {self.matrix_room_id}")
                            # نجح الانضمام، لا نرفع Exception
                        except Exception as join_error:
                            join_error_str = str(join_error)
                            logger.error(f"❌ فشل الانضمام للغرفة الموجودة: {join_error_str}")
                            
                            # إعطاء رسالة واضحة للمستخدم
                            if 'no servers' in join_error_str.lower():
                                raise Exception(
                                    f"الغرفة بالاسم المستعار '{room_alias}' موجودة في Matrix لكنها غير متاحة. "
                                    f"يرجى حذف الغرفة من Matrix Server يدوياً أو استخدام قناة أخرى."
                                )
                            else:
                                raise Exception(f"فشل الانضمام للغرفة الموجودة في Matrix: {join_error_str}")
                    else:
                        logger.error(f"❌ فشل إنشاء الغرفة: {room_error}")
                        raise Exception(f"فشل إنشاء الغرفة في Matrix: {room_error}")
                        
            except Exception as e:
                logger.error(f"❌ خطأ في إنشاء غرفة Matrix: {str(e)}")
                # رفع الخطأ لمنع الحفظ في Django
                raise
        
        # الحفظ في Django فقط إذا نجح إنشاء Matrix
        super().save(*args, **kwargs)
        logger.info(f"✅ تم حفظ الغرفة في Django: {self.name}")

    @property
    def current_users_count(self):
        """عدد المستخدمين الحاليين في الغرفة (من خادم WebSocket)"""
        # هذا سيتم تحديثه من خادم WebSocket
        return 0


class ChatUser(models.Model):
    """نموذج مستخدمي الدردشة - مستخدم عام لكل الغرف"""
    username = models.CharField(max_length=100, unique=True, verbose_name="اسم المستخدم",
                                help_text="اسم المستخدم الفريد (عام لجميع الغرف)")
    password = models.CharField(max_length=255, null=True, blank=True, verbose_name="كلمة المرور",
                               help_text="كلمة المرور للمستخدم في Matrix (مشفرة)")
    is_online = models.BooleanField(default=False, verbose_name="متصل الآن")
    is_banned = models.BooleanField(default=False, verbose_name="محظور",
                                     help_text="المستخدم المحظور لا يمكنه الدخول لأي غرفة")
    is_moderator = models.BooleanField(default=False, verbose_name="مشرف",
                                       help_text="المشرف يمكنه حذف الرسائل وحظر المستخدمين في جميع الغرف")
    matrix_user_id = models.CharField(max_length=255, unique=True, null=True, blank=True,
                                     verbose_name="معرف مستخدم Matrix",
                                     help_text="معرف المستخدم في Matrix (مثل: @user:domain.com)")
    access_token = models.CharField(max_length=500, null=True, blank=True,
                                   verbose_name="رمز الوصول",
                                   help_text="Access Token للمصادقة في Matrix")
    device_id = models.CharField(max_length=255, null=True, blank=True,
                                verbose_name="معرف الجهاز",
                                help_text="معرف الجهاز في Matrix")
    token_expires_at = models.DateTimeField(null=True, blank=True,
                                          verbose_name="انتهاء صلاحية الرمز",
                                          help_text="تاريخ انتهاء صلاحية Access Token")
    last_seen = models.DateTimeField(auto_now=True, verbose_name="آخر ظهور")
    joined_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الانضمام")
    messages_count = models.IntegerField(default=0, verbose_name="عدد الرسائل",
                                        help_text="عدد الرسائل التي أرسلها المستخدم في جميع الغرف")

    class Meta:
        app_label = 'chat'
        db_table = 'api_chatuser'
        verbose_name = "مستخدم دردشة"
        verbose_name_plural = "مستخدمو الدردشة"
        ordering = ['-is_online', '-last_seen']

    def __str__(self):
        status = "🟢" if self.is_online else "⚫"
        return f"{status} {self.username}"


class ChatMessage(models.Model):
    """نموذج رسائل الدردشة (للأرشفة)"""
    MESSAGE_TYPES = [
        ('message', 'رسالة عادية'),
        ('system', 'رسالة نظام'),
        ('user_joined', 'دخول مستخدم'),
        ('user_left', 'خروج مستخدم'),
    ]
    
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE,
                            verbose_name="الغرفة",
                            related_name="messages")
    username = models.CharField(max_length=100, blank=True, null=True,
                               verbose_name="اسم المستخدم",
                               help_text="اسم المستخدم الذي أرسل الرسالة")
    user = models.ForeignKey(ChatUser, on_delete=models.SET_NULL,
                           blank=True, null=True,
                           verbose_name="المستخدم (مرجع)",
                           related_name="messages",
                           help_text="مرجع اختياري للمستخدم إذا كان مسجلاً")
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES,
                                   default='message', verbose_name="نوع الرسالة")
    content = models.TextField(verbose_name="محتوى الرسالة")
    is_deleted = models.BooleanField(default=False, verbose_name="محذوف",
                                    help_text="الرسائل المحذوفة لا تظهر للمستخدمين")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإرسال")

    class Meta:
        app_label = 'chat'
        db_table = 'api_chatmessage'
        verbose_name = "رسالة دردشة"
        verbose_name_plural = "رسائل الدردشة"
        ordering = ['-created_at']

    def __str__(self):
        username = self.user.username if self.user else "النظام"
        preview = self.content[:50] + "..." if len(self.content) > 50 else self.content
        return f"{username}: {preview}"


class StatusButton(models.Model):
    """نموذج أزرار صفحة الحالة"""
    name = models.CharField(max_length=200, verbose_name="اسم الزر",
                           help_text="النص الذي سيظهر على الزر")
    url = models.CharField(max_length=500, verbose_name="المسار",
                          help_text="مسار الزر (مثل: live2/index.html أو $(link-break))")
    is_active = models.BooleanField(default=True, verbose_name="الحالة",
                                   help_text="عند التعطيل، لن يظهر الزر في صفحة الحالة")
    order = models.IntegerField(default=0, verbose_name="الترتيب",
                               help_text="الرقم الأقل يظهر أولاً")
    icon = models.CharField(max_length=100, blank=True, null=True,
                           verbose_name="أيقونة",
                           help_text="اسم الأيقونة من fontello (مثل: icon-globe, icon-stop)")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")

    class Meta:
        app_label = 'general'
        db_table = 'api_statusbutton'
        verbose_name = "زر صفحة الحالة"
        verbose_name_plural = "أزرار صفحة الحالة"
        ordering = ['order', 'created_at']

    def __str__(self):
        return self.name