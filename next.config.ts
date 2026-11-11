import type { NextConfig } from "next";

// A new value on every deploy: the git commit on Vercel, otherwise the build time.
// Drives image cache-busting (src/lib/asset.ts) and the "new version is live" check.
const BUILD_ID = (process.env.VERCEL_GIT_COMMIT_SHA || Date.now().toString(36)).slice(0, 8);
// When this version was built: the honest "last modified" date for pages that only change on deploy.
const BUILT_AT = new Date().toISOString();

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content Security Policy: the browser only runs scripts, loads styles and connects to the
 * sources listed here, so injected code can't load from or send data to anywhere else.
 * Google Tag Manager + GA4 are allowed. If you add other tags in GTM (Meta Pixel, Hotjar…),
 * add their domains below or the browser will block them.
 * 'unsafe-inline' is needed for Next.js's inline bootstrap scripts on static pages
 * (a nonce would force every page to render on each request and slow the site down).
 */
const GOOGLE = "https://www.googletagmanager.com https://*.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com";
// Microsoft Clarity (src/components/seo/Clarity.tsx).
const CLARITY = "https://www.clarity.ms https://*.clarity.ms https://c.bing.com";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${GOOGLE} ${CLARITY} https://vercel.live${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${GOOGLE} ${CLARITY} https://www.google.com https://vercel.live wss://ws-us3.pusher.com${isDev ? " ws: http://localhost:*" : ""}`,
  "frame-src https://www.googletagmanager.com https://vercel.live",
  "media-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Browsers only ever talk to the site over HTTPS (2 years, eligible for the preload list).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // No other site can show this one inside a frame (stops clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Isolates the site's window from pop-ups/openers on other origins.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Turns off device features the site never uses.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), hid=(), midi=(), magnetometer=(), gyroscope=(), accelerometer=(), display-capture=(), browsing-topics=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  // Pin the project root (a stray lockfile in the home folder would otherwise confuse it).
  turbopack: { root: __dirname },
  env: { NEXT_PUBLIC_BUILD_ID: BUILD_ID, SITE_BUILT_AT: BUILT_AT },
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
  // Smaller production bundles: drop console.log/info/debug (errors and warnings stay for debugging).
  compiler: isDev ? undefined : { removeConsole: { exclude: ["error", "warn"] } },
  // Never ship readable source code to browsers.
  productionBrowserSourceMaps: false,
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
      { source: "/:path*", headers: securityHeaders },
      // Admin pages and API answers are never stored by browsers or shared caches.
      { source: "/admin/:path*", headers: [{ key: "Cache-Control", value: "private, no-store" }, { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet, noimageindex" }] },
      { source: "/api/admin/:path*", headers: [{ key: "Cache-Control", value: "private, no-store" }] },
      // API responses are data, never search results (blog images under /api/blog/media stay indexable).
      { source: "/api/:path((?!blog/media/).*)", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
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
