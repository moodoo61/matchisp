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
  return trimmed || '';
}

/** يستنتج قاعدة عامة صالحة للعملاء من الإعدادات */
export function resolveMistPublicHttpBase(input: {
  configured?: string | null;
  adminWebUrl?: string | null;
  publicHostFallback?: string | null;
}): string {
  const configured = normalizeMistHttpBase(input.configured);
  if (configured && !isLoopbackHttpBase(configured)) {
    return configured;
  }

  for (const candidate of [input.adminWebUrl, input.publicHostFallback]) {
    const origin = originWithoutAdminPort(candidate);
    if (origin && !isLoopbackHttpBase(origin)) {
      return origin;
    }
  }

  // أخيراً: إن وُجدت قيمة loopback صريحة نُبقيها (تشغيل محلي فقط)
  if (configured) return configured;
  return 'http://127.0.0.1:8080';
}

function originWithoutAdminPort(raw: string | null | undefined): string {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed);
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
