#!/bin/bash
# مشفر ABR لـ MistServer (NVENC + scale_cuda) — يقرأ الإعدادات من JSON
# الاستخدام في مصدر Mist:
#   ts-exec:/opt/match/scripts/live/abr_nvenc.sh https://example.com/stream.m3u8
#
# ملف الإعداد (يُحدَّث من لوحة الجودة والترميز):
#   /opt/match/var/live/abr_nvenc.json
# أو LIVE_ABR_CONFIG_PATH

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
FFMPEG="${LIVE_FFMPEG_PATH:-/usr/local/bin/ffmpeg}"
FFPROBE="${LIVE_FFPROBE_PATH:-/usr/local/bin/ffprobe}"
CONFIG_PATH="${LIVE_ABR_CONFIG_PATH:-$ROOT/var/live/abr_nvenc.json}"
INPUT="${1:?Usage: abr_nvenc.sh <input_url> [config.json]}"
if [[ "${2:-}" != "" ]]; then
  CONFIG_PATH="$2"
fi

# إنهاء أي ffmpeg سابق لنفس المصدر
while read -r oldpid; do
  [[ -n "$oldpid" ]] || continue
  kill -KILL "$oldpid" 2>/dev/null || true
done < <(ps -eo pid=,args= | awk -v inurl="$INPUT" '
  index($0, "/ffmpeg") && index($0, "-i " inurl) { print $1 }
')

NET_OPTS=(
  -rw_timeout 15000000
  -reconnect 1
  -reconnect_streamed 1
  -reconnect_on_network_error 1
  -reconnect_delay_max 5
)

# قراءة إعدادات الجودة من JSON (مع افتراضات آمنة)
read_cfg() {
  local expr="$1"
  local fallback="$2"
  if [[ -f "$CONFIG_PATH" ]]; then
    python3 - "$CONFIG_PATH" "$expr" "$fallback" <<'PY' 2>/dev/null || echo "$fallback"
import json, sys
path, expr, fallback = sys.argv[1], sys.argv[2], sys.argv[3]
try:
    data = json.load(open(path, encoding="utf-8"))
except Exception:
    print(fallback)
    raise SystemExit(0)
cur = data
for part in expr.split("."):
    if part.endswith("]"):
        name, idx = part[:-1].split("[")
        cur = cur.get(name, [])
        cur = cur[int(idx)] if isinstance(cur, list) and len(cur) > int(idx) else None
    else:
        cur = cur.get(part) if isinstance(cur, dict) else None
    if cur is None:
        print(fallback)
        raise SystemExit(0)
print(cur)
PY
  else
    echo "$fallback"
  fi
}

FPS="$(read_cfg fps 25)"
GOP="$(read_cfg gop 150)"
A_BR="$(read_cfg audioBitrateKbps 128)"
A_SR="$(read_cfg audioSampleRate 48000)"
PRESET="$(read_cfg nvencPreset p4)"
RUNG_COUNT="$(python3 - "$CONFIG_PATH" <<'PY' 2>/dev/null || echo 3
import json, sys, os
path = sys.argv[1]
if not os.path.isfile(path):
    print(3)
    raise SystemExit(0)
data = json.load(open(path, encoding="utf-8"))
rungs = data.get("rungs") or []
print(min(6, max(1, len(rungs))))
PY
)"

detect_cuvid_decoder() {
  local codec
  codec=$("$FFPROBE" -v error -select_streams v:0 \
    -show_entries stream=codec_name \
    -of default=noprint_wrappers=1:nokey=1 \
    -probesize 10M -analyzeduration 10M \
    "${NET_OPTS[@]}" \
    -i "$INPUT" 2>/dev/null | head -1 || true)

  case "${codec,,}" in
    hevc|h265) echo hevc_cuvid ;;
    av1) echo av1_cuvid ;;
    vp9) echo vp9_cuvid ;;
    h264|avc) echo h264_cuvid ;;
    mpeg2) echo mpeg2_cuvid ;;
    mpeg4) echo mpeg4_cuvid ;;
    *)
      echo "abr_nvenc: codec غير معروف '${codec:-?}' — محاولة hevc_cuvid" >&2
      echo hevc_cuvid
      ;;
  esac
}

CUVID_DECODER=$(detect_cuvid_decoder)
echo "abr_nvenc: decoder=${CUVID_DECODER} input=${INPUT} config=${CONFIG_PATH} rungs=${RUNG_COUNT}" >&2

# بناء filter_complex ديناميكي حسب عدد الجودات
SPLIT_OUT=""
SCALE_CHAIN=""
for ((i=0; i<RUNG_COUNT; i++)); do
  SPLIT_OUT+="[v$((i+1))]"
done
FILTER="[0:v:0]split=${RUNG_COUNT}${SPLIT_OUT}"
for ((i=0; i<RUNG_COUNT; i++)); do
  W="$(read_cfg "rungs[$i].width" 1280)"
  H="$(read_cfg "rungs[$i].height" 720)"
  FILTER+=";[v$((i+1))]scale_cuda=${W}:${H}:interp_algo=bilinear[o$((i+1))]"
done

FF_ARGS=(
  "$FFMPEG"
  -hide_banner -loglevel warning
  "${NET_OPTS[@]}"
  -fflags +genpts+discardcorrupt
  -err_detect ignore_err
  -probesize 10M -analyzeduration 10M
  -hwaccel cuda -hwaccel_output_format cuda -c:v "$CUVID_DECODER"
  -i "$INPUT"
  -filter_complex "$FILTER"
  -map 0:a:0? -c:a:0 aac -b:a:0 "${A_BR}k" -ar:0 "$A_SR"
  -af "aresample=async=1:min_hard_comp=0.100:first_pts=0"
)

for ((i=0; i<RUNG_COUNT; i++)); do
  BR="$(read_cfg "rungs[$i].bitrateKbps" 800)"
  MR="$(read_cfg "rungs[$i].maxrateKbps" "$BR")"
  BS="$(read_cfg "rungs[$i].bufsizeKbps" "$BR")"
  FF_ARGS+=(
    -map "[o$((i+1))]" -c:v:$i h264_nvenc -preset "$PRESET" -tune hq -rc:v:$i cbr
    -b:v:$i "${BR}k" -maxrate:v:$i "${MR}k" -bufsize:v:$i "${BS}k"
    -spatial_aq:v:$i 1 -temporal_aq:v:$i 1 -aq-strength:v:$i 8
    -r:v:$i "$FPS" -g:v:$i "$GOP" -keyint_min:v:$i "$GOP"
  )
done

FF_ARGS+=(-bf:v 0 -f mpegts -)

exec python3 -c '
import ctypes, os, signal, subprocess, sys

PR_SET_PDEATHSIG = 1
libc = ctypes.CDLL("libc.so.6", use_errno=True)

def set_pdeathsig(sig):
    if libc.prctl(PR_SET_PDEATHSIG, sig) != 0:
        raise OSError(ctypes.get_errno(), "prctl(PR_SET_PDEATHSIG)")

set_pdeathsig(signal.SIGKILL)
if os.getppid() == 1:
    sys.exit(0)

def child_setup():
    set_pdeathsig(signal.SIGKILL)
    if os.getppid() == 1:
        os._exit(0)

proc = subprocess.Popen(sys.argv[1:], preexec_fn=child_setup)

def stop(_signum=None, _frame=None):
    if proc.poll() is None:
        try:
            os.kill(proc.pid, signal.SIGKILL)
        except OSError:
            pass
    try:
        proc.wait(timeout=3)
    except Exception:
        pass
    sys.exit(0)

signal.signal(signal.SIGTERM, stop)
signal.signal(signal.SIGINT, stop)
signal.signal(signal.SIGHUP, stop)

rc = proc.wait()
sys.exit(rc if rc is not None and rc >= 0 else 0)
' "${FF_ARGS[@]}"
