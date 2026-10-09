# إطار شبكة Match المستقل

وحدات systemd **منفصلة عن التطبيق** (`tsetisp` / Node) لضمان الشبكة بعد الإقلاع.

| الوحدة | الملف | الدور |
| --- | --- | --- |
| `match-network` | [`match-network.service`](../infra/systemd/match-network.service) | NetworkManager + اتصالات `match-*` |
| `match-sstp` | [`match-sstp.service`](../infra/systemd/match-sstp.service) | حارس SSTP من `var/sstp/boot.env` |
| التثبيت | [`install-match-network-service.sh`](../infra/scripts/install-match-network-service.sh) | تثبّت الوحدتين معاً |

## لماذا إطار مستقل؟

- المنافذ/العناوين/DNS تُحفظ في NetworkManager.
- SSTP يُعاد تشغيله عبر `sstpc` دون انتظار API أو Postgres (بعد أن تحفظ اللوحة `boot.env`).
- عند فشل المشروع تبقى الطبقة الشبكية قابلة للعمل.

## التثبيت

```bash
cd /opt/match
sudo apt install -y network-manager sstp-client ppp
sudo systemctl enable --now NetworkManager

sudo bash infra/scripts/install-match-network-service.sh \
  --root /opt/match \
  --enable --start
```

ثم من الواجهة: **الإعدادات ← الشبكة ← SSTP** — احفظ الإعدادات (أو فعّل الاتصال مرة) ليُكتب:

`/opt/match/var/sstp/boot.env` (صلاحيات `0600`)

بدون هذا الملف لن يحاول `match-sstp` الاتصال.

## أوامر

```bash
sudo systemctl status match-network match-sstp
sudo systemctl restart match-network match-sstp
journalctl -u match-network -u match-sstp -f
ls -la /opt/match/var/sstp/
nmcli connection show
```

## ماذا تفعل كل وحدة؟

### `match-network` (oneshot)
1. تشغيل NetworkManager وإعادة تحميل الإعدادات.
2. تفعيل اتصالات `match-*` ذات `autoconnect=yes`.

### `match-sstp` (simple + Restart)
1. يقرأ `var/sstp/boot.env`.
2. إن `AUTO_CONNECT=1` وبيانات الدخول موجودة وليس `sstpc` شغّالاً → يشغّله.
3. يعيد المحاولة كل 30 ثانية تقريباً.

ضبط الواجهة يبقى عبر API؛ هذه الخدمات **تطبّق/تحرس** ما حُفظ.

## الإزالة

```bash
sudo bash infra/scripts/install-match-network-service.sh --uninstall
```

## العلاقة مع `tsetisp`

| الخدمة | تعتمد على | الدور |
| --- | --- | --- |
| `NetworkManager` | النظام | محرّك الشبكة |
| `match-network` | NM | منافذ `match-*` |
| `match-sstp` | الشبكة + `boot.env` + `sstpc` | نفق SSTP |
| `tsetisp` | الشبكة + DB… | لوحة التطوير |

`tsetisp` يمكنه أيضاً إدارة SSTP؛ الحارسان يتشاركان ملف PID ويتجنبان تشغيل نسختين إن كانت العملية تعمل.
