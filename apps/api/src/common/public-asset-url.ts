/**
 * يحوّل مسار رفع نسبي إلى رابط مطلق ليظهر عند العميل على نطاق مختلف.
 * مثال: /api/uploads/login-ads/x.png → http://host:3001/api/uploads/login-ads/x.png
 */
export function toAbsolutePublicUrl(
  pathOrUrl: string | null | undefined,
): string {
  if (!pathOrUrl) return '';
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return '';
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;

  const base = (
    process.env.API_URL ||
    process.env.PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ''
  ).replace(/\/$/, '');

  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (!base) return path;
  return `${base}${path}`;
}
