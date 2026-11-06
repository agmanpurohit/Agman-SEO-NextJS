import "server-only";
import robotsParser from "robots-parser";
import { XMLParser } from "fast-xml-parser";
import { auditConfig } from "./config";
import { safeFetch } from "./net";
import type { SiteInfo } from "./types";

export type RobotsResult = NonNullable<SiteInfo["robots"]> & { text: string };

/** Fetches and interprets robots.txt for the site origin. */
export async function fetchRobots(origin: string): Promise<RobotsResult> {
  const url = `${origin}/robots.txt`;
  const r = await safeFetch(url, { accept: "text/plain,*/*;q=0.5", maxBytes: 500_000 });
  const isText = r.status === 200 && !/text\/html/i.test(r.headers["content-type"] ?? "") && !/<html/i.test(r.body.slice(0, 500));
  if (!isText) return { found: false, status: r.status, disallowAll: false, sitemaps: [], size: 0, text: "", error: r.error ?? (r.status === 200 ? "Returned HTML, not robots.txt" : `HTTP ${r.status}`) };
  const robots = robotsParser(url, r.body);
  const ua = auditConfig.userAgent;
  const disallowAll = robots.isDisallowed(`${origin}/`, ua) === true && robots.isDisallowed(`${origin}/`, "*") === true;
  return { found: true, status: 200, disallowAll, sitemaps: robots.getSitemaps().slice(0, 10), size: r.body.length, text: r.body.slice(0, 200_000) };
}

/** True when robots rules allow our crawler to fetch the URL. */
export function makeRobotsChecker(origin: string, text: string) {
  if (!text) return () => true;
  const robots = robotsParser(`${origin}/robots.txt`, text);
  return (url: string) => robots.isAllowed(url, auditConfig.userAgent) !== false;
}

const xml = new XMLParser({ ignoreAttributes: true, processEntities: false, isArray: (name) => name === "url" || name === "sitemap" });

/**
 * Finds sitemaps (robots.txt declarations, then common locations), follows sitemap indexes
 * one level, and returns the URLs on the audited host.
 */
export async function discoverSitemaps(origin: string, declared: string[], host: string) {
  const candidates = [...new Set([...declared, `${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`])];
  const results: NonNullable<SiteInfo["sitemaps"]> = [];
  const urls = new Set<string>();
  const queue = [...candidates];
  const seen = new Set<string>();
  const bare = host.replace(/^www\./, "");

  while (queue.length && seen.size < 8 && urls.size < auditConfig.maxSitemapUrls) {
    const sm = queue.shift()!;
    if (seen.has(sm)) continue;
    seen.add(sm);
    let r;
    try {
      r = await safeFetch(sm, { accept: "application/xml,text/xml,*/*;q=0.5", maxBytes: 5_000_000 });
    } catch (e) {
      results.push({ url: sm, ok: false, status: 0, urlCount: 0, isIndex: false, error: (e as Error).message });
      continue;
    }
    // Common locations that 404 aren't errors unless declared in robots.txt.
    if (r.status !== 200) {
      if (declared.includes(sm)) results.push({ url: sm, ok: false, status: r.status, urlCount: 0, isIndex: false, error: r.error ?? `HTTP ${r.status}` });
      continue;
    }
    if (/<html/i.test(r.body.slice(0, 1000))) {
      if (declared.includes(sm)) results.push({ url: sm, ok: false, status: 200, urlCount: 0, isIndex: false, error: "Returned an HTML page, not XML" });
      continue;
    }
    let doc: Record<string, unknown>;
    try {
      doc = xml.parse(r.body);
    } catch {
      results.push({ url: sm, ok: false, status: 200, urlCount: 0, isIndex: false, error: "Not valid XML" });
      continue;
    }
    const index = (doc.sitemapindex as { sitemap?: { loc?: string }[] } | undefined)?.sitemap;
    const set = (doc.urlset as { url?: { loc?: string }[] } | undefined)?.url;
    if (index) {
      results.push({ url: sm, ok: true, status: 200, urlCount: index.length, isIndex: true });
      for (const s of index.slice(0, 10)) if (s.loc) queue.push(String(s.loc).trim());
    } else if (set) {
      let n = 0;
      for (const u of set) {
        const loc = String(u.loc ?? "").trim();
        if (!loc) continue;
        n++;
        try {
          // Normalise (e.g. "https://site.com" → "https://site.com/") so it dedupes with crawled links.
          const u = new URL(loc);
          u.hash = "";
          if (u.hostname.replace(/^www\./, "") === bare && urls.size < auditConfig.maxSitemapUrls) urls.add(u.toString());
        } catch {
          /* ignore malformed */
        }
      }
      results.push({ url: sm, ok: true, status: 200, urlCount: n, isIndex: false });
    } else {
      results.push({ url: sm, ok: false, status: 200, urlCount: 0, isIndex: false, error: "XML has no <urlset> or <sitemapindex>" });
    }
  }
  return { sitemaps: results, urls: [...urls] };
}
