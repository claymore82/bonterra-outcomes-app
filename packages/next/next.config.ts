import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@bonterratech/stitch-tokens',
    '@bonterratech/stitch-extension',
  ],
};

export default nextConfig;

