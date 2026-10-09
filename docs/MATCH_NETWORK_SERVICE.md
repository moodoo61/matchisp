# خدمة الشبكة المستقلة: `match-network`

وحدة systemd **منفصلة عن التطبيق** تضمن أن NetworkManager جاهز وأن اتصالات `match-*`
(التي تكتبها لوحة الإدارة) تُفعَّل عند الإقلاع — حتى لو فشلت خدمة `tsetisp` أو مشروع Node.

| الملف | الغرض |
| --- | --- |
| [`infra/systemd/match-network.service`](../infra/systemd/match-network.service) | تعريف الخدمة (oneshot) |
| [`infra/scripts/match-network-ensure.sh`](../infra/scripts/match-network-ensure.sh) | منطق الضمان عبر `nmcli` |
| [`infra/scripts/install-match-network-service.sh`](../infra/scripts/install-match-network-service.sh) | التثبيت في `/etc/systemd/system` |

## لماذا خدمة مستقلة؟

- إعدادات المنافذ/العناوين/DNS تُحفظ في NetworkManager (ملفات اتصال)، وليس في عملية الـ API.
- عند فشل تشغيل المشروع أو غياب Node، تبقى الشبكة النظامية قابلة للإقلاع والتفعيل.
- `tsetisp` يعتمد على الشبكة؛ هذه الخدمة تعمل **قبله** ولا تعتمد عليه.

## التثبيت (على الخادم الهدف)

```bash
cd /opt/match
# تأكد من وجود network-manager
sudo apt install -y network-manager
sudo systemctl enable --now NetworkManager

sudo bash infra/scripts/install-match-network-service.sh \
  --root /opt/match \
  --enable --start
```

## أوامر يومية

```bash
sudo systemctl status match-network
sudo systemctl restart match-network
journalctl -u match-network -f
nmcli connection show
nmcli device status
```

## ماذا تفعل الخدمة؟

1. تتأكد أن `NetworkManager` يعمل.
2. تعيد تحميل إعدادات NM (بما فيها `99-match-managed-ifaces.conf`).
3. تفعّل اتصالات الاسم `match-*` ذات `autoconnect=yes`.

ضبط المنافذ من الواجهة يبقى عبر API؛ هذه الخدمة **تطبّق عند الإقلاع** ما حُفظ مسبقاً.

## الإزالة

```bash
sudo bash infra/scripts/install-match-network-service.sh --uninstall
```

## العلاقة مع `tsetisp`

| الخدمة | تعتمد على | الدور |
| --- | --- | --- |
| `NetworkManager` | النظام | محرّك الشبكة |
| `match-network` | NetworkManager فقط | ضمان اتصالات اللوحة بعد الإقلاع |
| `tsetisp` | الشبكة + Postgres/Redis… | تشغيل مشروع التطوير |

يُفضَّل تثبيت `match-network` قبل الاعتماد على واجهة الشبكة في اللوحة.
