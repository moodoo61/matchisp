# Asterisk — قسم الاتصال

PBX محلي يُدار من منصة Match عبر AMI وملفات PJSIP، مع هاتف WebRTC عام على `/call`.

## التثبيت (مرة واحدة)

```bash
# من شجرة المصدر
cd /opt/asterisk
./configure --with-pjproject-bundled --with-jansson-bundled
make -j$(nproc)
make install
make samples

# إعدادات Match + خدمة systemd
sudo bash /opt/match/infra/scripts/install-asterisk-service.sh --enable --start
```

تأكد أن جدول `cdr` موجود في `db_comms` (ترحيل Prisma لقسم comms) قبل الاعتماد على `cdr_pgsql`.

## التحقق

```bash
systemctl status asterisk
asterisk -rx 'core show version'
asterisk -rx 'pjsip show transports'
asterisk -rx 'http show status'
asterisk -rx 'manager show settings'
```

يُفترض ظهور `transport-ws` (8088) و `transport-wss` (8089).

## متغيرات البيئة (`.env`)

| متغير | افتراضي | معنى |
|--------|---------|------|
| `ASTERISK_AMI_HOST` | `127.0.0.1` | مضيف AMI |
| `ASTERISK_AMI_PORT` | `5038` | منفذ AMI |
| `ASTERISK_AMI_USER` | `match` | مستخدم AMI |
| `ASTERISK_AMI_SECRET` | — | سر AMI (مطلوب) |
| `ASTERISK_CONFIG_DIR` | `/etc/asterisk` | مجلد الإعدادات |
| `NEXT_PUBLIC_ASTERISK_WSS_URL` | `ws://<host>:8088/ws` | إشارة SIP.js (صفحة `/call`) |
| `NEXT_PUBLIC_ASTERISK_SIP_DOMAIN` | hostname الصفحة | نطاق SIP للأرقام |

للصفحات عبر HTTPS افتح `https://HOST/call`؛ الإشارة تكون `wss://HOST/ws` عبر nginx (لا حاجة لقبول تحذير شهادة بعد Let's Encrypt).

## ملفات تُدار من المنصة

- `/etc/asterisk/pjsip_match_extensions.conf` — endpoints للأرقام
- `/etc/asterisk/extensions_match_hints.conf` — تلميحات الحالة

لا تعدّلهما يدوياً؛ تُعاد كتابتهما عند إنشاء/تعديل/حذف رقم من الواجهة.

## صفحة `/call` — اتصال صوتي بين طرفين

> **مهم:** المتصفح يمنع الميكروفون على `http://` لمضيف غير localhost.
> استخدم **HTTPS** (مثلاً عبر nginx في `infra/nginx/match-call.conf`).

1. من لوحة التحكم → **الاتصال**: أنشئ رقمين (مثلاً `1001` و `1002`) مع كلمات مرور.
2. الطرف أ يفتح `https://mo.zerolag.live/call` (أو نطاقك) ويسجّل بـ `1001` + كلمة مروره.
3. الطرف ب يفتح نفس الصفحة (نافذة/جهاز آخر) ويسجّل بـ `1002`.
4. أحدهما يطلب رقم الآخر من لوحة الأرقام ثم «اتصال».
5. يظهر رنين عند المستقبِل → قبول → مكالمة صوتية (كتم / إنهاء متاحان).

بعد أول تسجيل ناجح تُحفظ بيانات الخط في `localStorage` ويُعاد التسجيل تلقائياً عند تحديث الصفحة. «إلغاء التسجيل» يمسح الحفظ.

### تفعيل HTTPS (nginx + Let's Encrypt)

```bash
# إيقاف مؤقت لأي خدمة على :80 (مثل MistServer) ثم:
sudo certbot certonly --standalone -d mo.zerolag.live
# أعد تشغيل الخدمة التي كانت على :80 إن لزم

sudo cp /opt/match/infra/nginx/match-call.conf /etc/nginx/conf.d/
# conf يشير إلى:
#   /etc/letsencrypt/live/mo.zerolag.live/fullchain.pem
#   /etc/letsencrypt/live/mo.zerolag.live/privkey.pem
sudo nginx -t && sudo systemctl reload nginx
```

الصفحة: `https://HOST/call` — إشارة SIP عبر `wss://HOST/ws` (بروكسي إلى Asterisk `:8088/ws`).

المنافذ: `443/tcp` (+ `10000–20000/udp` لـ RTP).

> إن قُطعت المكالمة بعد الرنين: تأكد أن قالب الـ endpoint لا يضع `transport=` بقائمة مفصولة بفواصل، وأن `qualify_frequency=0` لـ WebSocket خلف البروكسي.
