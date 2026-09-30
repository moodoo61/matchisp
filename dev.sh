#!/usr/bin/env bash
# تشغيل المشروع في طور التطوير (API + الواجهة)
# الاستخدام:
#   ./dev.sh              تشغيل الاثنين معاً
#   ./dev.sh start        نفس الأمر
#   ./dev.sh api          الخلفي فقط
#   ./dev.sh web          الأمامي فقط
#   ./dev.sh stop         إيقاف المنافذ
#   ./dev.sh restart      إيقاف ثم تشغيل الاثنين
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

API_PORT="${API_PORT:-3001}"
WEB_PORT="${PORT:-4010}"
API_PID=""
WEB_PID=""

load_env() {
  if [[ ! -f "$ROOT/.env" ]]; then
    echo "خطأ: ملف .env غير موجود. انسخه أولاً: cp .env.example .env" >&2
    exit 1
  fi
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
}

stop_ports() {
  echo "إيقاف المنافذ ${API_PORT} و ${WEB_PORT}..."
  fuser -k "${API_PORT}/tcp" 2>/dev/null || true
  fuser -k "${WEB_PORT}/tcp" 2>/dev/null || true
  sleep 1
}

cleanup() {
  echo
  echo "إيقاف خدمات التطوير..."
  if [[ -n "$API_PID" ]] && kill -0 "$API_PID" 2>/dev/null; then
    kill "$API_PID" 2>/dev/null || true
  fi
  if [[ -n "$WEB_PID" ]] && kill -0 "$WEB_PID" 2>/dev/null; then
    kill "$WEB_PID" 2>/dev/null || true
  fi
  stop_ports
  exit 0
}

ensure_shared() {
  if [[ ! -d "$ROOT/packages/shared/dist" ]]; then
    echo "بناء @isp/shared..."
    pnpm --filter @isp/shared build
  fi
}

# إن غاب جدول users (تنصيب جديد) شغّل bootstrap-db تلقائياً
ensure_db() {
  local pghost="${POSTGRES_HOST:-localhost}"
  local pgport="${POSTGRES_PORT:-5432}"
  local pguser="${POSTGRES_USER:-isp}"
  local out=""
  export PGPASSWORD="${POSTGRES_PASSWORD:-isp_secret}"
  out="$(psql -h "$pghost" -p "$pgport" -U "$pguser" -d db_core -tAc \
    "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='users'" \
    2>/dev/null || true)"
  if [[ "$out" == "1" ]]; then
    return 0
  fi
  echo "قاعدة db_core بلا جدول users — تهيئة تلقائية..."
  bash "$ROOT/infra/scripts/bootstrap-db.sh"
}

start_api() {
  echo "تشغيل الخلفي (API) على المنفذ ${API_PORT}..."
  pnpm --filter @isp/api dev &
  API_PID=$!
}

start_web() {
  echo "تشغيل الأمامي (Admin Web) على المنفذ ${WEB_PORT}..."
  pnpm --filter @isp/admin-web dev &
  WEB_PID=$!
}

print_urls() {
  echo
  echo "جاهز للتطوير:"
  echo "  الواجهة : http://127.0.0.1:${WEB_PORT}"
  echo "  API     : http://127.0.0.1:${API_PORT}/api/docs"
  echo "  إيقاف   : Ctrl+C  أو  ./dev.sh stop"
  echo
}

cmd="${1:-start}"

case "$cmd" in
  start|"")
    load_env
    stop_ports
    ensure_shared
    ensure_db
    trap cleanup INT TERM
    start_api
    start_web
    print_urls
    wait
    ;;
  api)
    load_env
    fuser -k "${API_PORT}/tcp" 2>/dev/null || true
    sleep 1
    ensure_shared
    ensure_db
    trap cleanup INT TERM
    start_api
    echo "API: http://127.0.0.1:${API_PORT}/api/docs"
    wait "$API_PID"
    ;;
  web|admin|frontend)
    load_env
    fuser -k "${WEB_PORT}/tcp" 2>/dev/null || true
    sleep 1
    trap cleanup INT TERM
    start_web
    echo "الواجهة: http://127.0.0.1:${WEB_PORT}"
    wait "$WEB_PID"
    ;;
  stop)
    stop_ports
    echo "تم الإيقاف."
    ;;
  restart)
    load_env
    stop_ports
    ensure_shared
    ensure_db
    trap cleanup INT TERM
    start_api
    start_web
    print_urls
    wait
    ;;
  -h|--help|help)
    sed -n '2,10p' "$0"
    ;;
  *)
    echo "أمر غير معروف: $cmd" >&2
    echo "استخدم: ./dev.sh [start|api|web|stop|restart|help]" >&2
    exit 1
    ;;
esac
