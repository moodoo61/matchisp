/** بناء مسارات مشاهدة MistServer — المضيف يحدده متصفح صفحة المشغّل */

export type MistPlaybackUrls = {
  /** مسار أو رابط HLS (نسبي = نفس مضيف الصفحة) */
  hlsUrl: string;
  /** مسار أو رابط WHEP */
  whepUrl: string;
  /** توكن JWT للمشاهدة إن وُجد */
  token?: string | null;
};

/**
 * قيمة صريحة لـ Mist على مضيف مختلف عن صفحة المشاهدة.
 * فارغ / auto = المسارات نسبية والمشغّل يركّبها على مضيف الصفحة.
 */
export function normalizeMistHttpBase(raw: string | null | undefined): string {
  const trimmed = (raw ?? '').trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (trimmed.toLowerCase() === 'auto') return '';
  return trimmed;
}

/** مسارات نسبية من اسم القناة في Mist */
export function buildMistPlaybackPaths(streamName: string): MistPlaybackUrls {
  const name = streamName.trim();
  if (!name) {
    return { hlsUrl: '', whepUrl: '', token: null };
  }
  const encoded = encodeURIComponent(name);
  return {
    hlsUrl: `/hls/${encoded}/index.m3u8`,
    whepUrl: `/webrtc/${encoded}`,
    token: null,
  };
}

/**
 * إن وُجد httpBase صريح (Mist بعيد) → روابط مطلقة.
 * وإلا → مسارات نسبية ليُكملها المشغّل من window.location.hostname.
 */
export function buildMistPlaybackUrls(
  httpBase: string | null | undefined,
  streamName: string,
  token?: string | null,
): MistPlaybackUrls {
  const paths = buildMistPlaybackPaths(streamName);
  if (!paths.hlsUrl) return paths;

  const base = normalizeMistHttpBase(httpBase);
  const hlsUrl = base ? `${base}${paths.hlsUrl}` : paths.hlsUrl;
  const whepUrl = base ? `${base}${paths.whepUrl}` : paths.whepUrl;
  const signed = token?.trim() || '';

  if (!signed) {
    return { hlsUrl, whepUrl, token: null };
  }

  return {
    hlsUrl: appendQueryParam(hlsUrl, 'tkn', signed),
    whepUrl: appendQueryParam(whepUrl, 'tkn', signed),
    token: signed,
  };
}

function appendQueryParam(url: string, key: string, value: string): string {
  const join = url.includes('?') ? '&' : '?';
  return `${url}${join}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}
