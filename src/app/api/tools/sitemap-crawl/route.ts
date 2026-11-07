import { NextResponse } from "next/server";
import { load } from "cheerio";
import { safeFetch, normaliseUrl, UnsafeUrlError } from "@/lib/audit/net";
import { normaliseLink } from "@/lib/audit/parse";
import { fetchRobots, makeRobotsChecker } from "@/lib/audit/discover";
import { overLimit, clientIp, hashIp } from "@/lib/audit/ratelimit";
import { ensureSchema } from "@/lib/audit/db";
import { logToolUse } from "@/lib/tools/log-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TIME_BUDGET_MS = 45_000;
const CONCURRENCY = 6;
const SKIP_EXT = /\.(jpe?g|png|gif|webp|avif|svg|ico|pdf|zip|rar|gz|mp4|mp3|webm|mov|avi|css|js|json|xml|txt|docx?|xlsx?|pptx?|woff2?|ttf|eot)$/i;

type Found = { url: string; depth: number; lastmod?: string };
type Skipped = { url: string; reason: string };

/**
 * Sitemap generator crawl: follows internal links from the start URL (same host only),
 * obeys robots.txt, and keeps only indexable 200 HTML pages whose canonical is themselves.
 * SSRF-safe fetching, rate-limited, time-boxed. The crawl is recorded in the tool-usage log.
 */
export async function POST(req: Request) {
  let input = "";
  let max = 100;
  let sid: unknown;
  try {
    const b = await req.json();
    sid = b.sid;
    input = typeof b.url === "string" ? b.url.slice(0, 2048) : "";
    max = Math.min(250, Math.max(10, Number(b.max) || 100));
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  let start: URL;
  try {
    start = normaliseUrl(input);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 422 });
  }

  try {
    await ensureSchema();
    if (await overLimit(`tool-sitemap:${hashIp(clientIp(req))}`, 10, 3600)) {
      return NextResponse.json({ error: "You've run several crawls in the last hour. Please try again later, or paste your URLs instead." }, { status: 429 });
    }
  } catch (e) {
    console.error("tool rate limit unavailable", e);
  }

  const began = Date.now();
  try {
    // Follow a redirect on the start URL (e.g. http → https, apex → www) to find the real host.
    const first = await safeFetch(start.toString(), { method: "GET", maxBytes: 2_000_000 });
    if (first.status === 0) return NextResponse.json({ error: `We couldn't reach that site (${first.error ?? "connection failed"}).` }, { status: 502 });
    const root = new URL(first.finalUrl);
    const host = root.hostname;
    const origin = root.origin;
    const robots = await fetchRobots(origin);
    const allowed = makeRobotsChecker(origin, robots.text);

    const seen = new Set<string>();
    const queue: { url: string; depth: number }[] = [{ url: root.toString(), depth: 0 }];
    seen.add(root.toString());
    const found: Found[] = [];
    const skipped: Skipped[] = [];
    let timedOut = false;

    const visit = async ({ url, depth }: { url: string; depth: number }) => {
      if (!allowed(url)) return void skipped.push({ url, reason: "Blocked by robots.txt" });
      const r = url === root.toString() ? first : await safeFetch(url, { maxBytes: 2_000_000, timeoutMs: 10_000 });
      if (r.status === 0) return void skipped.push({ url, reason: r.error ?? "Couldn't load" });
      if (r.redirects.length && url !== root.toString()) {
        const dest = normaliseLink(r.finalUrl, url);
        if (dest && new URL(dest).hostname === host && !seen.has(dest)) {
          seen.add(dest);
          queue.push({ url: dest, depth });
        }
        return void skipped.push({ url, reason: "Redirects" });
      }
      if (r.status !== 200) return void skipped.push({ url, reason: `HTTP ${r.status}` });
      if (!/text\/html|application\/xhtml/i.test(r.headers["content-type"] ?? "")) return void skipped.push({ url, reason: "Not an HTML page" });
      const $ = load(r.body);
      const robotsMeta = `${$('meta[name="robots" i]').attr("content") ?? ""} ${r.headers["x-robots-tag"] ?? ""}`.toLowerCase();
      const canonicalRaw = $('link[rel="canonical" i]').attr("href");
      const canonical = canonicalRaw ? normaliseLink(canonicalRaw, r.finalUrl) : null;

      // Links are followed even from noindex pages (they can still lead to indexable ones).
      if (!/nofollow/.test(robotsMeta)) {
        $("a[href]").each((_, el) => {
          const rel = ($(el).attr("rel") ?? "").toLowerCase();
          if (rel.includes("nofollow")) return;
          const link = normaliseLink($(el).attr("href") ?? "", r.finalUrl);
          if (!link) return;
          const u = new URL(link);
          if (u.hostname !== host || SKIP_EXT.test(u.pathname) || seen.has(link)) return;
          seen.add(link);
          queue.push({ url: link, depth: depth + 1 });
        });
      }

      if (/noindex/.test(robotsMeta)) return void skipped.push({ url, reason: "noindex" });
      if (canonical && canonical.replace(/\/$/, "") !== r.finalUrl.replace(/\/$/, "")) return void skipped.push({ url, reason: "Canonical points elsewhere" });
      const lm = r.headers["last-modified"] ? new Date(r.headers["last-modified"]) : null;
      found.push({ url: r.finalUrl, depth, lastmod: lm && !isNaN(lm.getTime()) ? lm.toISOString().slice(0, 10) : undefined });
    };

    while (queue.length && found.length < max) {
      if (Date.now() - began > TIME_BUDGET_MS) {
        timedOut = true;
        break;
      }
      queue.sort((a, b) => a.depth - b.depth);
      const batch = queue.splice(0, Math.min(CONCURRENCY, max - found.length));
      await Promise.all(batch.map((item) => visit(item).catch(() => skipped.push({ url: item.url, reason: "Error" }))));
    }

    const unique = [...new Map(found.map((f) => [f.url, f])).values()].sort((a, b) => a.depth - b.depth || a.url.localeCompare(b.url));
    await logToolUse(req, {
      tool: "sitemap-generator",
      sessionId: sid,
      action: "crawl",
      summary: `Crawled ${origin} · ${Math.min(unique.length, max)} pages found`,
      data: { mode: "crawl", site: origin, maxPages: max, pagesFound: Math.min(unique.length, max), skipped: skipped.length, timedOut, urls: unique.slice(0, 250).map((u) => u.url) },
    });
    return NextResponse.json(
      {
        origin,
        pages: unique.slice(0, max),
        skipped: skipped.slice(0, 200),
        stats: { crawled: unique.length + skipped.length, remaining: queue.length, timedOut, hitLimit: unique.length >= max, robotsFound: robots.found, seconds: Math.round((Date.now() - began) / 1000) },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    if (e instanceof UnsafeUrlError) return NextResponse.json({ error: e.message }, { status: 422 });
    console.error("sitemap crawl failed", e);
    return NextResponse.json({ error: "The crawl failed. Try again, or paste your URLs instead." }, { status: 500 });
  }
}
