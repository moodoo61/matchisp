/**
 * يبني رابط تشغيل Mist من مسار نسبي على مضيف صفحة المشغّل
 * (عنوان الجهاز الذي فُتحت منه الصفحة — ليس localhost المشاهد).
 *
 * مسار نسبي مثل /hls/ch1/index.m3u8 → http://{host}/hls/ch1/index.m3u8
 * يستخدم location.host ليحافظ على المنفذ (مثل :8443).
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
  return `${window.location.protocol}//${window.location.host}${path}`;
}
