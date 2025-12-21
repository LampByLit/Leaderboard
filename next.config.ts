import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable SWC to avoid build issues on Railway
  experimental: {
    // Disable SWC compiler
    forceSwcTransforms: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
        port: '',
        pathname: '/images/**',
      },
    ],
  },
};

export default nextConfig;
