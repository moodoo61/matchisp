# متطلبات تشغيل المشروع

ما يجب تثبيته على السيرفر قبل `pnpm install` وتشغيل ISP Admin.

> أنظمة مدعومة: **Linux** (Debian / Ubuntu مفضّل). التشغيل الأصلي (Native) هو الافتراضي.

---

## 1) أساسيات التشغيل (إلزامي)

| المتطلب | الإصدار | الغرض |
| --- | --- | --- |
| Node.js | **22+** | تشغيل API والواجهة |
| pnpm | **9+** (المثبت في المشروع: 9.15.0) | إدارة حزم الـ monorepo |
| PostgreSQL | **16+** | قواعد بيانات الأقسام |
| Redis | **7+** | الجلسات / الطوابير |
| Git | أي حديث | سحب المستودع |

### تثبيت سريع (Ubuntu / Debian)

```bash
# أدوات أساسية
sudo apt update
sudo apt install -y curl ca-certificates gnupg git build-essential

# Node.js 22 (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# pnpm
sudo npm install -g pnpm@9

# PostgreSQL 16
sudo apt install -y postgresql postgresql-contrib

# Redis
sudo apt install -y redis-server

# تفعيل الخدمات
sudo systemctl enable --now postgresql redis-server
```

تحقق:

```bash
node -v          # v22.x
pnpm -v          # 9.x
psql --version   # 16.x
redis-cli ping   # PONG
```

---

## 2) حزم نظام لميزات اللوحة (مستحسن)

بدونها تعمل النواة (مصادقة / RBAC)، لكن أقسام **الأقراص / الشبكة / النسخ الاحتياطي / البث** تتأثر.

| الحزمة | أمر النظام | القسم |
| --- | --- | --- |
| `iproute2` | `ip`, `lsblk`, `df`, `mount`, `umount` | الشبكة + الأقراص |
| `network-manager` | `nmcli` | استمرارية منافذ/عنونة/مسارات الشبكة |
| `systemd` / `systemd-resolved` | `resolvectl` | DNS |
| `smartmontools` | `smartctl` | صحة الأقراص (SMART) |
| `postgresql-client` | `pg_dump`, `pg_restore`, `psql` | نسخ/استعادة قواعد الأقسام |
| `ffmpeg` | `ffmpeg`, `ffprobe` | الترميز / البث |
| `v4l-utils` | `v4l2-ctl` | أجهزة HDMI / كاميرا |
| `sstp-client` | `sstpc` | عميل SSTP (MikroTik وغيرها) |
| `ppp` | `pppd` | طبقة PPP لاتصال SSTP |
| `openssl` + `build-essential` | بناء `libssl_cipher_preload.so` | توافق تشفير MikroTik |

```bash
sudo apt install -y \
  iproute2 \
  network-manager \
  smartmontools \
  postgresql-client \
  ffmpeg \
  v4l-utils \
  sstp-client \
  ppp \
  openssl \
  build-essential
```

سكربت التثبيت يبني أيضاً ملفات SSTP تحت `var/sstp/` (OpenSSL conf + مكتبة LD_PRELOAD).

> قسم الشبكة يكتب إعدادات دائمة عبر NetworkManager (`nmcli`) حتى تبقى المنافذ والعناوين بعد إعادة التشغيل. أوامر مثل `nmcli` / `mount` / `sstpc` قد تحتاج صلاحيات root للعملية التي تشغّل الـ API.
>
> على الإنتاج: تأكد أن `NetworkManager` نشط وأن المنافذ المراد إدارتها ليست `unmanaged` بالكامل من جهة أخرى (مثل `systemd-networkd`/`netplan` دون تسليمها لـ NM).
>
> يُستحسن تثبيت إطار الشبكة المستقل [`match-network` + `match-sstp`](./MATCH_NETWORK_SERVICE.md) لمنافذ NM ونفق SSTP عند الإقلاع دون الاعتماد على تشغيل المشروع:
> `sudo bash infra/scripts/install-match-network-service.sh --enable --start`

### SSTP (الإعدادات ← الشبكة ← SSTP)

| العنصر | التفاصيل |
| --- | --- |
| الحزم | `sstp-client` + `ppp` |
| الملفات | `var/sstp/openssl-sstp.cnf` و `var/sstp/libssl_cipher_preload.so` |
| MikroTik | `certificate` يجب أن يكون معيّناً (ليس `none`) في `/interface sstp-server server` |
| الافتراضي | **اتصال تلقائي عند تشغيل الـ API** + إعادة محاولة كل ~30 ثانية إذا انقطع |
| إيقاف إعادة الاتصال | عطّل خيار «اتصال تلقائي» من الواجهة ثم افصل |

بعد تثبيت الحزم على خادم جديد:

```bash
sudo bash infra/scripts/install-system-deps.sh
# أو يدوياً بناء المكتبة:
cc -shared -fPIC -O2 -o var/sstp/libssl_cipher_preload.so \
  apps/api/src/modules/network/sstp/native/ssl_cipher_preload.c -ldl
```

---

## 3) اختياري

| المتطلب | متى تحتاجه |
| --- | --- |
| **Docker + Compose** | عزل Postgres/Redis/MinIO بدل التثبيت المحلي — انظر `infra/docker/docker-compose.yml` |
| **MinIO** | تخزين ملفات S3-compatible (مذكور في `.env.example`) |
| **MistServer** | بث مباشر حي (متغيرات `MISTSERVER_*`) |
| **NVIDIA + سكربتات ABR** | ترميز GPU للبث (`LIVE_ABR_*` في `.env`) |
| **Caddy / Nginx** | بروكسي عكسي في الإنتاج |

Docker (إن رغبت):

```bash
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"   # ثم أعد تسجيل الدخول
```

---

## 4) حزم المشروع (Node)

بعد تثبيت الأساسيات أعلاه:

```bash
cd /opt/match
cp .env.example .env   # عدّل الأسرار والعناوين
pnpm install           # يقرأ package.json لكل التطبيقات
pnpm --filter @isp/shared build
```

لا يوجد `requirements.txt` منفصل للـ Node — الاعتماديات معرفة في:

- `package.json` (الجذر)
- `apps/api/package.json`
- `apps/admin-web/package.json`
- `packages/shared/package.json`

وقفل الإصدارات عبر `pnpm-lock.yaml`.

---

## 5) قواعد PostgreSQL للمشروع

مرة واحدة بعد تثبيت Postgres:

```bash
bash infra/scripts/bootstrap-db.sh
# أو يدوياً:
# bash infra/docker/postgres/init-local.sh
# pnpm --filter @isp/api prisma:generate && pnpm --filter @isp/api prisma:migrate && pnpm db:seed
```

ثم التشغيل: `./dev.sh` — إن غاب جدول `users` يُكمِل التهيئة تلقائياً. التفاصيل في [README](../README.md).

> خطأ `The table public.users does not exist` = لم تُنفَّذ الترحيلات؛ شغّل `bootstrap-db.sh` ثم أعد تشغيل الخدمة.

خدمة تطوير مؤقتة على خادم آخر: [TSETISP_SERVICE.md](./TSETISP_SERVICE.md) (`tsetisp` عبر `dev.sh`).

---

## 6) ملخص فحص قبل التشغيل

```bash
node -v && pnpm -v && psql --version && redis-cli ping
command -v ip lsblk smartctl pg_dump ffmpeg resolvectl
test -f /opt/match/.env && echo ".env موجود"
```

إذا فشلت خطوة: ثبّت الحزمة الناقصة من الجداول أعلاه ثم أعد المحاولة.
