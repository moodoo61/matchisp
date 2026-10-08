#!/usr/bin/env bash
# مشغّل USER_NEW — يتحقق من tkn (JWT أو قصير) عبر Python
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec python3 "$SCRIPT_DIR/mist-deny-playback.py" "$@"
