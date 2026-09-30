#!/usr/bin/env bash
# تهيئة قواعد الأقسام + Prisma migrate + seed (مرة عند التنصيب أو عند غياب الجداول)
#
# الاستخدام:
#   bash infra/scripts/bootstrap-db.sh
#   bash infra/scripts/bootstrap-db.sh --force   # migrate + seed حتى لو users موجودة
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

FORCE=0
for arg in "$@"; do
  case "$arg" in
    --force|-f) FORCE=1 ;;
    -h|--help|help)
      sed -n '2,8p' "$0"
      exit 0
      ;;
  esac
done

if [[ ! -f "$ROOT/.env" ]]; then
  echo "خطأ: لا يوجد .env — انسخ: cp .env.example .env" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source "$ROOT/.env"
set +a

PGHOST="${POSTGRES_HOST:-localhost}"
PGPORT="${POSTGRES_PORT:-5432}"
PGUSER="${POSTGRES_USER:-isp}"
PGPASSWORD="${POSTGRES_PASSWORD:-isp_secret}"
export PGPASSWORD

users_exist() {
  local out
  out="$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d db_core -tAc \
    "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='users'" \
    2>/dev/null || true)"
  [[ "$out" == "1" ]]
}

echo "==> إنشاء قواعد الأقسام (إن لزم)..."
bash "$ROOT/infra/docker/postgres/init-local.sh"

if [[ "$FORCE" -eq 0 ]] && users_exist; then
  echo "==> جدول users موجود — تشغيل migrate فقط (للتحديثات)."
  pnpm --filter @isp/api prisma:generate
  pnpm --filter @isp/api prisma:migrate
  echo "تم. (لتفعيل seed مجدداً: bash infra/scripts/bootstrap-db.sh --force)"
  exit 0
fi

echo "==> Prisma generate + migrate + seed..."
pnpm --filter @isp/shared build
pnpm --filter @isp/api prisma:generate
pnpm --filter @isp/api prisma:migrate
pnpm db:seed

echo
echo "قاعدة البيانات جاهزة. حساب المدير الافتراضي من .env:"
echo "  ${SEED_ADMIN_USERNAME:-admin}"
