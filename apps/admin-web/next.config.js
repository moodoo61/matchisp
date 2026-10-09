const fs = require('fs');
const path = require('path');

/** تحميل .env من جذر المونوريبو إن لم تُمرَّر المتغيرات من الصدفة */
function loadRootEnv() {
  const rootEnv = path.join(__dirname, '../../.env');
  if (!fs.existsSync(rootEnv)) return;
  for (const line of fs.readFileSync(rootEnv, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    if (process.env[key] !== undefined) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadRootEnv();

/** @type {import('next').NextConfig} */
const apiInternal =
  process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:3001';

/**
 * هدف بروكسي مشاهدة Mist عندما الروابط نسبية على نفس أصل صفحة العميل.
 * MISTSERVER_HTTP_URL=auto → Mist المحلي :8080 (صفحة الأدمن غالباً :4010).
 * بدون هذا البروكسي يطلب المتصفح /ch1.ts من Next فيُرجع 404.
 */
function mistProxyTarget() {
  const raw = (process.env.MISTSERVER_HTTP_URL || '').trim();
  if (raw && raw.toLowerCase() !== 'auto') {
    return raw.replace(/\/+$/, '');
  }
  return 'http://127.0.0.1:8080';
}

const mistHttp = mistProxyTarget();

/**
 * مؤقت: لا نعرّف allowedDevOrigins أبداً في التطوير.
 * أي تعريف للمفتاح يفعّل mode=block في Next 15 ويحجب /_next من IP بعيد
 * (172.x / 45.x) حتى مع أنماط واسعة — فيفشل JS وتسجيل الدخول يتحول لـ GET.
 * بدون المفتاح: mode=warn (تحذير فقط، بلا حجب).
 * أعد تفعيل قائمة مضيفات لاحقاً في الإنتاج عند الحاجة.
 */
const nextConfig = {
  transpilePackages: ['@isp/shared'],
  output: 'standalone',
  /** إخفاء زر N لمؤشر التطوير في المتصفح */
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiInternal}/api/:path*`,
      },
      /** مسارات Mist — نفس أصل صفحة المشاهدة */
      {
        source: '/hls/:path*',
        destination: `${mistHttp}/hls/:path*`,
      },
      {
        source: '/webrtc/:path*',
        destination: `${mistHttp}/webrtc/:path*`,
      },
      {
        source: '/dash/:path*',
        destination: `${mistHttp}/dash/:path*`,
      },
      {
        source: '/:stream.ts',
        destination: `${mistHttp}/:stream.ts`,
      },
    ];
  },
};

module.exports = nextConfig;
