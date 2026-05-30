import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  basePath: basePath || undefined,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nuha.care",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/tickets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
