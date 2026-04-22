/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production';
const backendOrigin = process.env.BACKEND_ORIGIN || (isProduction ? 'https://email-scheduler-system-duck.onrender.com' : 'http://localhost:3001');

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
