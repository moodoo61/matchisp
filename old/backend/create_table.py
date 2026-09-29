import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'match_api.settings')
django.setup()

from django.db import connection

print("جاري إنشاء جدول api_statusbutton...")

try:
    cursor = connection.cursor()
    
    # التحقق من وجود الجدول
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='api_statusbutton'
    """)
    
    if cursor.fetchone():
        print("✅ الجدول موجود بالفعل!")
        sys.exit(0)
    
    # إنشاء الجدول
    cursor.execute("""
        CREATE TABLE api_statusbutton (
            id integer NOT NULL PRIMARY KEY AUTOINCREMENT,
            name varchar(200) NOT NULL,
            url varchar(500) NOT NULL,
            is_active bool NOT NULL DEFAULT 1,
            "order" integer NOT NULL DEFAULT 0,
            icon varchar(100) NULL,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL
        )
    """)
    
    # تسجيل الـ migration
    cursor.execute("""
        INSERT INTO django_migrations (app, name, applied)
        VALUES ('general', '0002_create_statusbutton', datetime('now'))
    """)
    
    connection.commit()
    print("✅ تم إنشاء الجدول بنجاح!")
    
except Exception as e:
    print(f"❌ خطأ: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
