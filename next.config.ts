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
      // Pexels
      {
        protocol: "https",
        hostname: "images.pexels.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
