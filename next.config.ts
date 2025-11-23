import type { NextConfig } from "next";
// @ts-ignore - next-pwa doesn't have proper type definitions
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Fix for face-api.js - prevent fs module from being bundled in client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'talaash.thejaayveeworld.com',
      },
    ],
  },
};

// Only apply PWA in production to avoid warnings in development
// This prevents the "GenerateSW has been called multiple times" warning
// The disable flag ensures the plugin doesn't run in development even if loaded
const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // Completely disable in development to prevent multiple GenerateSW calls
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/app-build-manifest\.json$/],
  sw: 'sw.js',
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
        },
      },
    },
  ],
});

export default pwaConfig(nextConfig);

