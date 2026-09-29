from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
    verbose_name = 'إدارة المحتوى'
    
    def ready(self):
        """تحميل signals عند بدء التطبيق"""
        import api.signals  # noqa

