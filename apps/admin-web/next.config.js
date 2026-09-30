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

/** يستخرج اسم المضيف فقط (بدون منفذ/مسار) لقائمة allowedDevOrigins */
function hostnameOf(value) {
  const raw = (value ?? '').trim();
  if (!raw) return null;
  try {
    if (raw.includes('://')) return new URL(raw).hostname || null;
  } catch {
    /* ليس URL كامل */
  }
  return raw.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0] || null;
}

function hostnamesFromCsv(csv) {
  return (csv ?? '')
    .split(',')
    .map((part) => hostnameOf(part))
    .filter(Boolean);
}

const allowAllOrigins =
  process.env.CORS_ALLOW_ALL === 'true' ||
  process.env.CORS_ORIGINS?.trim() === '*';

/**
 * عند السماح للكل: لا نعرّف allowedDevOrigins أصلاً.
 * Next في وضع التطوير عند عدم التعريف يحذّر فقط ولا يحجب (mode=warn).
 * أي مصفوفة — حتى بالأنماط — تفعّل mode=block وقد تحجب IP مثل 172.x.
 */
const allowedDevOrigins = allowAllOrigins
  ? undefined
  : [
      ...new Set(
        [
          'localhost',
          '127.0.0.1',
          'mo.zerolag.live',
          '170.101.111.184',
          ...hostnamesFromCsv(process.env.ALLOWED_DEV_ORIGINS),
          ...hostnamesFromCsv(process.env.CORS_ORIGINS).filter((h) => h !== '*'),
          hostnameOf(process.env.ADMIN_WEB_URL),
          hostnameOf(process.env.API_URL),
          hostnameOf(process.env.NEXT_PUBLIC_API_URL),
        ].filter(Boolean),
      ),
    ];

const nextConfig = {
  transpilePackages: ['@isp/shared'],
  output: 'standalone',
  ...(allowedDevOrigins ? { allowedDevOrigins } : {}),
  // المتصفح يستدعي /api على نفس الأصل → Next يمرّرها للـ Nest (بدون CORS/mixed content)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiInternal}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
