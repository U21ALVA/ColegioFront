/** @type {import('next').NextConfig} */
const internalApiUrl = process.env.INTERNAL_API_URL || 'http://localhost:8080';

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${internalApiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;