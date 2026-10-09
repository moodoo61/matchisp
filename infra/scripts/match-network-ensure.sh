#!/usr/bin/env bash
# ضمان جاهزية NetworkManager وتطبيق اتصالات match-* الدائمة.
# مستقل تماماً عن API/الواجهة — يُستدعى من وحدة systemd match-network.
set -euo pipefail

log() { echo "[match-network] $*"; }

if ! command -v nmcli >/dev/null 2>&1; then
  log "nmcli غير موجود — ثبّت network-manager"
  exit 1
fi

if command -v systemctl >/dev/null 2>&1; then
  if ! systemctl is-active --quiet NetworkManager 2>/dev/null; then
    log "تشغيل NetworkManager..."
    systemctl start NetworkManager
  fi
fi

# انتظار جاهزية NM (لا نفشل إن تأخرت الشبكة قليلاً)
if command -v nm-online >/dev/null 2>&1; then
  nm-online -s -q -t 45 || log "تحذير: nm-online لم يؤكد الاتصال خلال المهلة"
fi

nmcli general reload 2>/dev/null || true

# تأكيد أن الأجهزة المستثناة في conf.d أصبحت managed إن أمكن
CONF="/etc/NetworkManager/conf.d/99-match-managed-ifaces.conf"
if [[ -f "$CONF" ]]; then
  # استخراج أسماء المنافذ من تعليق الحالة
  pinned="$(
    awk -F: '/^# match-managed-ifaces:/{print $2}' "$CONF" | tr ',' ' ' || true
  )"
  for ifn in $pinned; do
    ifn="$(echo "$ifn" | xargs)"
    [[ -n "$ifn" ]] || continue
    nmcli device set "$ifn" managed yes 2>/dev/null || true
  done
fi

activated=0
failed=0

# تفعيل اتصالات match-* ذات autoconnect=yes فقط
while IFS=: read -r name uuid autoconnect type; do
  [[ -n "$name" ]] || continue
  case "$name" in
    match-*) ;;
    *) continue ;;
  esac
  # autoconnect قد يكون yes/true حسب الإصدار
  case "${autoconnect,,}" in
    yes|true|1) ;;
    *)
      log "تخطي ${name} (autoconnect=${autoconnect})"
      continue
      ;;
  esac

  log "تفعيل ${name} (${uuid})..."
  if nmcli -w 30 connection up uuid "$uuid"; then
    activated=$((activated + 1))
  else
    log "فشل تفعيل ${name}"
    failed=$((failed + 1))
  fi
done < <(nmcli -t -f NAME,UUID,AUTOCONNECT,TYPE connection show 2>/dev/null || true)

log "انتهى — نجح: ${activated} فشل: ${failed}"
# لا نُخرج بفشل غير صفري إلا إن لم يعمل NM أصلاً — حتى لا نمنع إقلاع النظام
exit 0
