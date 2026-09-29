#!/usr/bin/env bash
# توافق مع المسار القديم / إعدادات Mist $abr —
# السكربت الفعلي المُدار: scripts/live/abr_nvenc.sh
exec "$(cd "$(dirname "$0")" && pwd)/scripts/live/abr_nvenc.sh" "$@"
