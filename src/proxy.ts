import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import { neon } from "@neondatabase/serverless";
import { matchRedirect, PROTECTED, type RedirectRule } from "@/lib/site/redirect-match";

/**
 * Runs before requests.
 * API requests:
 * - Blocks cross-site form posts and admin actions (CSRF): a request that changes data must come
 *   from a page on this site. Browsers always send Origin / Sec-Fetch-Site on such requests,
 *   and other websites cannot fake them.
 * - Caps request body size so oversized payloads are refused before any work is done.
 * Page requests:
 * - Applies redirects managed in Admin → SEO → Redirects. The list is kept in memory and
 *   refreshed every 30 seconds, so normal page loads never wait on the database.
 */
const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);
const MAX_JSON_BYTES = 1_000_000; // blog posts are the largest JSON bodies
const MAX_UPLOAD_BYTES = 4_500_000; // image uploads (4 MB + form overhead)
const REDIRECT_TTL_MS = 30_000;

let redirectCache: { at: number; rules: RedirectRule[] } | null = null;
let loading: Promise<RedirectRule[]> | null = null;

function db() {
  const url = process.env.DATABASE_URL;
  return url ? neon(url) : null;
}

async function redirectRules(): Promise<RedirectRule[]> {
  if (redirectCache && Date.now() - redirectCache.at < REDIRECT_TTL_MS) return redirectCache.rules;
  if (!loading) {
    loading = (async () => {
      try {
        const q = db();
        if (!q) return [];
        const rows = (await q`SELECT id, source, destination, status FROM redirects WHERE enabled = true`) as RedirectRule[];
        redirectCache = { at: Date.now(), rules: rows };
        return rows;
      } catch {
        // Table not created yet or database unreachable: keep serving pages, retry later.
        redirectCache = { at: Date.now(), rules: redirectCache?.rules ?? [] };
        return redirectCache.rules;
      } finally {
        loading = null;
      }
    })();
  }
  return loading;
}

export async function proxy(req: NextRequest, event: NextFetchEvent) {
  const path = req.nextUrl.pathname;

  if (!path.startsWith("/api/")) {
    if ((req.method === "GET" || req.method === "HEAD") && !PROTECTED.test(path)) {
      const hit = matchRedirect(path, await redirectRules());
      if (hit) {
        const target = new URL(hit.location, req.nextUrl.origin);
        if (!/^https?:\/\//i.test(hit.location)) target.search = req.nextUrl.search; // keep ?utm etc.
        if (target.toString() !== req.nextUrl.toString()) {
          const q = db();
          if (q) event.waitUntil(q`UPDATE redirects SET hits = hits + 1, last_hit = now() WHERE id = ${hit.rule.id}`.then(() => undefined).catch(() => undefined));
          return NextResponse.redirect(target, hit.rule.status);
        }
      }
    }
    return NextResponse.next();
  }

  if (SAFE.has(req.method)) return NextResponse.next();

  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return deny("Cross-site request blocked.", 403);

  const origin = req.headers.get("origin");
  if (origin) {
    let host = "";
    try {
      host = new URL(origin).host;
    } catch {
      return deny("Bad origin.", 403);
    }
    const expected = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (host !== expected) return deny("Cross-site request blocked.", 403);
  }

  const length = Number(req.headers.get("content-length") || 0);
  const limit = path === "/api/admin/blog/media" ? MAX_UPLOAD_BYTES : MAX_JSON_BYTES;
  if (length > limit) return deny("Request too large.", 413);

  return NextResponse.next();
}

const deny = (error: string, status: number) => NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

export const config = {
  matcher: [
    "/api/:path*",
    // Pages (for redirects). Skips framework files, images and other static assets.
    "/((?!api/|_next/|images/|brand/|favicon\\.ico|icon\\.svg|.*\\.(?:png|jpe?g|webp|avif|gif|svg|ico|css|js|map|woff2?|ttf|txt|xml|webmanifest)$).*)",
  ],
};
