#!/usr/bin/env bash
# بناء مكتبة LD_PRELOAD لتوسيع تشفيرات sstpc (حل no common ciphers مع SoftEther)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
# من apps/api/src/modules/network/sstp/native → /opt/match
ROOT="$(cd "$(dirname "$0")/../../../../../../.." && pwd)"
SRC="$(cd "$(dirname "$0")" && pwd)/ssl_cipher_preload.c"
OUT_DIR="${MATCH_ROOT:-/opt/match}/var/sstp"
OUT="${OUT_DIR}/libssl_cipher_preload.so"
mkdir -p "$OUT_DIR"
cc -shared -fPIC -O2 -o "$OUT" "$SRC" -ldl
echo "built $OUT"
