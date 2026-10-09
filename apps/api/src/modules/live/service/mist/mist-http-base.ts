import { normalizeMistHttpBase } from './mist-playback-urls';

/**
 * أساس HTTP لطلبات السيرفر نحو Mist (إيقاظ الستريم).
 * إن كان MISTSERVER_HTTP_URL=auto يُشتق من مضيف API على المنفذ 8080
 * — نفس منفذ مشاهدة Mist الافتراضي محلياً.
 */
export function resolveServerMistHttpBase(
  configuredHttpUrl: string | null | undefined,
  apiUrl: string,
): string {
  const explicit = normalizeMistHttpBase(configuredHttpUrl);
  if (explicit) return explicit;

  try {
    const api = new URL(apiUrl);
    const host = api.hostname || '127.0.0.1';
    const protocol = api.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${host}:8080`;
  } catch {
    return 'http://127.0.0.1:8080';
  }
}

/** يبني رابطاً مطلقاً لمسار مشاهدة نسبي أو مطلق */
export function absolutizeMistPlaybackUrl(
  httpBase: string,
  pathOrUrl: string,
): string {
  const raw = pathOrUrl.trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = httpBase.replace(/\/+$/, '');
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return `${base}${path}`;
}
