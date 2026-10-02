/** بناء مسارات مشاهدة MistServer — المضيف يحدده متصفح صفحة المشغّل */

export type MistPlaybackUrls = {
  /** مسار أو رابط HLS (نسبي = نفس مضيف الصفحة) */
  hlsUrl: string;
  /** مسار أو رابط WHEP */
  whepUrl: string;
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
    return { hlsUrl: '', whepUrl: '' };
  }
  const encoded = encodeURIComponent(name);
  return {
    hlsUrl: `/hls/${encoded}/index.m3u8`,
    whepUrl: `/webrtc/${encoded}`,
  };
}

/**
 * إن وُجد httpBase صريح (Mist بعيد) → روابط مطلقة.
 * وإلا → مسارات نسبية ليُكملها المشغّل من window.location.hostname.
 */
export function buildMistPlaybackUrls(
  httpBase: string | null | undefined,
  streamName: string,
): MistPlaybackUrls {
  const paths = buildMistPlaybackPaths(streamName);
  if (!paths.hlsUrl) return paths;

  const base = normalizeMistHttpBase(httpBase);
  if (!base) return paths;

  return {
    hlsUrl: `${base}${paths.hlsUrl}`,
    whepUrl: `${base}${paths.whepUrl}`,
  };
}
