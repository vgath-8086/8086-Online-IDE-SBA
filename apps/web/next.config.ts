import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isProd ? '/8086-Online-IDE-SBA' : '',
  images: {
    unoptimized: true,
  },
  transpilePackages: ['@emu8086/react'],
  turbopack: {
    root: '../../',
  },
};

export default nextConfig;
