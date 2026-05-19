import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@emu8086/react'],
  turbopack: {
    root: '../../',
  },
};

export default nextConfig;
