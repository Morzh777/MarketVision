/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn1.ozone.ru',
      },
      {
        protocol: 'https',
        hostname: 'ir.ozone.ru',
      },
      {
        protocol: 'https',
        hostname: '*.wbbasket.ru',
      },
    ],
  },
  sassOptions: {
    includePaths: ['./src/app/styles'],
  },
};

module.exports = nextConfig;
