import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

    ],
  },
};

export default nextConfig;
