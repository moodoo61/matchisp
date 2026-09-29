import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'match_api.settings')
django.setup()

from django.db import connection

cursor = connection.cursor()

# التحقق من وجود الجدول
cursor.execute("""
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='api_statusbutton'
""")

exists = cursor.fetchone()

with open('output.txt', 'w', encoding='utf-8') as f:
    if exists:
        f.write("الجدول موجود بالفعل\n")
    else:
        f.write("جاري إنشاء الجدول...\n")
        try:
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
            
            cursor.execute("""
                INSERT INTO django_migrations (app, name, applied)
                VALUES ('general', '0002_create_statusbutton', datetime('now'))
            """)
            
            connection.commit()
            f.write("✅ تم إنشاء الجدول بنجاح!\n")
        except Exception as e:
            f.write(f"❌ خطأ: {e}\n")

print("تم حفظ النتيجة في output.txt")
