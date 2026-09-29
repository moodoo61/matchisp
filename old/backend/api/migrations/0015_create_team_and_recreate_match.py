# Generated manually to recreate Match table with correct structure

from django.db import migrations, models, connection
import django.db.models.deletion


def check_and_create_team_table(apps, schema_editor):
    """التحقق من وجود جدول Team وإنشائه إذا لم يكن موجوداً"""
    with connection.cursor() as cursor:
        # التحقق من وجود جدول api_team
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='api_team';
        """)
        table_exists = cursor.fetchone()
        
        if not table_exists:
            # إنشاء جدول api_team
            cursor.execute("""
                CREATE TABLE "api_team" (
                    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
                    "name" varchar(200) NOT NULL,
                    "team_type" varchar(20) NOT NULL,
                    "logo" varchar(100) NOT NULL,
                    "is_active" bool NOT NULL,
                    "created_at" datetime NOT NULL,
                    "updated_at" datetime NOT NULL
                );
            """)


def drop_and_recreate_match_table(apps, schema_editor):
    """حذف وإعادة إنشاء جدول المباريات"""
    with connection.cursor() as cursor:
        # حذف جدول api_match القديم
        cursor.execute("DROP TABLE IF EXISTS api_match;")
        
        # إعادة إنشاء جدول api_match بالبنية الصحيحة
        cursor.execute("""
            CREATE TABLE "api_match" (
                "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
                "match_type" varchar(20) NOT NULL,
                "match_time" datetime NOT NULL,
                "team1_votes" integer NOT NULL,
                "team2_votes" integer NOT NULL,
                "is_active" bool NOT NULL,
                "order" integer NOT NULL,
                "created_at" datetime NOT NULL,
                "updated_at" datetime NOT NULL,
                "live_channel_id" bigint NULL REFERENCES "api_livechannel" ("id") DEFERRABLE INITIALLY DEFERRED,
                "team1_id" bigint NOT NULL REFERENCES "api_team" ("id") DEFERRABLE INITIALLY DEFERRED,
                "team2_id" bigint NOT NULL REFERENCES "api_team" ("id") DEFERRABLE INITIALLY DEFERRED
            );
        """)
        
        # إنشاء الفهارس
        cursor.execute("""
            CREATE INDEX "api_match_live_channel_id_idx" 
            ON "api_match" ("live_channel_id");
        """)
        cursor.execute("""
            CREATE INDEX "api_match_team1_id_idx" 
            ON "api_match" ("team1_id");
        """)
        cursor.execute("""
            CREATE INDEX "api_match_team2_id_idx" 
            ON "api_match" ("team2_id");
        """)


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0014_add_match_type'),
    ]

    operations = [
        migrations.RunPython(check_and_create_team_table, migrations.RunPython.noop),
        migrations.RunPython(drop_and_recreate_match_table, migrations.RunPython.noop),
    ]
