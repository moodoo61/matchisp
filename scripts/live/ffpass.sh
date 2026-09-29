#!/bin/bash
# تمرير مباشر عبر ffmpeg لـ MistServer (نسخ تدفقات بدون إعادة ترميز)
# الاستخدام في مصدر Mist:
#   ts-exec:/opt/match/scripts/live/ffpass.sh https://example.com/stream.m3u8
#
# يخرج mpegts على stdout ليستقبله Mist عبر ts-exec.

set -euo pipefail

FFMPEG="${LIVE_FFMPEG_PATH:-/usr/local/bin/ffmpeg}"
INPUT="${1:?Usage: ffpass.sh <input_url>}"

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

echo "ffpass: input=${INPUT}" >&2

FF_ARGS=(
  "$FFMPEG"
  -hide_banner -loglevel warning
  -nostdin
  "${NET_OPTS[@]}"
  -fflags +genpts+discardcorrupt
  -err_detect ignore_err
  -probesize 10M -analyzeduration 10M
  -i "$INPUT"
  -map 0:v:0? -map 0:a:0?
  -c:v copy
  -c:a copy
  -f mpegts
  -
)

# python يبقى أباً لـ ffmpeg — PDEATHSIG عند موت MistInTS
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
