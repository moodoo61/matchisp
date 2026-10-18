#!/usr/bin/env bash
# تثبيت إعدادات Asterisk + خدمة systemd لقسم الاتصال في Match
#
# الاستخدام:
#   sudo bash infra/scripts/install-asterisk-service.sh
#   sudo bash infra/scripts/install-asterisk-service.sh --enable --start
#   sudo bash infra/scripts/install-asterisk-service.sh --uninstall
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "${SCRIPT_DIR}/../.." && pwd)"
CFG_SRC="${REPO}/infra/asterisk/configs"
UNIT_SRC="${REPO}/infra/systemd/asterisk.service"
UNIT_DEST="/etc/systemd/system/asterisk.service"
ETC="/etc/asterisk"

DO_ENABLE=0
DO_START=0
DO_UNINSTALL=0

usage() { sed -n '2,10p' "$0"; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --enable) DO_ENABLE=1; shift ;;
    --start) DO_START=1; shift ;;
    --uninstall) DO_UNINSTALL=1; shift ;;
    -h|--help|help) usage; exit 0 ;;
    *) echo "خيار غير معروف: $1" >&2; exit 1 ;;
  esac
done

if [[ "${EUID}" -ne 0 ]]; then
  echo "شغّل بصلاحية root" >&2
  exit 1
fi

if [[ "$DO_UNINSTALL" -eq 1 ]]; then
  systemctl disable --now asterisk.service 2>/dev/null || true
  rm -f "$UNIT_DEST"
  systemctl daemon-reload
  echo "أُزيلت خدمة asterisk (ملفات /etc/asterisk لم تُحذف)"
  exit 0
fi

if [[ ! -x /usr/sbin/asterisk ]]; then
  echo "خطأ: /usr/sbin/asterisk غير موجود — ابنِ وثبّت Asterisk أولاً من /opt/asterisk" >&2
  exit 1
fi

# مستخدم النظام
if ! id asterisk >/dev/null 2>&1; then
  useradd --system --home /var/lib/asterisk --shell /usr/sbin/nologin asterisk
fi

mkdir -p /var/lib/asterisk /var/spool/asterisk /var/log/asterisk /var/run/asterisk "$ETC"

# عيّنات افتراضية إن كان المجلد شبه فارغ
if [[ ! -f "$ETC/features.conf" ]] && [[ -d /opt/asterisk ]]; then
  echo "تثبيت عيّنات Asterisk (make samples)…"
  make -C /opt/asterisk samples >/dev/null || true
fi

# stubs لملفات اختيارية تتوقعها بعض الوحدات
for stub in pjsip_wizard.conf pjproject.conf; do
  [[ -f "$ETC/$stub" ]] || touch "$ETC/$stub"
done

# تحميل أسرار من .env إن وُجد
AMI_SECRET="match_ami_secret"
PGHOST="127.0.0.1"
PGPORT="5432"
PGUSER="isp"
PGPASSWORD="isp_secret"
PGDB="db_comms"
if [[ -f "${REPO}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${REPO}/.env"
  set +a
  AMI_SECRET="${ASTERISK_AMI_SECRET:-$AMI_SECRET}"
  PGHOST="${POSTGRES_HOST:-$PGHOST}"
  PGPORT="${POSTGRES_PORT:-$PGPORT}"
  PGUSER="${POSTGRES_USER:-$PGUSER}"
  PGPASSWORD="${POSTGRES_PASSWORD:-$PGPASSWORD}"
fi

install -m 640 -o root -g asterisk "${CFG_SRC}/asterisk.conf" "$ETC/asterisk.conf"
install -m 640 -o root -g asterisk "${CFG_SRC}/modules.conf" "$ETC/modules.conf"
install -m 640 -o root -g asterisk "${CFG_SRC}/pjsip.conf" "$ETC/pjsip.conf"
install -m 640 -o root -g asterisk "${CFG_SRC}/extensions.conf" "$ETC/extensions.conf"
install -m 640 -o root -g asterisk "${CFG_SRC}/cdr.conf" "$ETC/cdr.conf"
install -m 640 -o root -g asterisk "${CFG_SRC}/rtp.conf" "$ETC/rtp.conf"
install -m 640 -o root -g asterisk "${CFG_SRC}/logger.conf" "$ETC/logger.conf"
install -m 640 -o root -g asterisk "${CFG_SRC}/http.conf" "$ETC/http.conf"

# شهادات WSS (إن وُجدت في المستودع أو تُولَّد)
KEYS_SRC="${REPO}/infra/asterisk/keys"
mkdir -p "$ETC/keys"
if [[ -f "${KEYS_SRC}/asterisk.crt" && -f "${KEYS_SRC}/asterisk.key" ]]; then
  install -m 640 -o asterisk -g asterisk "${KEYS_SRC}/asterisk.crt" "$ETC/keys/asterisk.crt"
  install -m 640 -o asterisk -g asterisk "${KEYS_SRC}/asterisk.key" "$ETC/keys/asterisk.key"
elif [[ ! -f "$ETC/keys/asterisk.crt" ]]; then
  HOST_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
  openssl req -x509 -nodes -newkey rsa:2048 \
    -keyout "$ETC/keys/asterisk.key" \
    -out "$ETC/keys/asterisk.crt" \
    -days 3650 \
    -subj "/CN=${HOST_IP:-localhost}/O=Match" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1${HOST_IP:+,IP:${HOST_IP}}" >/dev/null 2>&1 || true
  chown asterisk:asterisk "$ETC/keys/asterisk.crt" "$ETC/keys/asterisk.key"
  chmod 640 "$ETC/keys/asterisk.crt" "$ETC/keys/asterisk.key"
fi

# ملفات تُدار من المنصة — لا تُستبدل إن وُجدت
if [[ ! -f "$ETC/pjsip_match_extensions.conf" ]]; then
  install -m 640 -o root -g asterisk "${CFG_SRC}/pjsip_match_extensions.conf" "$ETC/pjsip_match_extensions.conf"
fi
if [[ ! -f "$ETC/extensions_match_hints.conf" ]]; then
  install -m 640 -o root -g asterisk "${CFG_SRC}/extensions_match_hints.conf" "$ETC/extensions_match_hints.conf"
fi

# manager.conf مع السر
sed "s/CHANGE_ME_AMI_SECRET/${AMI_SECRET//\//\\/}/g" "${CFG_SRC}/manager.conf" \
  | install -m 640 -o root -g asterisk /dev/stdin "$ETC/manager.conf"

# cdr_pgsql
sed \
  -e "s/^hostname=.*/hostname=${PGHOST}/" \
  -e "s/^port=.*/port=${PGPORT}/" \
  -e "s/^dbname=.*/dbname=${PGDB}/" \
  -e "s/^user=.*/user=${PGUSER}/" \
  -e "s/^password=.*/password=${PGPASSWORD}/" \
  "${CFG_SRC}/cdr_pgsql.conf" \
  | install -m 640 -o root -g asterisk /dev/stdin "$ETC/cdr_pgsql.conf"

# صلاحيات الكتابة للمنصة على ملفات المزامنة
chown -R asterisk:asterisk /var/lib/asterisk /var/spool/asterisk /var/log/asterisk /var/run/asterisk
chown root:asterisk "$ETC"/*.conf
chmod 640 "$ETC"/*.conf
# اسمح لمجموعة asterisk (والـ API إن كان في نفس المجموعة أو root) بالكتابة
chown asterisk:asterisk "$ETC/pjsip_match_extensions.conf" "$ETC/extensions_match_hints.conf"
chmod 660 "$ETC/pjsip_match_extensions.conf" "$ETC/extensions_match_hints.conf"

install -m 644 "$UNIT_SRC" "$UNIT_DEST"
systemctl daemon-reload

if [[ "$DO_ENABLE" -eq 1 ]]; then
  systemctl enable asterisk.service
fi
if [[ "$DO_START" -eq 1 ]]; then
  systemctl restart asterisk.service
  sleep 2
  systemctl --no-pager --full status asterisk.service || true
  /usr/sbin/asterisk -rx 'core show version' || true
fi

echo "تم تثبيت وحدة asterisk.service"
echo "  AMI: 127.0.0.1:5038 user=match"
echo "  فعّل: systemctl enable --now asterisk"
