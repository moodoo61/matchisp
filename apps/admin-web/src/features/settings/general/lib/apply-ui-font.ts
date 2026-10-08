import type { GeneralUiFontFace } from '@/features/settings/general/types';

const STYLE_ID = 'isp-ui-font-faces';

/** يحوّل رابط الخط إلى مسار نسبي لنفس أصل الواجهة (عبر /api proxy) */
function toSameOriginUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return trimmed;
  }
}

/** يحقن @font-face ويحدّث متغيرات الخط في لوحة الإدارة وصفحة لايف العميل */
export function applyUiFont(opts: {
  family: string;
  faces: GeneralUiFontFace[];
}) {
  if (typeof document === 'undefined') return;

  const fallback = '"Segoe UI", Tahoma, sans-serif';
  const faces = opts.faces.map((face) => ({
    weight: face.weight,
    url: toSameOriginUrl(face.url),
  }));
  const stack = faces.length
    ? `"${opts.family}", ${fallback}`
    : fallback;

  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }

  const facesCss = faces
    .map(
      (face) => `@font-face {
  font-family: "${opts.family}";
  font-style: normal;
  font-weight: ${face.weight};
  font-display: swap;
  src: url("${face.url}") format("woff2");
}`,
    )
    .join('\n');

  style.textContent = `${facesCss}
:root {
  --font-display: ${stack};
  --font-body: ${stack};
  --cl-font-brand: ${stack};
  --cl-font-display: ${stack};
  --cl-font-body: ${stack};
}
html, body {
  font-family: ${stack};
}
.cl-app {
  --cl-font-brand: ${stack};
  --cl-font-display: ${stack};
  --cl-font-body: ${stack};
  font-family: ${stack};
}`;
}
