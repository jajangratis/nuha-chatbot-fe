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
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-src 'self' https://nuha.care http://nuha.care; child-src 'self' https://nuha.care http://nuha.care;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
