import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  transpilePackages: ['@emu8086/react'],
  turbopack: {
    root: '../../',
  },
};

export default nextConfig;
