/** @type {import('next').NextConfig} */
const apiInternal =
  process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:3001';

const nextConfig = {
  transpilePackages: ['@isp/shared'],
  output: 'standalone',
  // يسمح بفتح واجهة التطوير عبر الدومين/IP البعيد
  allowedDevOrigins: [
    'mo.zerolag.live',
    '170.101.111.184',
    'localhost',
    '127.0.0.1',
  ],
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
