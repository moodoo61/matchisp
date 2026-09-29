"""إدارة قسم الشات"""
from django.contrib import admin
from api.models import ChatRoom, ChatUser, ChatMessage

# استيراد admin classes من api
from api.admin import ChatRoomAdmin, ChatUserAdmin, ChatMessageAdmin

# إلغاء التسجيل من api (إذا كان مسجلاً)
for model in [ChatRoom, ChatUser, ChatMessage]:
    try:
        admin.site.unregister(model)
    except admin.sites.NotRegistered:
        pass

# إعادة التسجيل في chat
admin.site.register(ChatRoom, ChatRoomAdmin)
admin.site.register(ChatUser, ChatUserAdmin)
admin.site.register(ChatMessage, ChatMessageAdmin)

