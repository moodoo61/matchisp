#!/usr/bin/env bash
# تثبيت خدمة systemd مؤقتة للتطوير: tsetisp (تشغّل ./dev.sh)
#
# لا تشغّل هذا على خادم الإنتاج أو الخادم الحالي إلا إن قصدت ذلك.
# الاستخدام على الخادم الهدف:
#   sudo bash infra/scripts/install-tsetisp-service.sh
#   sudo bash infra/scripts/install-tsetisp-service.sh --root /opt/match --user ubuntu
#   sudo bash infra/scripts/install-tsetisp-service.sh --enable --start
#
# أوامر لاحقاً:
#   sudo systemctl status tsetisp
#   sudo systemctl start|stop|restart tsetisp
#   journalctl -u tsetisp -f
#   sudo bash infra/scripts/install-tsetisp-service.sh --uninstall
set -euo pipefail

SERVICE_NAME="tsetisp"
UNIT_DEST="/etc/systemd/system/${SERVICE_NAME}.service"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_HINT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
UNIT_SRC="${REPO_HINT}/infra/systemd/tsetisp.service"

ROOT="${MATCH_ROOT:-$REPO_HINT}"
RUN_USER="${SUDO_USER:-${USER:-root}}"
RUN_GROUP=""
DO_ENABLE=0
DO_START=0
DO_UNINSTALL=0

usage() {
  sed -n '2,18p' "$0"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --root)
      ROOT="${2:?}"
      shift 2
      ;;
    --user)
      RUN_USER="${2:?}"
      shift 2
      ;;
    --group)
      RUN_GROUP="${2:?}"
      shift 2
      ;;
    --enable)
      DO_ENABLE=1
      shift
      ;;
    --start)
      DO_START=1
      shift
      ;;
    --uninstall)
      DO_UNINSTALL=1
      shift
      ;;
    -h|--help|help)
      usage
      exit 0
      ;;
    *)
      echo "خيار غير معروف: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ "${EUID}" -ne 0 ]]; then
  echo "شغّل السكربت بصلاحية root: sudo bash $0" >&2
  exit 1
fi

if [[ -z "$RUN_GROUP" ]]; then
  RUN_GROUP="$(id -gn "$RUN_USER" 2>/dev/null || echo "$RUN_USER")"
fi

uninstall() {
  systemctl stop "$SERVICE_NAME" 2>/dev/null || true
  systemctl disable "$SERVICE_NAME" 2>/dev/null || true
  rm -f "$UNIT_DEST"
  systemctl daemon-reload
  echo "أُزيلت الخدمة ${SERVICE_NAME}."
}

if [[ "$DO_UNINSTALL" -eq 1 ]]; then
  uninstall
  exit 0
fi

if [[ ! -f "$UNIT_SRC" ]]; then
  echo "ملف الوحدة غير موجود: $UNIT_SRC" >&2
  exit 1
fi

if [[ ! -x "${ROOT}/dev.sh" ]]; then
  echo "dev.sh غير موجود أو غير قابل للتنفيذ: ${ROOT}/dev.sh" >&2
  exit 1
fi

if [[ ! -f "${ROOT}/.env" ]]; then
  echo "تحذير: لا يوجد ${ROOT}/.env — انسخ .env.example قبل التشغيل." >&2
fi

# حل مسار pnpm/node للمستخدم إن وُجدا خارج PATH الافتراضي
EXTRA_PATH=""
USER_HOME="$(getent passwd "$RUN_USER" | cut -d: -f6 || true)"
if [[ -n "$USER_HOME" ]]; then
  for d in \
    "${USER_HOME}/.local/share/pnpm" \
    "${USER_HOME}/.local/bin" \
    "${USER_HOME}/.nvm/versions/node" \
    /usr/local/bin; do
    [[ -d "$d" ]] || continue
    EXTRA_PATH="${EXTRA_PATH}:${d}"
  done
  # أحدث nvm node bin إن وُجد
  if [[ -d "${USER_HOME}/.nvm/versions/node" ]]; then
    latest_nvm="$(ls -1d "${USER_HOME}/.nvm/versions/node"/v* 2>/dev/null | sort -V | tail -1 || true)"
    if [[ -n "$latest_nvm" && -d "${latest_nvm}/bin" ]]; then
      EXTRA_PATH="${EXTRA_PATH}:${latest_nvm}/bin"
    fi
  fi
fi

BASE_PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
FULL_PATH="${BASE_PATH}${EXTRA_PATH}"

tmp="$(mktemp)"
sed \
  -e "s|WorkingDirectory=/opt/match|WorkingDirectory=${ROOT}|g" \
  -e "s|ExecStart=/opt/match/dev.sh start|ExecStart=${ROOT}/dev.sh start|g" \
  -e "s|ExecStop=/opt/match/dev.sh stop|ExecStop=${ROOT}/dev.sh stop|g" \
  -e "s|^User=root|User=${RUN_USER}|g" \
  -e "s|^Group=root|Group=${RUN_GROUP}|g" \
  -e "s|^Environment=PATH=.*|Environment=PATH=${FULL_PATH}|g" \
  "$UNIT_SRC" >"$tmp"

install -m 0644 "$tmp" "$UNIT_DEST"
rm -f "$tmp"

systemctl daemon-reload

echo "ثُبّتت الوحدة: ${UNIT_DEST}"
echo "  Root : ${ROOT}"
echo "  User : ${RUN_USER}:${RUN_GROUP}"
echo

if [[ "$DO_ENABLE" -eq 1 ]]; then
  systemctl enable "$SERVICE_NAME"
  echo "تم التفعيل عند الإقلاع (enable)."
fi

if [[ "$DO_START" -eq 1 ]]; then
  systemctl restart "$SERVICE_NAME"
  systemctl --no-pager --full status "$SERVICE_NAME" || true
  echo
  echo "السجلات: journalctl -u ${SERVICE_NAME} -f"
else
  echo "لم تُشغَّل الخدمة بعد. على الخادم الهدف:"
  echo "  sudo systemctl enable --now ${SERVICE_NAME}"
  echo "  أو أعد التثبيت مع: --enable --start"
fi
