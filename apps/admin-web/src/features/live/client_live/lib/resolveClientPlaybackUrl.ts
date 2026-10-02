/**
 * يبني رابط تشغيل Mist من مسار نسبي على مضيف صفحة المشغّل
 * (عنوان الجهاز الذي فُتحت منه الصفحة — ليس localhost المشاهد).
 *
 * مسار نسبي مثل /hls/ch1/index.m3u8 → http://{hostname}/hls/ch1/index.m3u8
 * رابط مطلق صريح (Mist على مضيف آخر) يُستخدم كما هو.
 */
export function resolveClientPlaybackUrl(pathOrUrl: string): string {
  const raw = pathOrUrl.trim();
  if (!raw) return '';

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  if (typeof window === 'undefined') {
    return raw.startsWith('/') ? raw : `/${raw}`;
  }

  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return `${window.location.protocol}//${window.location.hostname}${path}`;
}
