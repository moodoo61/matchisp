/** منفذ HTTP الافتراضي لـ MistServer */
const DEFAULT_MIST_HTTP_PORT = '8080';

/**
 * أساس مشاهدة Mist في المتصفح.
 * - إن وُجد NEXT_PUBLIC_MISTSERVER_HTTP_URL صريح → يُستخدم كما هو
 * - auto: نفس hostname صفحة المشاهدة على منفذ Mist (8080) — ليس منفذ Next (4010)
 */
export function resolveMistBrowserHttpBase(): string {
  const configured = (
    process.env.NEXT_PUBLIC_MISTSERVER_HTTP_URL ||
    process.env.NEXT_PUBLIC_MIST_HTTP_URL ||
    ''
  ).trim();

  if (configured && configured.toLowerCase() !== 'auto') {
    return configured.replace(/\/+$/, '');
  }

  if (typeof window === 'undefined') {
    return '';
  }

  const port =
    (process.env.NEXT_PUBLIC_MISTSERVER_HTTP_PORT || '').trim() ||
    DEFAULT_MIST_HTTP_PORT;

  return `${window.location.protocol}//${window.location.hostname}:${port}`;
}

/**
 * يبني رابط تشغيل Mist من مسار نسبي على أساس MistServer HTTP
 * (وليس منفذ صفحة الأدمن/المشروع).
 *
 * مثال: /hls/ch1/index.m3u8 → http://{hostname}:8080/hls/ch1/index.m3u8
 * رابط مطلق صريح يُستخدم كما هو.
 */
export function resolveClientPlaybackUrl(pathOrUrl: string): string {
  const raw = pathOrUrl.trim();
  if (!raw) return '';

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  const path = raw.startsWith('/') ? raw : `/${raw}`;
  const base = resolveMistBrowserHttpBase();
  if (!base) return path;
  return `${base}${path}`;
}
