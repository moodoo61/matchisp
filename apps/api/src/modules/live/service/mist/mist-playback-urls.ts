/** بناء روابط مشاهدة MistServer (بدون الاعتماد على مشغّل Mist) */
export type MistPlaybackUrls = {
  /** بث HLS للمشغّلات المستقلة (hls.js وغيرها) */
  hlsUrl: string;
  /** WHEP — WebRTC عند الحاجة لاحقاً */
  whepUrl: string;
};

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);

export function isLoopbackHttpBase(raw: string | null | undefined): boolean {
  try {
    const host = new URL(normalizeMistHttpBase(raw)).hostname.toLowerCase();
    return LOOPBACK_HOSTS.has(host);
  } catch {
    return true;
  }
}

/**
 * عنوان HTTP الذي يصل إليه متصفح العميل.
 * لا تستخدم 127.0.0.1 هنا — ذلك يشير لجهاز الزائر وليس لخادم Mist.
 */
export function normalizeMistHttpBase(raw: string | null | undefined): string {
  const trimmed = (raw ?? '').trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (trimmed.toLowerCase() === 'auto') return '';
  return trimmed;
}

/** يستنتج قاعدة عامة صالحة للعملاء من الإعدادات ومضيف الطلب */
export function resolveMistPublicHttpBase(input: {
  configured?: string | null;
  /** Origin/Host لطلب المتصفح (مثل http://IP:4010 أو Host الـ API) */
  requestOrigin?: string | null;
  adminWebUrl?: string | null;
  publicHostFallback?: string | null;
  /**
   * للواجهات العامة/المشاهدة: فضّل مضيف الطلب على القيمة الثابتة في .env
   * حتى لا تبقى روابط بث من جهاز قديم بعد نسخ المشروع.
   */
  preferRequest?: boolean;
}): string {
  const configured = normalizeMistHttpBase(input.configured);
  const request = originWithoutAdminPort(input.requestOrigin);
  const fromAdmin = originWithoutAdminPort(input.adminWebUrl);
  const fromFallback = originWithoutAdminPort(input.publicHostFallback);

  const pickFirstPublic = (candidates: Array<string | null | undefined>) => {
    for (const candidate of candidates) {
      const value = normalizeMistHttpBase(candidate);
      if (value && !isLoopbackHttpBase(value)) return value;
    }
    return '';
  };

  if (input.preferRequest) {
    const fromRequest = pickFirstPublic([request, fromAdmin, fromFallback]);
    if (fromRequest) return fromRequest;
    if (configured && !isLoopbackHttpBase(configured)) return configured;
    if (configured) return configured;
    return 'http://127.0.0.1:8080';
  }

  if (configured && !isLoopbackHttpBase(configured)) {
    return configured;
  }

  const inferred = pickFirstPublic([request, fromAdmin, fromFallback]);
  if (inferred) return inferred;

  if (configured) return configured;
  return 'http://127.0.0.1:8080';
}

/**
 * يستخرج أصلاً مناسباً من ترويسات الطلب (Origin / X-Forwarded-* / Host).
 * Origin أفضل للوحة (:4010)؛ Host يغطي استدعاءات الـ API مباشرة.
 */
export function requestOriginFromHeaders(headers: {
  origin?: string | string[];
  referer?: string | string[];
  host?: string | string[];
  'x-forwarded-host'?: string | string[];
  'x-forwarded-proto'?: string | string[];
}): string {
  const first = (value: string | string[] | undefined) => {
    if (!value) return '';
    const raw = Array.isArray(value) ? value[0] : value;
    return (raw ?? '').split(',')[0]?.trim() ?? '';
  };

  const origin = first(headers.origin);
  if (origin) {
    try {
      return new URL(origin).origin;
    } catch {
      /* ignore */
    }
  }

  const referer = first(headers.referer);
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      /* ignore */
    }
  }

  const host = first(headers['x-forwarded-host']) || first(headers.host);
  if (!host) return '';

  const proto = first(headers['x-forwarded-proto']) || 'http';
  return `${proto}://${host}`;
}

function originWithoutAdminPort(raw: string | null | undefined): string {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed.includes('://') ? trimmed : `http://${trimmed}`);
    // Mist HTTP عندكم على 80/8080 — منفذ لوحة التحكم (4010) ليس منفذ البث
    if (url.port === '4010' || url.port === '3001' || url.port === '3000') {
      url.port = '';
    }
    return `${url.protocol}//${url.host}`.replace(/\/+$/, '');
  } catch {
    return '';
  }
}

/** يبني روابط المشاهدة من اسم القناة في MistServer */
export function buildMistPlaybackUrls(
  httpBase: string,
  streamName: string,
): MistPlaybackUrls {
  const base = normalizeMistHttpBase(httpBase) || 'http://127.0.0.1:8080';
  const name = streamName.trim();
  if (!name) {
    return { hlsUrl: '', whepUrl: '' };
  }
  const encoded = encodeURIComponent(name);
  return {
    hlsUrl: `${base}/hls/${encoded}/index.m3u8`,
    whepUrl: `${base}/webrtc/${encoded}`,
  };
}
