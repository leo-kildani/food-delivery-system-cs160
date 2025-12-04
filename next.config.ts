import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      // redirect root dir to home page
      {
        source: "/",
        destination: "/home",
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      //ALL Image Configurations
      // Pexels
      {
        protocol: "https",
        hostname: "einaglkpeyyoqnaupzqr.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/product-images/products/**",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: 'https',
        hostname: 'simmerandsage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.gourmetfoodstore.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'einaglkpeyyoqnaupzqr.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.istockphoto.com',
        port: '',
        pathname: '/**',
      },

    ],
  },
};

export default nextConfig;
