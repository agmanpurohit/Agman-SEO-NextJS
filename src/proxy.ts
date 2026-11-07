import { NextResponse, type NextRequest } from "next/server";

/**
 * Runs before every API request.
 * - Blocks cross-site form posts and admin actions (CSRF): a request that changes data must come
 *   from a page on this site. Browsers always send Origin / Sec-Fetch-Site on such requests,
 *   and other websites cannot fake them.
 * - Caps request body size so oversized payloads are refused before any work is done.
 */
const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);
const MAX_JSON_BYTES = 1_000_000; // blog posts are the largest JSON bodies
const MAX_UPLOAD_BYTES = 4_500_000; // image uploads (4 MB + form overhead)

export function proxy(req: NextRequest) {
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
  const limit = req.nextUrl.pathname === "/api/admin/blog/media" ? MAX_UPLOAD_BYTES : MAX_JSON_BYTES;
  if (length > limit) return deny("Request too large.", 413);

  return NextResponse.next();
}

const deny = (error: string, status: number) => NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

export const config = { matcher: ["/api/:path*"] };
