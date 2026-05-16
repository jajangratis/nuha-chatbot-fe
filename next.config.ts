import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nuha.care",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
