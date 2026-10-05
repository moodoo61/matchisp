#!/usr/bin/env bash
# يُستدعى بعد git pull من واجهة الإعدادات ← التحديث
# يعيد تثبيت الاعتماديات، يبني الحزم المشتركة، يحدّث Prisma، ثم يعيد تشغيل الخدمات.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
LOG_DIR="$ROOT/var/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/system-update.log"

exec >>"$LOG_FILE" 2>&1
echo "==== $(date -Is) بدء تطبيق ما بعد التحديث ===="

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

echo "pnpm install..."
pnpm install

echo "بناء @isp/shared..."
pnpm --filter @isp/shared build

echo "prisma generate..."
pnpm --filter @isp/api prisma:generate

echo "prisma migrate..."
pnpm --filter @isp/api prisma:migrate || {
  echo "تحذير: فشل prisma migrate — راجع السجل يدوياً"
}

API_PORT="${API_PORT:-3001}"
WEB_PORT="${PORT:-${ADMIN_WEB_PORT:-4010}}"

if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files tsetisp.service >/dev/null 2>&1; then
  if systemctl is-enabled --quiet tsetisp.service 2>/dev/null || systemctl is-active --quiet tsetisp.service 2>/dev/null; then
    echo "إعادة تشغيل خدمة tsetisp..."
    systemctl restart tsetisp.service || true
    echo "==== $(date -Is) انتهى (systemd) ===="
    exit 0
  fi
fi

if [[ -x "$ROOT/dev.sh" ]]; then
  echo "إعادة تشغيل عبر ./dev.sh restart..."
  # لا نستخدم set -e هنا لأن stop قد يفشل إن لم تكن المنافذ مفتوحة
  bash "$ROOT/dev.sh" restart || true
  echo "==== $(date -Is) انتهى (dev.sh) ===="
  exit 0
fi

echo "لا توجد خدمة معروفة لإعادة التشغيل — أعد التشغيل يدوياً"
echo "==== $(date -Is) انتهى بدون إعادة تشغيل ===="
