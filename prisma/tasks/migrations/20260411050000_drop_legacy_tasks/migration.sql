-- إزالة جداول نظام المهام القديم (استُبدل بالصيانة / أوامر العمل)

DROP TABLE IF EXISTS "task_parts_requests" CASCADE;
DROP TABLE IF EXISTS "task_attachments" CASCADE;
DROP TABLE IF EXISTS "task_replies" CASCADE;
DROP TABLE IF EXISTS "task_notifications" CASCADE;
DROP TABLE IF EXISTS "task_assignees" CASCADE;
DROP TABLE IF EXISTS "task_field_values" CASCADE;
DROP TABLE IF EXISTS "tasks" CASCADE;
DROP TABLE IF EXISTS "task_type_fields" CASCADE;
DROP TABLE IF EXISTS "task_types" CASCADE;
