#!/usr/bin/env python3
"""USER_NEW: يسمح بالمشاهدة فقط مع JWT HS256 (tkn) الصادر من Nest/MistJwtService."""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import sys
import time
from urllib.parse import parse_qs, urlsplit

SECRET_CANDIDATES = (
    os.environ.get("MIST_VIEWER_SECRET_FILE", "").strip(),
    "/opt/match/var/live/mist-viewer.secret",
)


def b64url_decode(raw: str) -> bytes:
    pad = "=" * (-len(raw) % 4)
    return base64.urlsafe_b64decode(raw + pad)


def read_secret() -> bytes:
    for path in SECRET_CANDIDATES:
        if path and os.path.isfile(path):
            with open(path, "rb") as fh:
                value = fh.read().strip()
            if value:
                return value
    return b""


def extract_tkn(request_url: str) -> str:
    if not request_url:
        return ""
    query = urlsplit(request_url).query
    if not query:
        if "tkn=" in request_url:
            query = request_url.split("?", 1)[-1]
        else:
            return ""
    values = parse_qs(query).get("tkn") or []
    return values[0] if values else ""


def valid_jwt(stream: str, token: str, secret: bytes) -> bool:
    """JWT HS256 — sub يجب أن يطابق اسم القناة."""
    if not stream or not token or not secret or token.count(".") != 2:
        return False
    try:
        header_b64, payload_b64, sig_b64 = token.split(".")
        data = f"{header_b64}.{payload_b64}".encode("ascii")
        expect = hmac.new(secret, data, hashlib.sha256).digest()
        got = b64url_decode(sig_b64)
        if not hmac.compare_digest(got, expect):
            return False
        payload = json.loads(b64url_decode(payload_b64).decode("utf-8"))
        sub = str(payload.get("sub") or "")
        exp = payload.get("exp")
        now = int(time.time())
        if sub != stream:
            return False
        if not isinstance(exp, (int, float)) or int(exp) < now:
            return False
        return True
    except Exception:
        return False


def main() -> None:
    payload = sys.stdin.read().split("\n")
    stream = payload[0].strip() if len(payload) > 0 else ""
    # USER_NEW: stream, ip, connection_id, protocol, request_url, session_id
    request_url = payload[4].strip() if len(payload) > 4 else ""
    protocol = payload[3].strip().upper() if len(payload) > 3 else ""
    # ملفات المشغّل HTTP لا تحتاج توكن
    if protocol in ("HTTP", "HTTPS"):
        sys.stdout.write("true")
        return
    token = extract_tkn(request_url)
    secret = read_secret()
    if valid_jwt(stream, token, secret):
        sys.stdout.write("true")
    else:
        sys.stdout.write("false")


if __name__ == "__main__":
    main()
