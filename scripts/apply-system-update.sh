#!/usr/bin/env bash
# يُستدعى بعد git pull من واجهة الإعدادات ← التحديث
# يثبت الاعتماديات، يلحق مفاتيح env الناقصة، ينشئ قواعد جديدة، يرحّل Prisma، ثم يعيد تشغيل الخدمات.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
LOG_DIR="$ROOT/var/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/system-update.log"
STATUS_FILE="$LOG_DIR/system-update-status.json"
STARTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# إعادة توجيه كل المخرجات للسجل بعد تعريف دوال الحالة
exec >>"$LOG_FILE" 2>&1

write_status() {
  local phase="$1"
  local ok="$2"
  local message="$3"
  local error="${4:-}"
  local finished="${5:-}"
  local updated
  updated="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  local finished_json="null"
  if [[ -n "$finished" ]]; then
    finished_json="\"$finished\""
  fi
  local error_json="null"
  if [[ -n "$error" ]]; then
    error_json=$(printf '%s' "$error" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))' 2>/dev/null \
      || printf '"%s"' "${error//\"/\\\"}")
  fi
  local message_json
  message_json=$(printf '%s' "$message" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))' 2>/dev/null \
    || printf '"%s"' "${message//\"/\\\"}")

  cat >"$STATUS_FILE" <<EOF
{
  "phase": "$phase",
  "ok": $ok,
  "message": $message_json,
  "startedAt": "$STARTED_AT",
  "updatedAt": "$updated",
  "finishedAt": $finished_json,
  "error": $error_json,
  "logPath": "var/logs/system-update.log"
}
EOF
}

fail_update() {
  trap - ERR
  local msg="$1"
  echo "فشل: $msg"
  write_status "failed" false "$msg" "$msg" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  exit 1
}

append_missing_env_keys() {
  local example="$ROOT/.env.example"
  local envfile="$ROOT/.env"
  if [[ ! -f "$example" ]]; then
    echo "لا يوجد .env.example — تخطّي إلحاق المفاتيح"
    return 0
  fi
  if [[ ! -f "$envfile" ]]; then
    echo "لا يوجد .env — نسخ من .env.example"
    cp "$example" "$envfile"
    return 0
  fi

  local key value appended=0
  while IFS= read -r line || [[ -n "$line" ]]; do
    # تجاهل التعليقات والأسطر الفارغة
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    # فقط مفاتيح DATABASE_URL_*
    [[ "$line" =~ ^DATABASE_URL_[A-Z0-9_]+= ]] || continue
    key="${line%%=*}"
    if grep -qE "^${key}=" "$envfile" 2>/dev/null; then
      continue
    fi
    value="${line#*=}"
    echo "${key}=${value}" >>"$envfile"
    echo "أُضيف المفتاح الناقص: $key"
    appended=1
  done <"$example"

  if [[ "$appended" -eq 0 ]]; then
    echo "لا مفاتيح DATABASE_URL_* ناقصة في .env"
  fi
}

trap 'fail_update "توقّف غير متوقع أثناء تطبيق التحديث (سطر ${LINENO})"' ERR

echo "==== $(date -Is) بدء تطبيق ما بعد التحديث ===="
write_status "install" true "جارٍ تثبيت الاعتماديات…"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

echo "pnpm install..."
pnpm install || fail_update "فشل pnpm install"

write_status "build" true "جارٍ بناء الحزم المشتركة…"
echo "بناء @isp/shared..."
pnpm --filter @isp/shared build || fail_update "فشل بناء @isp/shared"

write_status "env" true "جارٍ إلحاق مفاتيح البيئة الناقصة…"
echo "إلحاق DATABASE_URL_* الناقصة من .env.example..."
append_missing_env_keys

# إعادة تحميل .env بعد الإلحاق
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

write_status "databases" true "جارٍ إنشاء قواعد البيانات الجديدة إن وُجدت…"
echo "ensure databases (init-local)..."
if [[ -x "$ROOT/infra/docker/postgres/init-local.sh" ]] || [[ -f "$ROOT/infra/docker/postgres/init-local.sh" ]]; then
  bash "$ROOT/infra/docker/postgres/init-local.sh" || fail_update "فشل إنشاء قواعد البيانات"
else
  echo "تحذير: init-local.sh غير موجود — تخطّي إنشاء القواعد"
fi

write_status "generate" true "جارٍ توليد عملاء Prisma…"
echo "prisma generate..."
pnpm --filter @isp/api prisma:generate || fail_update "فشل prisma generate"

write_status "migrate" true "جارٍ ترحيل قواعد البيانات…"
echo "prisma migrate..."
pnpm --filter @isp/api prisma:migrate || fail_update "فشل prisma migrate — لم تُعد تشغيل الخدمات"

write_status "restart" true "جارٍ إعادة تشغيل الخدمات…"

if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files tsetisp.service >/dev/null 2>&1; then
  if systemctl is-enabled --quiet tsetisp.service 2>/dev/null || systemctl is-active --quiet tsetisp.service 2>/dev/null; then
    echo "إعادة تشغيل خدمة tsetisp..."
    if systemctl restart tsetisp.service; then
      write_status "done" true "اكتمل التحديث وأُعيد تشغيل tsetisp" "" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
      echo "==== $(date -Is) انتهى (systemd) ===="
      exit 0
    fi
    fail_update "فشل إعادة تشغيل tsetisp.service"
  fi
fi

if [[ -x "$ROOT/dev.sh" ]]; then
  echo "إعادة تشغيل عبر ./dev.sh restart..."
  set +e
  bash "$ROOT/dev.sh" restart
  rc=$?
  set -e
  if [[ $rc -eq 0 ]]; then
    write_status "done" true "اكتمل التحديث وأُعيد التشغيل عبر dev.sh" "" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "==== $(date -Is) انتهى (dev.sh) ===="
    exit 0
  fi
  fail_update "فشل ./dev.sh restart (رمز $rc)"
fi

write_status "done" true "اكتمل التحديث — أعد التشغيل يدوياً إن لزم" "" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "لا توجد خدمة معروفة لإعادة التشغيل — أعد التشغيل يدوياً"
echo "==== $(date -Is) انتهى بدون إعادة تشغيل ===="
