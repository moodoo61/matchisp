#!/usr/bin/env bash
# تثبيت حزم النظام المطلوبة/المستحسنة لتشغيل ISP Admin على Debian/Ubuntu.
# الاستخدام: sudo bash infra/scripts/install-system-deps.sh
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "شغّل السكربت بصلاحية root: sudo bash $0" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

apt-get update
apt-get install -y \
  curl \
  ca-certificates \
  gnupg \
  git \
  build-essential \
  iproute2 \
  network-manager \
  smartmontools \
  postgresql-client \
  ffmpeg \
  v4l-utils \
  sstp-client \
  ppp \
  openssl

systemctl enable --now NetworkManager 2>/dev/null || true

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

# --- SSTP: ملفات التشغيل + مكتبة توسيع التشفير لـ MikroTik ---
SSTP_DIR="${ROOT}/var/sstp"
SSTP_SRC="${ROOT}/apps/api/src/modules/network/sstp/native/ssl_cipher_preload.c"
mkdir -p "${SSTP_DIR}"

if [[ ! -f "${SSTP_DIR}/openssl-sstp.cnf" ]]; then
  cat > "${SSTP_DIR}/openssl-sstp.cnf" <<'EOF'
openssl_conf = openssl_init
[openssl_init]
providers = provider_sect
ssl_conf = ssl_sect
[provider_sect]
default = default_sect
legacy = legacy_sect
[default_sect]
activate = 1
[legacy_sect]
activate = 1
[ssl_sect]
system_default = system_default_sect
[system_default_sect]
MinProtocol = TLSv1
MaxProtocol = TLSv1.2
CipherString = AES256-SHA:AES256-GCM-SHA384:AES128-SHA:ADH-AES256-SHA:ALL:@SECLEVEL=0
Ciphersuites =
EOF
  echo "كتب ${SSTP_DIR}/openssl-sstp.cnf"
fi

if [[ -f "${SSTP_SRC}" ]]; then
  cc -shared -fPIC -O2 -o "${SSTP_DIR}/libssl_cipher_preload.so" "${SSTP_SRC}" -ldl
  echo "بُني ${SSTP_DIR}/libssl_cipher_preload.so"
else
  echo "تحذير: لم يُعثر على ${SSTP_SRC} — ابنِ المكتبة لاحقاً بعد سحب الكود" >&2
fi

echo
echo "تم. تحقق:"
node -v
pnpm -v
psql --version || true
redis-cli ping || true
command -v sstpc && sstpc --version 2>&1 | head -1 || echo "sstpc: غير موجود"
command -v pppd && pppd --version 2>&1 | head -1 || echo "pppd: غير موجود"
test -f "${SSTP_DIR}/libssl_cipher_preload.so" && echo "SSTP preload: ok" || echo "SSTP preload: ناقص"
echo "راجع docs/REQUIREMENTS.md — قسم SSTP."
