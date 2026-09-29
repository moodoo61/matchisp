from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import (Advertisement, NewsTicker, Package, Agent, SiteSettings, Link, 
                    LiveChannel, Team, Match, ChatRoom, ChatUser, ChatMessage, StatusButton)


# ===================================================================
# ملاحظة: جميع النماذج مسجلة في تطبيقاتها المنفصلة (general, login_page, streaming, chat)
# هذا الملف يحتوي فقط على تعريفات Admin Classes التي يتم استخدامها من التطبيقات الأخرى
# ===================================================================


class AdvertisementAdmin(admin.ModelAdmin):
    list_display = ['name', 'order', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'link']
    list_editable = ['order', 'is_active']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('المعلومات الأساسية', {
            'fields': ('name', 'image', 'link', 'order', 'is_active')
        }),
        ('معلومات إضافية', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class NewsTickerAdmin(admin.ModelAdmin):
    list_display = ['text_preview', 'order', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['text']
    list_editable = ['order', 'is_active']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('محتوى الخبر', {
            'fields': ('text', 'order', 'is_active')
        }),
        ('معلومات إضافية', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def text_preview(self, obj):
        return obj.text[:100] + "..." if len(obj.text) > 100 else obj.text
    text_preview.short_description = "النص"


class PackageAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'time', 'order', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name']
    list_editable = ['order', 'is_active']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('معلومات الباقة', {
            'fields': ('name', 'price', 'time', 'download', 'validity', 'order', 'is_active')
        }),
        ('معلومات إضافية', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class AgentAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'order', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'phone', 'address']
    list_editable = ['order', 'is_active']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('معلومات الوكيل', {
            'fields': ('name', 'address', 'phone', 'order', 'is_active')
        }),
        ('معلومات إضافية', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ['network_name', 'admin_phone', 'repair_phone', 'enable_customer_login', 'enable_chat', 'updated_at']
    readonly_fields = ['updated_at']
    
    fieldsets = (
        ('إعدادات الموقع', {
            'fields': ('network_name', 'logo', 'admin_phone', 'repair_phone')
        }),
        ('إعدادات إضافية', {
            'fields': ('enable_customer_login', 'enable_chat')
        }),
        ('إعدادات Matrix', {
            'fields': ('matrix_homeserver_url', 'matrix_admin_user', 
                      'matrix_admin_password', 'matrix_room_prefix'),
            'description': 'إعدادات سيرفر Matrix/Synapse للدردشة'
        }),
        ('معلومات إضافية', {
            'fields': ('updated_at',),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        # منع إضافة أكثر من سجل واحد
        if self.model.objects.count() >= 1:
            return False
        return super().has_add_permission(request)
    
    def has_delete_permission(self, request, obj=None):
        # منع حذف السجل الوحيد
        return False


class LinkAdmin(admin.ModelAdmin):
    list_display = ['name', 'url', 'order', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'url']
    list_editable = ['order', 'is_active']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('معلومات الرابط', {
            'fields': ('name', 'url', 'icon', 'order', 'is_active')
        }),
        ('معلومات إضافية', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class LiveChannelAdmin(admin.ModelAdmin):
    list_display = ['name', 'stream_type', 'order', 'is_active', 'created_at']
    list_filter = ['is_active', 'stream_type', 'created_at']
    search_fields = ['name', 'description', 'stream_url']
    list_editable = ['order', 'is_active']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('معلومات القناة', {
            'fields': ('name', 'description', 'icon', 'order', 'is_active')
        }),
        ('إعدادات البث', {
            'fields': ('stream_url', 'stream_type')
        }),
        ('معلومات إضافية', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class TeamAdmin(admin.ModelAdmin):
    list_display = ['name_with_icon', 'team_type', 'logo_preview', 'is_active', 'created_at']
    list_filter = ['team_type', 'is_active', 'created_at']
    search_fields = ['name', 'id']  # إضافة id للبحث
    list_editable = ['is_active']
    readonly_fields = ['created_at', 'updated_at', 'logo_preview_large']
    fieldsets = (
        ('معلومات الفريق', {
            'fields': ('name', 'team_type', 'is_active')
        }),
        ('الشعار', {
            'fields': ('logo', 'logo_preview_large')
        }),
        ('معلومات إضافية', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def name_with_icon(self, obj):
        icon = "🏆" if obj.team_type == 'national' else "⚽"
        return f"{icon} {obj.name}"
    name_with_icon.short_description = "اسم الفريق"
    
    def logo_preview(self, obj):
        if obj.logo:
            return format_html('<img src="{}" width="30" height="30" style="border-radius: 50%;" />', obj.logo.url)
        return "-"
    logo_preview.short_description = "الشعار"
    
    def logo_preview_large(self, obj):
        if obj.logo:
            return format_html('<img src="{}" width="100" height="100" style="border-radius: 10px;" />', obj.logo.url)
        return "-"
    logo_preview_large.short_description = "معاينة الشعار"


class MatchAdmin(admin.ModelAdmin):
    list_display = ['match_display', 'match_type', 'match_time', 'status_display', 'channel_name', 'is_active']
    list_filter = ['match_type', 'is_active', 'match_time', 'created_at']
    search_fields = ['team1__name', 'team2__name', 'live_channel__name']
    list_editable = ['is_active']
    readonly_fields = ['created_at', 'updated_at', 'status_display']
    autocomplete_fields = ['team1', 'team2']
    actions = ['delete_incomplete_matches']
    fieldsets = (
        ('نوع المباراة', {
            'fields': ('match_type',)
        }),
        ('الفرق المتنافسة', {
            'fields': ('team1', 'team2')
        }),
        ('معلومات المباراة', {
            'fields': ('match_time', 'live_channel', 'order', 'is_active')
        }),
        ('حالة المباراة', {
            'fields': ('status_display',),
            'description': 'حالة المباراة يتم حسابها تلقائياً بناءً على الموعد'
        }),
        ('معلومات إضافية', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def match_display(self, obj):
        if obj.team1 and obj.team2:
            return f"{obj.team1.name} 🆚 {obj.team2.name}"
        elif obj.team1:
            return f"{obj.team1.name} 🆚 ؟"
        elif obj.team2:
            return f"؟ 🆚 {obj.team2.name}"
        else:
            return "مباراة غير مكتملة"
    match_display.short_description = "المباراة"
    
    def status_display(self, obj):
        try:
            status = obj.match_status
            colors = {
                'upcoming': '#2196F3',  # أزرق
                'live': '#F44336',      # أحمر
                'finished': '#9E9E9E',  # رمادي
                'unknown': '#FFC107'    # برتقالي
            }
            color = colors.get(status['status'], '#000')
            return format_html(
                '<span style="background-color: {}; color: white; padding: 5px 10px; border-radius: 5px; font-weight: bold;">{}</span>',
                color,
                status['display']
            )
        except Exception as e:
            return format_html(
                '<span style="color: red;">خطأ: {}</span>',
                str(e)
            )
    status_display.short_description = "حالة المباراة"
    
    def channel_name(self, obj):
        try:
            return obj.channel_name
        except:
            return "-"
    channel_name.short_description = "القناة"
    
    def delete_incomplete_matches(self, request, queryset):
        """حذف المباريات غير المكتملة (التي ليس لها فريقين)"""
        incomplete = queryset.filter(team1__isnull=True) | queryset.filter(team2__isnull=True)
        count = incomplete.count()
        incomplete.delete()
        self.message_user(request, f"تم حذف {count} مباراة غير مكتملة")
    delete_incomplete_matches.short_description = "حذف المباريات غير المكتملة"


# ============================================
# إدارة الدردشة
# ============================================

class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ['name', 'channel_link', 'matrix_room_id_short', 'max_users', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description', 'channel__name', 'matrix_room_id', 'matrix_room_alias']
    list_editable = ['is_active', 'max_users']
    readonly_fields = ['matrix_room_id', 'matrix_room_alias', 'created_at', 'updated_at']
    fieldsets = (
        ('معلومات الغرفة', {
            'fields': ('channel', 'name', 'description', 'is_active')
        }),
        ('إعدادات الغرفة', {
            'fields': ('max_users',)
        }),
        ('إعدادات Matrix (تلقائية)', {
            'fields': ('matrix_room_id', 'matrix_room_alias'),
            'description': 'معلومات الغرفة في سيرفر Matrix (يتم تعيينها تلقائياً عند الحفظ)'
        }),
        ('معلومات إضافية', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def matrix_room_id_short(self, obj):
        if obj.matrix_room_id:
            return obj.matrix_room_id[:30] + "..." if len(obj.matrix_room_id) > 30 else obj.matrix_room_id
        return "-"
    matrix_room_id_short.short_description = "معرف Matrix"

    def channel_link(self, obj):
        try:
            url = reverse('admin:streaming_livechannel_change', args=[obj.channel.pk])
            return format_html('<a href="{}">{}</a>', url, obj.channel.name)
        except:
            return obj.channel.name if obj.channel else "-"
    channel_link.short_description = "القناة"


class ChatUserAdmin(admin.ModelAdmin):
    list_display = ['username', 'matrix_user_id_short', 'status_display', 'is_moderator', 'is_banned', 'messages_count', 'last_seen']
    list_filter = ['is_online', 'is_banned', 'is_moderator', 'last_seen']
    search_fields = ['username', 'matrix_user_id']
    list_editable = ['is_moderator', 'is_banned']
    readonly_fields = ['joined_at', 'last_seen', 'messages_count', 'token_expires_at']
    fieldsets = (
        ('معلومات المستخدم', {
            'fields': ('username',),
            'description': 'سيتم تعيين كلمة المرور تلقائياً إلى "123" للجميع'
        }),
        ('إعدادات Matrix', {
            'fields': ('matrix_user_id', 'access_token', 'device_id', 'token_expires_at'),
            'description': 'معلومات المستخدم في Matrix',
            'classes': ('collapse',)
        }),
        ('الحالة', {
            'fields': ('is_online', 'is_moderator', 'is_banned')
        }),
        ('إحصائيات', {
            'fields': ('messages_count', 'joined_at', 'last_seen'),
            'classes': ('collapse',)
        }),
    )
    
    def matrix_user_id_short(self, obj):
        if obj.matrix_user_id:
            return obj.matrix_user_id[:25] + "..." if len(obj.matrix_user_id) > 25 else obj.matrix_user_id
        return "-"
    matrix_user_id_short.short_description = "معرف Matrix"
    actions = ['ban_users', 'unban_users', 'make_moderators', 'remove_moderators']

    def status_display(self, obj):
        if obj.is_banned:
            return format_html('<span style="color: red;">🚫 محظور</span>')
        elif obj.is_online:
            return format_html('<span style="color: green;">🟢 متصل</span>')
        else:
            return format_html('<span style="color: gray;">⚫ غير متصل</span>')
    status_display.short_description = "الحالة"

    def ban_users(self, request, queryset):
        queryset.update(is_banned=True, is_online=False)
        self.message_user(request, f"تم حظر {queryset.count()} مستخدم")
    ban_users.short_description = "حظر المستخدمين المحددين"

    def unban_users(self, request, queryset):
        queryset.update(is_banned=False)
        self.message_user(request, f"تم إلغاء حظر {queryset.count()} مستخدم")
    unban_users.short_description = "إلغاء حظر المستخدمين المحددين"

    def make_moderators(self, request, queryset):
        queryset.update(is_moderator=True)
        self.message_user(request, f"تم تعيين {queryset.count()} مستخدم كمشرف")
    make_moderators.short_description = "تعيين كمشرفين"

    def remove_moderators(self, request, queryset):
        queryset.update(is_moderator=False)
        self.message_user(request, f"تم إلغاء صلاحيات المشرف من {queryset.count()} مستخدم")
    remove_moderators.short_description = "إلغاء صلاحيات المشرف"


class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['content_preview', 'user_link', 'room_link', 'message_type', 'is_deleted', 'created_at']
    list_filter = ['message_type', 'is_deleted', 'room', 'created_at']
    search_fields = ['content', 'user__username', 'room__name']
    list_editable = ['is_deleted']
    readonly_fields = ['created_at']
    fieldsets = (
        ('محتوى الرسالة', {
            'fields': ('room', 'user', 'message_type', 'content', 'is_deleted')
        }),
        ('معلومات إضافية', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    actions = ['delete_messages', 'restore_messages']

    def content_preview(self, obj):
        preview = obj.content[:100] + "..." if len(obj.content) > 100 else obj.content
        if obj.is_deleted:
            return format_html('<span style="text-decoration: line-through; color: gray;">{}</span>', preview)
        return preview
    content_preview.short_description = "المحتوى"

    def user_link(self, obj):
        if obj.user:
            url = reverse('admin:api_chatuser_change', args=[obj.user.pk])
            return format_html('<a href="{}">{}</a>', url, obj.user.username)
        elif obj.username:
            return obj.username
        return "النظام"
    user_link.short_description = "المستخدم"

    def room_link(self, obj):
        url = reverse('admin:api_chatroom_change', args=[obj.room.pk])
        return format_html('<a href="{}">{}</a>', url, obj.room.name)
    room_link.short_description = "الغرفة"

    def delete_messages(self, request, queryset):
        queryset.update(is_deleted=True)
        self.message_user(request, f"تم حذف {queryset.count()} رسالة")
    delete_messages.short_description = "حذف الرسائل المحددة"

    def restore_messages(self, request, queryset):
        queryset.update(is_deleted=False)
        self.message_user(request, f"تم استعادة {queryset.count()} رسالة")
    restore_messages.short_description = "استعادة الرسائل المحذوفة"


# ============================================
# إدارة أزرار صفحة الحالة
# ============================================

class StatusButtonAdmin(admin.ModelAdmin):
    list_display = ['name', 'url', 'icon', 'order', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'url']
    list_editable = ['order', 'is_active']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('معلومات الزر', {
            'fields': ('name', 'url', 'icon', 'order', 'is_active'),
            'description': 'يمكن استخدام متغيرات MikroTik مثل $(link-break) في حقل المسار'
        }),
        ('معلومات إضافية', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

