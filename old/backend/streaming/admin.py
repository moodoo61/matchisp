"""إدارة قسم صفحة البث"""
from django.contrib import admin
from api.models import Team, Match, LiveChannel

# استيراد admin classes من api
from api.admin import TeamAdmin, MatchAdmin, LiveChannelAdmin

# إلغاء التسجيل من api (إذا كان مسجلاً)
for model in [Team, Match, LiveChannel]:
    try:
        admin.site.unregister(model)
    except admin.sites.NotRegistered:
        pass

# إعادة التسجيل في streaming
admin.site.register(Team, TeamAdmin)
admin.site.register(Match, MatchAdmin)
admin.site.register(LiveChannel, LiveChannelAdmin)

