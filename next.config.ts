import type { NextConfig } from "next";

const IS_DEV = process.env.NODE_ENV === "development";

/**
 * Content-Security-Policy header sent on every page response.
 *
 * Strict CSP prevents XSS even if DOMPurify were bypassed:
 * - No inline scripts or event handlers execute.
 * - External resources restricted to nuha.care origin.
 * - In development, unsafe-inline styles allowed for HMR.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self'${IS_DEV ? " 'unsafe-eval'" : ""}`,
  IS_DEV
    ? "style-src 'self' 'unsafe-inline' https://nuha.care"
    : "style-src 'self' https://nuha.care",
  `img-src 'self' data: https://nuha.care https:`,
  `font-src 'self' https://nuha.care https://fonts.gstatic.com`,
  `connect-src 'self' https://nuha.care`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
].join("; ");

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

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: CONTENT_SECURITY_POLICY,
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
