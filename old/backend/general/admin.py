"""إدارة القسم العام"""
from django.contrib import admin
from api.models import SiteSettings, StatusButton

# استيراد admin classes من api
from api.admin import SiteSettingsAdmin, StatusButtonAdmin

# إلغاء التسجيل من api (إذا كان مسجلاً)
try:
    admin.site.unregister(SiteSettings)
except admin.sites.NotRegistered:
    pass

try:
    admin.site.unregister(StatusButton)
except admin.sites.NotRegistered:
    pass

# إعادة التسجيل في general
admin.site.register(SiteSettings, SiteSettingsAdmin)
admin.site.register(StatusButton, StatusButtonAdmin)

