#!/usr/bin/env bash
# تثبيت خدمة systemd مستقلة لضمان شبكة NetworkManager (match-network).
# لا تعتمد على تشغيل مشروع ISP Admin / tsetisp.
#
# الاستخدام:
#   sudo bash infra/scripts/install-match-network-service.sh
#   sudo bash infra/scripts/install-match-network-service.sh --root /opt/match --enable --start
#   sudo bash infra/scripts/install-match-network-service.sh --uninstall
#
# أوامر لاحقاً:
#   sudo systemctl status match-network
#   sudo systemctl start|restart match-network
#   journalctl -u match-network -f
set -euo pipefail

SERVICE_NAME="match-network"
UNIT_DEST="/etc/systemd/system/${SERVICE_NAME}.service"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_HINT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
UNIT_SRC="${REPO_HINT}/infra/systemd/match-network.service"
ENSURE_SRC="${REPO_HINT}/infra/scripts/match-network-ensure.sh"

ROOT="${MATCH_ROOT:-$REPO_HINT}"
DO_ENABLE=0
DO_START=0
DO_UNINSTALL=0

usage() {
  sed -n '2,16p' "$0"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --root)
      ROOT="${2:?}"
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

ENSURE_PATH="${ROOT}/infra/scripts/match-network-ensure.sh"
UNIT_FILE="${ROOT}/infra/systemd/match-network.service"

if [[ ! -f "$UNIT_FILE" ]]; then
  echo "ملف الوحدة غير موجود: $UNIT_FILE" >&2
  exit 1
fi

if [[ ! -f "$ENSURE_PATH" ]]; then
  echo "سكربت الضمان غير موجود: $ENSURE_PATH" >&2
  exit 1
fi

chmod +x "$ENSURE_PATH"

if ! command -v nmcli >/dev/null 2>&1; then
  echo "تحذير: nmcli غير موجود — ثبّت network-manager قبل الاعتماد على هذه الخدمة." >&2
fi

# تأكد أن NetworkManager مفعّل عند الإقلاع إن أمكن
if command -v systemctl >/dev/null 2>&1; then
  systemctl enable NetworkManager 2>/dev/null || true
fi

tmp="$(mktemp)"
sed \
  -e "s|Documentation=file:///opt/match/docs/MATCH_NETWORK_SERVICE.md|Documentation=file://${ROOT}/docs/MATCH_NETWORK_SERVICE.md|g" \
  -e "s|ExecStart=/opt/match/infra/scripts/match-network-ensure.sh|ExecStart=${ENSURE_PATH}|g" \
  "$UNIT_FILE" >"$tmp"

install -m 0644 "$tmp" "$UNIT_DEST"
rm -f "$tmp"

systemctl daemon-reload

echo "ثُبّتت الوحدة: ${UNIT_DEST}"
echo "  Root   : ${ROOT}"
echo "  Script : ${ENSURE_PATH}"
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
