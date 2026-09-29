#!/usr/bin/env bash
# تثبيت حزم النظام المطلوبة/المستحسنة لتشغيل ISP Admin على Debian/Ubuntu.
# الاستخدام: sudo bash infra/scripts/install-system-deps.sh
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "شغّل السكربت بصلاحية root: sudo bash $0" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y \
  curl \
  ca-certificates \
  gnupg \
  git \
  build-essential \
  iproute2 \
  smartmontools \
  postgresql-client \
  ffmpeg \
  v4l-utils

# Node.js 22 إن لم يكن مثبتاً أو الإصدار أقدم
need_node=0
if ! command -v node >/dev/null 2>&1; then
  need_node=1
else
  major="$(node -v | sed -E 's/^v([0-9]+).*/\1/')"
  if [[ "${major}" -lt 22 ]]; then
    need_node=1
  fi
fi

if [[ "${need_node}" -eq 1 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

if ! command -v pnpm >/dev/null 2>&1; then
  npm install -g pnpm@9
fi

# PostgreSQL + Redis إن لم يكونا مثبتين
if ! command -v psql >/dev/null 2>&1; then
  apt-get install -y postgresql postgresql-contrib
fi
if ! command -v redis-cli >/dev/null 2>&1; then
  apt-get install -y redis-server
fi

systemctl enable --now postgresql redis-server 2>/dev/null || true

echo
echo "تم. تحقق:"
node -v
pnpm -v
psql --version || true
redis-cli ping || true
echo "راجع docs/REQUIREMENTS.md للتفاصيل وخطوات إعداد المشروع."
