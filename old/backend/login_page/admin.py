"""إدارة قسم صفحة تسجيل الدخول"""
from django.contrib import admin
from api.models import Advertisement, Package, Link, NewsTicker, Agent

# استيراد admin classes من api
from api.admin import (
    AdvertisementAdmin, PackageAdmin, LinkAdmin, 
    NewsTickerAdmin, AgentAdmin
)

# إلغاء التسجيل من api (إذا كان مسجلاً)
for model in [Advertisement, Package, Link, NewsTicker, Agent]:
    try:
        admin.site.unregister(model)
    except admin.sites.NotRegistered:
        pass

# إعادة التسجيل في login_page
admin.site.register(Advertisement, AdvertisementAdmin)
admin.site.register(Package, PackageAdmin)
admin.site.register(Link, LinkAdmin)
admin.site.register(NewsTicker, NewsTickerAdmin)
admin.site.register(Agent, AgentAdmin)

