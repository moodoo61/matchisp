# خدمة تطوير مؤقتة: `tsetisp`

ملف وحدة systemd يشغّل المشروع عبر [`dev.sh`](../dev.sh) كخدمة خلفية **مؤقتة لمرحلة التطوير فقط**.

| الملف | الغرض |
| --- | --- |
| [`infra/systemd/tsetisp.service`](../infra/systemd/tsetisp.service) | تعريف الخدمة |
| [`infra/scripts/install-tsetisp-service.sh`](../infra/scripts/install-tsetisp-service.sh) | نسخ الوحدة إلى `/etc/systemd/system` |

## على الخادم الهدف (ليس الإنتاج)

```bash
cd /opt/match
# تأكد من .env و pnpm install مسبقاً — راجع REQUIREMENTS.md
cp -n .env.example .env   # إن لزم، وعدّل IP/أسرار
pnpm install
pnpm --filter @isp/shared build
bash infra/scripts/bootstrap-db.sh

sudo bash infra/scripts/install-tsetisp-service.sh \
  --root /opt/match \
  --user "$USER" \
  --enable --start
```
بدون تشغيل فوري (تثبيت الملف فقط):

```bash
sudo bash infra/scripts/install-tsetisp-service.sh --root /opt/match --user "$USER"
sudo systemctl enable --now tsetisp
```

## أوامر يومية

```bash
sudo systemctl status tsetisp
sudo systemctl restart tsetisp
sudo systemctl stop tsetisp
journalctl -u tsetisp -f
```

## إزالة الخدمة

```bash
sudo bash infra/scripts/install-tsetisp-service.sh --uninstall
```

> هذه الخدمة تستدعي وضع التطوير (`pnpm … dev`) وليست بديلاً عن بناء الإنتاج (`pnpm build` + عملية `node`/`next start`).
