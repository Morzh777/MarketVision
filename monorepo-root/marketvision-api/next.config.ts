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
    remotePatterns: IMAGE_CONFIG.REMOTE_PATTERNS,
  },
  sassOptions: {
    includePaths: ['./src/app/styles'],
  },
};

export default nextConfig;
