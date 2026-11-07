import type { NextConfig } from "next";

// A new value on every deploy: the git commit on Vercel, otherwise the build time.
// Drives image cache-busting (src/lib/asset.ts) and the "new version is live" check.
const BUILD_ID = (process.env.VERCEL_GIT_COMMIT_SHA || Date.now().toString(36)).slice(0, 8);

const nextConfig: NextConfig = {
  // Pin the project root (a stray lockfile in the home folder would otherwise confuse it).
  turbopack: { root: __dirname },
  env: { NEXT_PUBLIC_BUILD_ID: BUILD_ID },
  experimental: {
    // How long an open tab reuses a page it already loaded before fetching it again
    // (Next.js default is 5 minutes for static pages; 30s is the minimum allowed).
    staleTimes: { dynamic: 0, static: 30 },
  },
  // Dev only: let phones/tablets on the local network load the dev server's scripts
  // (open http://192.168.1.213:3000). Has no effect on the production build.
  allowedDevOrigins: ["192.168.1.213"],
  images: {
    formats: ["image/avif", "image/webp"],
    // Local images may carry ?v=<build> (see asset()); blog uploads are served from the API route.
    localPatterns: [{ pathname: "/images/**" }, { pathname: "/brand/**" }, { pathname: "/api/blog/media/**" }],
  },
  poweredByHeader: false,
  // The old Vercel address redirects to the canonical domain, keeping the path.
  // www ↔ non-www is deliberately NOT handled here: that choice lives in Vercel → Settings →
  // Domains. Doing it in both places creates a redirect loop if the two ever disagree.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "agmanrajpurohit.vercel.app" }],
        destination: "https://agmanrajpurohit.com/:path*",
        permanent: true,
      },
    ];
  },
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
      // Preview deployments live on *.vercel.app; keep them out of search results.
      {
        source: "/:path*",
        has: [{ type: "host", value: "(?<sub>.*)\\.vercel\\.app" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
