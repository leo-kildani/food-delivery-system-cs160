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
  env: {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_SERVICE_ROLE_KEY: process.env.NEXT_SERVICE_ROLE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
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
