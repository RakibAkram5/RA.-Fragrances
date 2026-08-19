import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Security headers applied to every response.
 *
 * Note on Content-Security-Policy: Next.js injects inline scripts for
 * hydration, so `script-src` must include 'unsafe-inline' unless a nonce
 * pipeline is used. Everything else is locked down. In development we also
 * allow 'unsafe-eval' (required by the React/HMR runtime only in dev).
 *
 * `frame-ancestors` / `X-Frame-Options` are intentionally omitted so the
 * app can be embedded by the development preview proxy. When deploying on
 * your own production domain, add `frame-ancestors 'self'` back.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors *",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    // TypeScript errors still fail the build; ESLint runs via `npm run lint`.
    ignoreDuringBuilds: true,
  },
  images: {
    // Product images are served from /api/files/* (self-hosted), so we keep
    // the default optimizer for any `next/image` usage on trusted sources.
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
