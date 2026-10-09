# ISP Admin — نظام إدارة مكتب خدمات إنترنت

تأسيس المرحلة **أ**: Modular Monolith + قاعدة بيانات مستقلة لكل قسم + RBAC + تدقيق + فريق + لوحة نظرة عامة.

## مرجع النهج (مهم)
- [المتطلبات والتثبيت](docs/REQUIREMENTS.md) — ما يجب تنزيله وتثبيته ليعمل المشروع
- [خطة المرحلة أ](docs/PHASE_A_PLAN.md) — النهج المعتمد داخل المشروع
- [المعمارية](docs/ARCHITECTURE.md)
- [تنظيم الكود](docs/CODING_ORGANIZATION.md) — مجلد لكل قسم + ملفات حسب الدور (ممنوع التكديس)
- [إضافة قسم جديد](docs/ADDING_A_MODULE.md)

## المتطلبات (تشغيل أصلي على السيرفر)
التفاصيل الكاملة وأوامر `apt` في **[docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)**.

ملخص سريع:
- Linux Server (الوضع الافتراضي)
- Node.js 22+ و pnpm 9+
- PostgreSQL 16+ و Redis 7+ مثبتان على السيرفر
- حزم نظام مستحسنة: `iproute2`, `network-manager`, `smartmontools`, `postgresql-client`, `ffmpeg`, …
- Docker اختياري فقط إن رغبت بعزل الخدمات

تثبيت حزم النظام دفعة واحدة (Ubuntu/Debian):

```bash
sudo bash infra/scripts/install-system-deps.sh
```

> السيرفر القوي عندكم يكفي للتشغيل المباشر (Native). Docker ليس شرطاً.

## المنافذ
| الخدمة | المنفذ |
| --- | --- |
| Admin Web | **4010** (تجنّب 3000 المحجوز لـ Grafana) |
| API | **3001** |
| PostgreSQL | 5432 |
| Redis | 6379 |

## تشغيل المشروع (الخلفي + الأمامي)

الطريقة المفضّلة في التطوير — سكربت واحد:

```bash
cd /opt/match
./dev.sh              # API + الواجهة معاً (watch)
./dev.sh api          # الخلفي فقط
./dev.sh web          # الأمامي فقط
./dev.sh stop         # إيقاف المنافذ
./dev.sh restart      # إيقاف ثم تشغيل
```

خدمة systemd مؤقتة للتطوير على خادم آخر (`tsetisp`): انظر [docs/TSETISP_SERVICE.md](docs/TSETISP_SERVICE.md) — **لا تُفعَّل هنا افتراضياً**.

| الخدمة | الأمر | الرابط |
| --- | --- | --- |
| خلفي + أمامي | `./dev.sh` | http://170.101.111.184:4010 |
| خلفي (API) | `./dev.sh api` | http://170.101.111.184:3001/api/docs |
| أمامي (Admin) | `./dev.sh web` | http://170.101.111.184:4010 |
| حساب أولي | — | `admin` / `Admin@12345` |

بدون السكربت (يدوياً):

```bash
cd /opt/match
set -a && source .env && set +a
pnpm --filter @isp/api dev          # طرفية 1 — منفذ 3001
pnpm --filter @isp/admin-web dev    # طرفية 2 — منفذ 4010
# أو معاً: pnpm dev
```

### إيقاف / إعادة تشغيل
```bash
./dev.sh stop
./dev.sh restart
./dev.sh api    # خلفي فقط
./dev.sh web    # أمامي فقط
```

### فحص سريع
```bash
curl -s http://127.0.0.1:3001/api/health
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4010/login
```

## الإعداد لأول مرة (مرة واحدة)

```bash
cd /opt/match
cp .env.example .env
pnpm install
pnpm --filter @isp/shared build

# قواعد + migrate + حساب المدير (أو يُستدعى تلقائياً من ./dev.sh إن غاب جدول users)
bash infra/scripts/bootstrap-db.sh
```

ثم انتقل لقسم **تشغيل المشروع** أعلاه.

## أوامر إضافية

### إعادة البناء الكاملة (بعد سحب تعديلات / تغيير Prisma / صلاحيات)
```bash
cd /opt/match
set -a && source .env && set +a

pnpm install
pnpm --filter @isp/shared build
pnpm --filter @isp/api prisma:generate
pnpm --filter @isp/api prisma:migrate
pnpm db:seed
# أو: bash infra/scripts/bootstrap-db.sh --force

rm -rf apps/admin-web/.next
pnpm --filter @isp/api build
pnpm --filter @isp/admin-web build
```

### قواعد البيانات / Prisma
```bash
pnpm --filter @isp/api prisma:generate
pnpm --filter @isp/api prisma:migrate
pnpm db:seed
```

## روابط API العامة لصفحات العملاء
| الغرض | المسار |
| --- | --- |
| إعلانات الصور | `GET /api/public/login/ads` |
| الشريط المتحرك | `GET /api/public/login/ticker` |
| أرقام التواصل | `GET /api/public/login/contacts` |
| الباقات | `GET /api/public/login/packages` |
| خدمات تسجيل الدخول | `GET /api/public/login/services` |
| خدمات صفحة الحالة | `GET /api/public/status/services` |

مثال كامل عبر البروكسي (نفس أصل الواجهة):  
`http://170.101.111.184:4010/api/public/login/ads`

## هيكل مختصر
```text
apps/api          NestJS — منفذ 3001
apps/admin-web    Next.js (RTL) — منفذ 4010
packages/shared   صلاحيات وأنواع
prisma/*          سكيمة لكل قاعدة
docs/             خطة + معمارية + تنظيم الكود
infra/            Docker اختياري + سكربتات Postgres
```
