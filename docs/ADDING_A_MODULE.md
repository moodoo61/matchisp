# إضافة قسم جديد (نمط ثابت)

اتبع هذه الخطوات حرفياً عند إضافة قسم رئيسي جديد.

قبل أي كود: اقرأ [CODING_ORGANIZATION.md](./CODING_ORGANIZATION.md) — **مجلد لكل قسم + ملفات حسب الدور، بلا تكديس**.

## 1) قاعدة البيانات
1. أضف اسم القاعدة في `infra/docker/postgres/init-databases.sh` و `infra/docker/postgres/init-local.sh`
2. أضف `DATABASE_URL_<SECTION>` في `.env.example`
3. أنشئ مجلد `prisma/<section>/` فيه `schema.prisma` مع generator output إلى `apps/api/generated/<section>`
4. أضف model أولي إن لزم (أو أبقِ `SectionMeta` كـ placeholder)

## 2) Prisma Client في NestJS
1. في `apps/api/src/database/database.module.ts`:
   - استورد `PrismaClient as <Section>Client`
   - أنشئ `Prisma<Section>Service extends <Section>Client`
   - سجّله في `providers` و `exports`
2. أضف أمر `prisma generate` للسكيمة في `apps/api/package.json` → `prisma:generate`

## 3) Module الأعمال — مجلد باسم القسم فقط

أنشئ مجلداً مستقلاً:

```text
apps/api/src/modules/<section>/
  <section>.module.ts
  controller/
    <feature>.controller.ts
  service/
    <feature>.service.ts
  dto/
    create-<feature>.dto.ts
    update-<feature>.dto.ts
```

مثال لقسم البث:

```text
modules/live/
  live.module.ts
  controller/channels.controller.ts
  controller/matches.controller.ts
  service/channels.service.ts
  service/matches.service.ts
  dto/create-channel.dto.ts
  dto/update-match.dto.ts
```

قواعد:
- حقن `Prisma<Section>Service` فقط داخل حدود القسم
- لا تستعلم من Prisma قسم آخر مباشرة
- للربط بقسم آخر: استدعِ Service ذلك القسم أو اقرأ بالمعرّف UUID
- اكتب `AuditService.log(...)` لكل إنشاء/تعديل/حذف مهم
- **لا** تضع كل الـ features في ملف `live.service.ts` واحد

## 4) الصلاحيات
1. أضف رموزاً جديدة في `packages/shared/src/permissions.ts`
2. ابنِ الحزمة: `pnpm --filter @isp/shared build`
3. استخدم `@RequirePermissions(...)` على الـ endpoints
4. الـ seed يمنح كل `ALL_PERMISSIONS` لـ `super_admin` تلقائياً

## 5) الواجهة — مجلد باسم القسم

```text
apps/admin-web/src/app/(admin)/<section>/page.tsx
apps/admin-web/src/features/<section>/
  components/
  hooks/
  api.ts
  types.ts
```

1. أضف رابطاً في التخطيط الجانبي
2. اجعل `page.tsx` خفيفاً — المنطق في `features/<section>/`
3. استدعِ REST عبر طبقة `features/<section>/api.ts` (وليس تكديساً في الصفحة)

## 6) التسجيل
1. استورد الـ module في `AppModule`
2. وثّق الـ endpoints بـ Swagger decorators
3. حدّث جدول الأقسام في `docs/ARCHITECTURE.md`

## مثال حدود عابرة للأقسام
المستخدم موجود في `db_core`. بلاغ صيانة في `db_maintenance` يخزّن `reporterUserId` كنص/UUID **بدون** FK:

```ts
// modules/maintenance/service/tickets.service.ts
await this.prismaMaintenance.ticket.create({
  data: {
    reporterUserId: actorId, // UUID من db_core — بدون relation Prisma عبر DB
    title: dto.title,
  },
});
```

لعرض اسم المبلّغ: اجلب المستخدم من خدمة الفريق/`PrismaCoreService` داخل طبقة الخدمة، لا عبر JOIN بين قواعد.
