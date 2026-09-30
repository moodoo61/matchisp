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

const allowedDevOrigins = allowAllOrigins
  ? [
      // مؤقت: أنماط واسعة لـ Next dev (IP وعدة مستويات نطاق)
      '*',
      '*.*',
      '*.*.*',
      '*.*.*.*',
      '*.*.*.*.*',
      'localhost',
      '127.0.0.1',
      ...hostnamesFromCsv(process.env.ALLOWED_DEV_ORIGINS),
    ]
  : [
      ...new Set(
        [
          'localhost',
          '127.0.0.1',
          'mo.zerolag.live',
          '170.101.111.184',
          ...hostnamesFromCsv(process.env.ALLOWED_DEV_ORIGINS),
          ...hostnamesFromCsv(process.env.CORS_ORIGINS),
          hostnameOf(process.env.ADMIN_WEB_URL),
          hostnameOf(process.env.API_URL),
          hostnameOf(process.env.NEXT_PUBLIC_API_URL),
        ].filter(Boolean),
      ),
    ];

const nextConfig = {
  transpilePackages: ['@isp/shared'],
  output: 'standalone',
  // يسمح بفتح واجهة التطوير عبر IP/دومين بعيد (ليس localhost فقط)
  allowedDevOrigins,
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
