#!/usr/bin/env bash
# مشغّل USER_END — يمرّر حمولة الجلسة إلى API التقارير على نفس الجهاز
# @see https://docs.mistserver.org/mistserver/integration/triggers/list/USER_END
set -euo pipefail

# اقرأ المنفذ من ملف بسيط إن وُجد، وإلا 3001
PORT_FILE="${MIST_USER_END_API_PORT_FILE:-/opt/match/var/live/api.port}"
if [[ -z "${API_PORT:-}" && -f "$PORT_FILE" ]]; then
  API_PORT="$(tr -d '[:space:]' <"$PORT_FILE" || true)"
fi
API_PORT="${API_PORT:-3001}"
URL="http://127.0.0.1:${API_PORT}/api/public/live/viewing-reports/user-end"

# Mist يمرّر الحمولة على stdin
curl -sS --max-time 5 -X POST "$URL" \
  -H 'Content-Type: text/plain' \
  -H 'X-Trigger: USER_END' \
  --data-binary @- \
  -o /dev/null || true

exit 0
