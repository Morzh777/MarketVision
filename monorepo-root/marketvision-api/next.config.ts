import type { NextConfig } from 'next';

import { IMAGE_CONFIG } from './src/config/settings';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [...IMAGE_CONFIG.REMOTE_PATTERNS],
    // Кеширование изображений
    minimumCacheTTL: 600, // 10 минут
    // Оптимизация изображений
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Кеширование статических файлов
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['echarts', 'echarts-for-react'],
  },
  // Заголовки кеширования
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=600, stale-while-revalidate=300', // 10 минут + 5 мин stale
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=600, stale-while-revalidate=300', // 10 минут + 5 мин stale
          },
        ],
      },
    ];
  },
  sassOptions: {
    includePaths: ['./src/app/styles'],
  },
};

export default nextConfig;
