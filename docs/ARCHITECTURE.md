# المعمارية — ملف التأسيس

## الرؤية
نظام إدارة لمكتب خدمات إنترنت (ISP Admin) بهيكلة **Modular Monolith**:
تطبيق NestJS واحد مقسّم لوحدات واضحة، وواجهة Next.js للإدارة، مع **قاعدة بيانات PostgreSQL مستقلة لكل قسم رئيسي**.

## المبادئ الثابتة

1. **قسم = مجلد باسمه + Module + Database + Prisma Client**
2. **ملفات حسب الدور/المهمة** — ممنوع تكديس منطق غير مترابط في ملف واحد ([CODING_ORGANIZATION.md](./CODING_ORGANIZATION.md))
3. **لا Foreign Keys عبر قواعد مختلفة** — الربط عبر UUID فقط
4. **العمليات العابرة للأقسام** تتم في طبقة Application Services داخل NestJS
5. **كل mutation مهمة** تكتب سجل تدقيق في `db_core`
6. **الصلاحيات مركزية** في `@isp/shared` بصيغة `resource:action`
7. **Arabic RTL** للواجهة الإدارية
8. **التشغيل الافتراضي Native على Linux Server** — Docker اختياري فقط
9. **المنافذ:** Admin `4010`، API `3001` (لا نستخدم `3000` لتعارضه مع Grafana)

مراجع إلزامية:
- [PHASE_A_PLAN.md](./PHASE_A_PLAN.md)
- [CODING_ORGANIZATION.md](./CODING_ORGANIZATION.md)
- [ADDING_A_MODULE.md](./ADDING_A_MODULE.md)

## هيكل المستودع

```text
apps/api/src/modules/<section>/   مجلد مستقل لكل قسم (controller/service/dto)
apps/admin-web/src/features/<section>/
apps/admin-web/src/app/(admin)/<section>/
packages/shared                   صلاحيات وأنواع مشتركة فقط
packages/config                   إعدادات TypeScript مشتركة
prisma/<section>/                 سكيمة مستقلة لكل قاعدة
infra/                            سكربتات Postgres + Docker اختياري
docs/                             الخطة + المعمارية + تنظيم الكود
```

## قواعد البيانات

| Database | القسم |
| --- | --- |
| `db_core` | مصادقة، فريق، أدوار، صلاحيات، تدقيق، نظرة عامة |
| `db_network_pages` | إدارة الصفحة (تسجيل الدخول / الحالة) |
| `db_live` | البث المباشر (خادم) — القنوات والأحداث الرياضية |
| `db_break` | الاستراحة |
| `db_comms` | الاتصالات المحلية |
| `db_magazine` | المجلة / اشتراكات الشبكات |
| `db_maintenance` | الصيانة |
| `db_partners` | الوكلاء والموردين |
| `db_inventory` | مشتريات ومخازن |
| `db_orders` | طلبات الكروت |
| `db_support` | خدمة العملاء |
| `db_expenses` | النفقات |
| `db_platform` | الأنظمة الخلفية |
| `db_service_monitor` | مراقب خدمات (MistServer / LibreNMS / Asterisk) |
| `db_settings` | الإعدادات (إدارة الأقراص وغيرها) |
| `db_network` | الشبكة (منافذ، عنونة، توجيه) |

خادم PostgreSQL واحد ينشئ كل هذه القواعد عبر `infra/docker/postgres/init-databases.sh`.

## تدفق المصادقة (المرحلة أ)

```text
Login → Access JWT (قصير) + Refresh Token (مخزّن hashed في db_core)
Guard عام JWT + Guard صلاحيات RBAC
```

## المرحلة أ (المنفّذة)
- البنية التحتية Native + Docker اختياري
- `db_core` كامل + placeholders لباقي الأقسام
- Auth / Team / Roles / Audit / Dashboard
- Admin web RTL للصفحات الأساسية

## قسم إدارة الصفحة (منفّذ جزئياً)
- الاسم الظاهر: **إدارة الصفحة** (قاعدة البيانات التقنية: `db_network_pages`)
- مقسوم حسب الصفحات: **تسجيل الدخول** | **الحالة**
- تحت تسجيل الدخول: تبويبات **عامة** (صور/نص/خدمات/تواصل) و**الباقات**
- تحت الحالة: الخدمات (اسم + صورة + رابط) — كانت «أزرار صفحة الحالة» في النظام القديم
- واجهة Admin: `/pages/login` و `/pages/login/packages` و `/pages/status`
- endpoints عامة للعملاء:
  - `GET /api/public/login/ads`
  - `GET /api/public/login/ticker`
  - `GET /api/public/login/contacts`
  - `GET /api/public/login/packages`
  - `GET /api/public/login/services`
  - `GET /api/public/status/services`

## قسم البث المباشر — تقارير المشاهدة (منفّذ)
- الاسم الظاهر: **تقارير المشاهدة** (ضمن `db_live`)
- واجهة Admin: `/live/viewing-reports`
- API: `/live/viewing-reports/settings|summary|by-day|timeline|sessions`
- استقبال عام: `POST /api/public/live/viewing-reports/user-end`
- صلاحيات: `live.viewing_reports:read|update|delete|manage`

## قسم الوكلاء (منفّذ)
- الاسم الظاهر: **الوكلاء** (قاعدة البيانات التقنية: `db_partners`)
- حقول الوكيل: اسم الوكيل، اسم المحل، العنوان، رقم الهاتف
- واجهة Admin: `/partners`
- API: `GET|POST /partners/agents` و `GET|PATCH|DELETE /partners/agents/:id`
- صلاحيات: `partners:read|create|update|delete`

## قسم مراقب خدمات (منفّذ — هيكل أولي)
- الاسم الظاهر: **مراقب خدمات** (قاعدة البيانات التقنية: `db_service_monitor`)
- صفحة واحدة تعرض بطاقات حالة: MistServer | LibreNMS | Asterisk
- واجهة Admin: `/service-monitor`
- API: `GET|PATCH /service-monitor/services/:key` و `GET /service-monitor/services/:key/status`
- صلاحيات: `service_monitor:read|update|manage`

## قسم الإعدادات (منفّذ جزئياً)
- الاسم الظاهر: **الإعدادات** (قواعد: `db_settings` + `db_network` لفرع الشبكة)
- فروع القائمة: عامة | إدارة الأقراص | قواعد البيانات | التحديث | الشبكة
- الأقراص: `/settings/disks`
- قواعد البيانات: `/settings/databases`
- التحديث: `/settings/updates` — فحص وتنزيل من مستودع Git (`origin`)
- الشبكة: `/settings/network/interfaces` و `/routes` و `/dns`
- API التحديث: `GET /settings/updates` و `POST /settings/updates/check|apply`
- صلاحيات التحديث: `settings.updates:read|apply|manage`
- API الشبكة: `/settings/network/interfaces|routes|dns`
- صلاحيات الشبكة: `network.interfaces|routes|dns:read|manage`
- إدارة المنافذ/العنونة/المسار الافتراضي عبر NetworkManager (ملفات `match-<iface>`) لضمان البقاء بعد الإقلاع؛ العرض التشغيلي من `ip`

## المراحل اللاحقة
تُضاف كوحدات جديدة وفق `docs/ADDING_A_MODULE.md` دون كسر حدود القواعد.
