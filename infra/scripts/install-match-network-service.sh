#!/usr/bin/env bash
# تثبيت إطار شبكة Match المستقل عن التطبيق:
#   - match-network : ضمان NetworkManager + اتصالات match-*
#   - match-sstp    : حارس SSTP من boot.env (بدون Node/Postgres)
#
# الاستخدام:
#   sudo bash infra/scripts/install-match-network-service.sh
#   sudo bash infra/scripts/install-match-network-service.sh --root /opt/match --enable --start
#   sudo bash infra/scripts/install-match-network-service.sh --uninstall
#
# أوامر لاحقاً:
#   sudo systemctl status match-network match-sstp
#   journalctl -u match-network -u match-sstp -f
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_HINT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

ROOT="${MATCH_ROOT:-$REPO_HINT}"
DO_ENABLE=0
DO_START=0
DO_UNINSTALL=0

UNITS=(match-network match-sstp)

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
  for name in "${UNITS[@]}"; do
    systemctl stop "$name" 2>/dev/null || true
    systemctl disable "$name" 2>/dev/null || true
    rm -f "/etc/systemd/system/${name}.service"
  done
  systemctl daemon-reload
  echo "أُزيلت وحدات: ${UNITS[*]}"
}

if [[ "$DO_UNINSTALL" -eq 1 ]]; then
  uninstall
  exit 0
fi

install_unit() {
  local name="$1"
  local unit_src="${ROOT}/infra/systemd/${name}.service"
  local script_key="$2"
  local script_path="${ROOT}/infra/scripts/${script_key}"
  local dest="/etc/systemd/system/${name}.service"

  if [[ ! -f "$unit_src" ]]; then
    echo "ملف الوحدة غير موجود: $unit_src" >&2
    exit 1
  fi
  if [[ ! -f "$script_path" ]]; then
    echo "السكربت غير موجود: $script_path" >&2
    exit 1
  fi
  chmod +x "$script_path"

  local tmp
  tmp="$(mktemp)"
  sed \
    -e "s|Documentation=file:///opt/match/docs/MATCH_NETWORK_SERVICE.md|Documentation=file://${ROOT}/docs/MATCH_NETWORK_SERVICE.md|g" \
    -e "s|ExecStart=/opt/match/infra/scripts/${script_key}|ExecStart=${script_path}|g" \
    "$unit_src" >"$tmp"
  install -m 0644 "$tmp" "$dest"
  rm -f "$tmp"
  echo "ثُبّتت: ${dest}"
}

if ! command -v nmcli >/dev/null 2>&1; then
  echo "تحذير: nmcli غير موجود — ثبّت network-manager." >&2
fi
if ! command -v sstpc >/dev/null 2>&1; then
  echo "تحذير: sstpc غير موجود — ثبّت sstp-client لـ match-sstp." >&2
fi

systemctl enable NetworkManager 2>/dev/null || true

install_unit match-network match-network-ensure.sh
install_unit match-sstp match-sstp-daemon.sh

systemctl daemon-reload

echo "  Root: ${ROOT}"
echo

if [[ "$DO_ENABLE" -eq 1 ]]; then
  for name in "${UNITS[@]}"; do
    systemctl enable "$name"
  done
  echo "تم تفعيل الوحدات عند الإقلاع."
fi

if [[ "$DO_START" -eq 1 ]]; then
  systemctl restart match-network || true
  systemctl restart match-sstp || true
  systemctl --no-pager --full status match-network match-sstp || true
  echo
  echo "السجلات: journalctl -u match-network -u match-sstp -f"
else
  echo "للتشغيل:"
  echo "  sudo systemctl enable --now match-network match-sstp"
fi
