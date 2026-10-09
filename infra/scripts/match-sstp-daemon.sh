#!/usr/bin/env bash
# حارس SSTP مستقل عن Node/tsetisp — يقرأ boot.env ويعيد sstpc عند الحاجة.
# يُشغَّل كـ match-sstp.service ضمن إطار شبكة match.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SSTP_DIR="${ROOT}/var/sstp"
BOOT_ENV="${SSTP_DIR}/boot.env"
PID_FILE="${SSTP_DIR}/sstpc.pid"
LOG_FILE="${SSTP_DIR}/sstpc.log"
OPENSSL_CONF="${SSTP_DIR}/openssl-sstp.cnf"
PRELOAD_SO="${SSTP_DIR}/libssl_cipher_preload.so"
RETRY_SEC="${MATCH_SSTP_RETRY_SEC:-30}"

log() { echo "[match-sstp] $*"; }

mkdir -p "$SSTP_DIR"

is_running() {
  if [[ -f "$PID_FILE" ]]; then
    local pid
    pid="$(tr -d '[:space:]' <"$PID_FILE" || true)"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      if tr '\0' ' ' <"/proc/${pid}/cmdline" 2>/dev/null | grep -q 'sstpc'; then
        return 0
      fi
    fi
  fi
  if pgrep -f 'sstpc' >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

start_sstpc() {
  # shellcheck disable=SC1090
  source "$BOOT_ENV"

  local auto="${AUTO_CONNECT:-0}"
  local host="${HOST:-}"
  local user="${USERNAME:-}"
  local pass="${PASSWORD:-}"
  local cert_warn="${CERT_WARN:-1}"
  local tls_ext="${TLS_EXT:-1}"

  # إزالة اقتباس مفرد إن وُجد من الكتابة الآمنة
  host="${host#\'}"; host="${host%\'}"
  user="${user#\'}"; user="${user%\'}"
  pass="${pass#\'}"; pass="${pass%\'}"

  if [[ "$auto" != "1" && "$auto" != "yes" && "$auto" != "true" ]]; then
    log "autoConnect معطّل — انتظار"
    return 0
  fi
  if [[ -z "$host" || -z "$user" || -z "$pass" ]]; then
    log "إعدادات ناقصة في boot.env"
    return 0
  fi
  if ! command -v sstpc >/dev/null 2>&1; then
    log "sstpc غير مثبت"
    return 0
  fi
  if is_running; then
    return 0
  fi

  local args=()
  [[ "$cert_warn" == "1" ]] && args+=(--cert-warn)
  [[ "$tls_ext" == "1" ]] && args+=(--tls-ext)
  args+=(--log-stderr --log-level 2 --user "$user" --password "$pass" "$host")
  args+=(-- noauth refuse-eap usepeerdns nodefaultroute)

  local env_vars=( )
  if [[ -f "$OPENSSL_CONF" ]]; then
    env_vars+=( "OPENSSL_CONF=${OPENSSL_CONF}" )
  fi
  if [[ -f "$PRELOAD_SO" ]]; then
    env_vars+=( "LD_PRELOAD=${PRELOAD_SO}${LD_PRELOAD:+:$LD_PRELOAD}" )
  fi

  log "بدء sstpc → ${host}"
  {
    echo ""
    echo "--- match-sstp $(date -Is) ${host} ---"
  } >>"$LOG_FILE"

  if ((${#env_vars[@]})); then
    env "${env_vars[@]}" sstpc "${args[@]}" >>"$LOG_FILE" 2>&1 &
  else
    sstpc "${args[@]}" >>"$LOG_FILE" 2>&1 &
  fi
  local pid=$!
  echo "$pid" >"$PID_FILE"
  sleep 3
  if kill -0 "$pid" 2>/dev/null; then
    log "sstpc يعمل pid=${pid}"
  else
    log "فشل بدء sstpc — راجع ${LOG_FILE}"
    rm -f "$PID_FILE"
  fi
}

log "بدء الحارس (retry=${RETRY_SEC}s) root=${ROOT}"
while true; do
  if [[ -f "$BOOT_ENV" ]]; then
    start_sstpc || true
  else
    log "لا يوجد boot.env — احفظ إعدادات SSTP من اللوحة أولاً"
  fi
  sleep "$RETRY_SEC"
done
