import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the project root (a stray lockfile in the home folder would otherwise confuse it).
  turbopack: { root: __dirname },
  // Dev only: let phones/tablets on the local network load the dev server's scripts
  // (open http://192.168.1.213:3000). Has no effect on the production build.
  allowedDevOrigins: ["192.168.1.213"],
  images: { formats: ["image/avif", "image/webp"] },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
