/** يزيل tkn من الرابط لمقارنة هوية التيار دون إعادة تشغيل المشغّل */
export function stripPlaybackToken(url: string): string {
  const raw = url.trim();
  if (!raw) return '';
  try {
    const parsed = new URL(raw, 'http://localhost');
    parsed.searchParams.delete('tkn');
    const qs = parsed.searchParams.toString();
    return `${parsed.origin}${parsed.pathname}${qs ? `?${qs}` : ''}`;
  } catch {
    return raw.replace(/([?&])tkn=[^&]*/g, '').replace(/\?$/, '').replace(/&&+/g, '&');
  }
}

export function extractPlaybackToken(url: string): string | null {
  try {
    const parsed = new URL(url, 'http://localhost');
    return parsed.searchParams.get('tkn');
  } catch {
    const match = /[?&]tkn=([^&]+)/.exec(url);
    return match ? decodeURIComponent(match[1]) : null;
  }
}
