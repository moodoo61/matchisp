# تنظيم الكود — ممنوع التكديس

قاعدة ثابتة في المشروع: **كل قسم له مجلد باسمه**، وداخل المجلد تُقسَّم الملفات **حسب الدور/المهمة** وليس حسب حجم الملف أو الراحة اللحظية.

## 1) مجلد لكل قسم (إلزامي)

| الطبقة | المسار |
| --- | --- |
| Backend module | `apps/api/src/modules/<section>/` |
| Prisma schema | `prisma/<section>/` |
| Prisma client المولَّد | `apps/api/generated/<section>/` |
| Frontend pages | `apps/admin-web/src/app/(admin)/<section>/` |
| Frontend feature UI | `apps/admin-web/src/features/<section>/` |

أمثلة أسماء الأقسام: `team`, `roles`, `audit`, `live`, `magazine`, `maintenance`, `partners`, `inventory`, `orders`, `support`, `expenses`, `network_pages`.

**ممنوع:**
- وضع منطق قسمين في نفس الملف أو نفس المجلد
- ملفات عملاقة تجمع Controllers + Services + DTOs + Helpers معاً
- `utils.ts` / `helpers.ts` عامة بلا مسؤولية واضحة داخل القسم

## 2) تقسيم الملفات حسب الدور (Backend)

داخل `apps/api/src/modules/<section>/`:

```text
<section>/
  <section>.module.ts          # تجميع واعتماديات القسم فقط
  controllers/
    <feature>.controller.ts    # HTTP فقط — بدون منطق أعمال
  service/
    <feature>.service.ts       # منطق أعمال لمهمة واحدة
  dto/
    create-<feature>.dto.ts
    update-<feature>.dto.ts
    query-<feature>.dto.ts
  types/                       # أنواع خاصة بالقسم عند الحاجة
  constants/                   # ثوابت القسم
  index.ts                     # تصدير عام اختياري
```

قواعد التسمية:
- ملف واحد ≈ مسؤولية واحدة (Controller أو Service أو DTO أو نوع)
- إذا تجاوز الملف حدود مهمة واضحة → قسّمه فوراً (مثلاً `channels.service.ts` و `matches.service.ts` داخل `live/`)
- لا تضع منطق قسم في `common/` إلا إذا كان مشتركاً فعلاً بين أقسام متعددة

## 3) تقسيم الملفات حسب الدور (Frontend)

```text
apps/admin-web/src/
  app/(admin)/<section>/
    page.tsx                   # صفحة المسار فقط (تركيب خفيف)
  features/<section>/
    components/                # مكونات UI خاصة بالقسم
    hooks/                     # hooks للقسم
    api.ts                     # استدعاءات REST لهذا القسم
    types.ts                   # أنواع العرض إن لزم
```

**ممنوع:** حشو كل منطق القسم داخل `page.tsx`.

## 4) متى يُسمح بملف مشترك؟

فقط في:
- `packages/shared` — صلاحيات وأنواع عابرة للأقسام
- `apps/api/src/common` — Guards/decorators عامة
- `apps/admin-web/src/components` — مكونات تخطيط عامة (Shell، أزرار، جداول عامة)

أي منطق أعمال لقسم معيّن يبقى داخل مجلد ذلك القسم.

## 5) قائمة تحقق قبل الدمج

- [ ] هل للقسم مجلد مستقل في API و Prisma و (عند الحاجة) Frontend؟
- [ ] هل كل ملف له دور واحد واضح من اسمه؟
- [ ] هل يمكن فهم المسؤولية من اسم الملف دون فتحه؟
- [ ] هل تجنّبنا تكديس مهام غير مترابطة في ملف واحد؟
