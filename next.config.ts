import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable Cache Components for improved caching with use cache directive
  cacheComponents: true,

  // Configure server packages to externalize native Node.js modules
  // This prevents Next.js from trying to bundle them
  serverExternalPackages: ["canvas", "sharp"],

  // Configure cache life profiles for different use cases
  cacheLife: {
    // User role checks can be cached longer since they change infrequently
    "user-role": {
      stale: 3600, // 1 hour - serve stale content
      revalidate: 3600, // 1 hour - revalidate in background
      expire: 86400, // 24 hours - hard expiration
    },
    // Session data should be cached for shorter periods
    session: {
      stale: 300, // 5 minutes
      revalidate: 300, // 5 minutes
      expire: 1800, // 30 minutes
    },
    // Admin checks can be cached longer
    "admin-check": {
      stale: 7200, // 2 hours
      revalidate: 7200, // 2 hours
      expire: 86400, // 24 hours
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "github.com",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "framerusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // Optimize for modern browsers
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
