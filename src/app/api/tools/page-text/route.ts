import { NextResponse } from "next/server";
import { load } from "cheerio";
import { safeFetch, normaliseUrl, UnsafeUrlError } from "@/lib/audit/net";
import { overLimit, clientIp, hashIp } from "@/lib/audit/ratelimit";
import { ensureSchema } from "@/lib/audit/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const clean = (s: string) => s.replace(/\s+/g, " ").trim();

/**
 * Keyword density checker: fetches one public page (SSRF-safe, size and time capped) and
 * returns its readable text plus title, meta description and H1s. Nothing is stored.
 */
export async function POST(req: Request) {
  let url = "";
  try {
    const b = await req.json();
    url = typeof b.url === "string" ? b.url.slice(0, 2048) : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  let target: URL;
  try {
    target = normaliseUrl(url);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 422 });
  }

  try {
    await ensureSchema();
    if (await overLimit(`tool-text:${hashIp(clientIp(req))}`, 40, 3600)) {
      return NextResponse.json({ error: "You've checked a lot of pages in the last hour. Please try again a little later, or paste the text instead." }, { status: 429 });
    }
  } catch (e) {
    console.error("tool rate limit unavailable", e);
  }

  try {
    const r = await safeFetch(target.toString(), { maxBytes: 3_000_000, timeoutMs: 12_000 });
    if (r.status === 0) return NextResponse.json({ error: `We couldn't reach that page (${r.error ?? "connection failed"}).` }, { status: 502 });
    if (r.status >= 400) return NextResponse.json({ error: `The page answered with HTTP ${r.status}, so there's no content to analyse.` }, { status: 502 });
    if (!/html|xml/i.test(r.headers["content-type"] ?? "text/html")) return NextResponse.json({ error: "That URL isn't an HTML page." }, { status: 422 });

    const $ = load(r.body);
    const title = clean($("title").first().text());
    const metaDescription = clean($('meta[name="description" i]').attr("content") ?? "");
    const h1 = $("h1")
      .map((_, el) => clean($(el).text()))
      .get()
      .filter(Boolean)
      .slice(0, 5);
    // Prefer the page's main content area; fall back to the whole body.
    const scope = $("article").first().length ? $("article").first() : $("main").first().length ? $("main").first() : $("body");
    const body = scope.clone();
    body
      .find(
        "script, style, noscript, template, svg, iframe, nav, header, footer, aside, form, button, dialog, [role='dialog'], [role='navigation'], [role='banner'], [role='contentinfo'], [aria-hidden='true'], [hidden], .sr-only, .screen-reader-text",
      )
      .remove();
    // Keep block boundaries so sentences don't run together.
    body.find("p, li, h1, h2, h3, h4, h5, h6, td, th, br, div, section, article").each((_, el) => {
      $(el).append(" \n ");
    });
    const text = body.text().replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim().slice(0, 200_000);

    return NextResponse.json(
      { finalUrl: r.finalUrl, title, metaDescription, h1, text, truncated: r.truncated },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    if (e instanceof UnsafeUrlError) return NextResponse.json({ error: e.message }, { status: 422 });
    console.error("page-text failed", e);
    return NextResponse.json({ error: "Something went wrong fetching that page. Try pasting the text instead." }, { status: 500 });
  }
}
