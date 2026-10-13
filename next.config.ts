import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL ?? (process.env.NODE_ENV === "production" ? "" : "http://localhost:4000");

if (!/^https?:\/\/[^/]+/.test(backendUrl)) {
  throw new Error("BACKEND_URL must be set to the NestJS base URL (e.g. http://localhost:4000).");
}

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // The browser only talks to this origin; NestJS sets the HttpOnly auth cookies through this proxy.
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${backendUrl.replace(/\/$/, "")}/:path*` }];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
