import "server-only";
import { CHECK_BY_ID } from "./checks-meta";
import type { Affected, Category, Finding, PageData, SiteInfo, Status, PageSpeedResult } from "./types";

export type QueueRow = { url: string; depth: number; source: string | null; status: string; reason: string | null };
export type Ctx = { pages: PageData[]; site: SiteInfo; queue: QueueRow[]; startUrl: string };

// ───────────────────────── helpers ─────────────────────────
const MAX_AFFECTED = 200;

function make(id: string, affected: Affected[], o: { status?: Status; summary?: string; details?: Record<string, unknown> } = {}): Finding {
  const m = CHECK_BY_ID[id];
  if (!m) throw new Error(`Unknown check ${id}`);
  const failing = m.severity === "critical" || m.severity === "high" ? "error" : "warning";
  const status: Status = o.status ?? (affected.length ? failing : "passed");
  const n = affected.length;
  const summary =
    o.summary ??
    (status === "passed" ? "No issues found." : status === "na" ? "Not applicable to this site." : status === "not_tested" ? "Could not be tested." : `${n} ${n === 1 ? "item" : "items"} affected.`);
  return { checkId: id, category: m.category, severity: m.severity, status, title: m.title, summary, affected: affected.slice(0, MAX_AFFECTED), details: { ...o.details, ...(n > MAX_AFFECTED ? { totalAffected: n } : {}) } };
}

const noindex = (p: PageData) => /noindex/i.test(p.metaRobots ?? "") || /noindex/i.test(p.xRobots ?? "");
const html200 = (p: PageData) => p.isHtml && p.status === 200 && !p.error;
const indexable = (p: PageData) => html200(p) && !noindex(p) && !(p.canonical && p.canonical !== p.finalUrl && sameUrl(p.canonical) !== sameUrl(p.finalUrl));
const sameUrl = (u: string) => {
  try {
    const x = new URL(u);
    return `${x.hostname.replace(/^www\./, "")}${x.pathname.replace(/\/$/, "") || "/"}${x.search}`.toLowerCase();
  } catch {
    return u;
  }
};
const UTILITY = /(contact|login|log-in|signin|sign-in|register|account|cart|basket|checkout|privacy|terms|cookie|legal|thank|search|tag\/|author\/|wp-admin|feed)/i;
const STOP = new Set("a an and the of for to in on at by with from your you our is are be as or it this that we us best top new home page | - – — & about".split(" "));
const keyTerms = (s: string) => (s.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? []).filter((w) => !STOP.has(w));
const groupBy = <T,>(xs: T[], k: (x: T) => string | null | undefined) => {
  const m = new Map<string, T[]>();
  for (const x of xs) {
    const key = k(x);
    if (!key) continue;
    m.set(key, [...(m.get(key) ?? []), x]);
  }
  return m;
};
const fmtBytes = (b: number) => (b >= 1_000_000 ? `${(b / 1_000_000).toFixed(1)} MB` : `${Math.round(b / 1000)} KB`);

// ───────────────────────── technical ─────────────────────────
function technical({ pages, site, queue, startUrl }: Ctx): Finding[] {
  const f: Finding[] = [];
  const byUrl = new Map(pages.map((p) => [p.url, p]));

  f.push(make("tech.https", site.https ? [] : [{ url: site.origin }], { summary: site.https ? "The site is served over HTTPS." : "The site is not served over HTTPS." }));
  f.push(
    site.httpRedirectsToHttps == null
      ? make("tech.http-redirect", [], { status: "not_tested", summary: "The http:// version could not be reached to test." })
      : make("tech.http-redirect", site.httpRedirectsToHttps ? [] : [{ url: site.origin.replace(/^https:/, "http:"), note: "Does not redirect to https://" }]),
  );
  f.push(
    !site.wwwVariant
      ? make("tech.www", [], { status: "na", summary: "The alternate www/non-www hostname doesn’t resolve, so there is no duplicate host." })
      : make("tech.www", site.wwwVariant.consistent ? [] : [{ url: site.wwwVariant.url, note: `Ends on ${site.wwwVariant.finalUrl} (status ${site.wwwVariant.status})` }], {
          summary: site.wwwVariant.consistent ? "Both hostnames resolve to the same site." : "The www and non-www versions don’t consolidate to one host.",
        }),
  );

  const e4 = pages.filter((p) => p.status >= 400 && p.status < 500);
  const e5 = pages.filter((p) => p.status >= 500);
  f.push(make("tech.4xx", e4.map((p) => ({ url: p.url, note: `HTTP ${p.status}` }))));
  f.push(make("tech.5xx", e5.map((p) => ({ url: p.url, note: `HTTP ${p.status}` }))));
  f.push(make("tech.redirect-chain", pages.filter((p) => p.redirects.length >= 2).map((p) => ({ url: p.url, note: `${p.redirects.length} hops → ${p.finalUrl}` }))));
  f.push(make("tech.redirect-loop", pages.filter((p) => p.error === "Redirect loop" || p.error === "Too many redirects").map((p) => ({ url: p.url, note: p.error }))));

  // Broken internal links: link targets we crawled that failed.
  const bad = new Set(pages.filter((p) => p.status >= 400 || p.status === 0).map((p) => p.url));
  const broken: Affected[] = [];
  for (const p of pages) for (const l of p.links) if (l.internal && bad.has(l.href)) broken.push({ url: p.url, note: `→ ${l.href} (${byUrl.get(l.href)?.status || "failed"})` });
  f.push(make("tech.broken-links", broken, { details: { checkedTargets: pages.length } }));

  const r = site.robots;
  f.push(r ? make("tech.robots", r.found ? [] : [{ url: `${site.origin}/robots.txt`, note: r.error ?? `HTTP ${r.status}` }]) : make("tech.robots", [], { status: "not_tested" }));
  if (!r || !r.found) f.push(make("tech.robots-config", [], { status: r ? "na" : "not_tested", summary: "No robots.txt to evaluate." }));
  else if (r.disallowAll) f.push(make("tech.robots-config", [{ url: `${site.origin}/robots.txt`, note: "Disallows the whole site for all crawlers" }]));
  else if (!r.sitemaps.length) f.push(make("tech.robots-config", [{ url: `${site.origin}/robots.txt`, note: "No Sitemap: directive" }], { status: "warning", summary: "robots.txt allows crawling but doesn’t declare a sitemap." }));
  else f.push(make("tech.robots-config", [], { summary: "Crawling is allowed and a sitemap is declared." }));

  const sm = site.sitemaps ?? [];
  const okSm = sm.filter((s) => s.ok);
  f.push(make("tech.sitemap", okSm.length ? [] : [{ url: `${site.origin}/sitemap.xml`, note: "Not found" }], { summary: okSm.length ? `${okSm.length} sitemap file(s) found with ${site.sitemapUrls ?? 0} URLs.` : "No XML sitemap was found." }));
  if (!sm.length) f.push(make("tech.sitemap-valid", [], { status: "na", summary: "No sitemap to validate." }));
  else {
    const issues: Affected[] = sm.filter((s) => !s.ok || (!s.isIndex && s.urlCount === 0)).map((s) => ({ url: s.url, note: s.error ?? (s.ok ? "Contains no URLs" : `HTTP ${s.status}`) }));
    const smSet = new Set(queue.filter((q) => q.source === "sitemap").map((q) => q.url));
    for (const p of pages) if (smSet.has(p.url) && (p.status !== 200 || p.redirects.length)) issues.push({ url: p.url, note: p.redirects.length ? `Listed in sitemap but redirects to ${p.finalUrl}` : `Listed in sitemap but returns ${p.status}` });
    f.push(make("tech.sitemap-valid", issues, { status: issues.length ? "warning" : "passed" }));
  }

  const h = pages.filter(html200);
  f.push(make("tech.canonical-missing", h.filter((p) => !noindex(p) && !p.canonical).map((p) => ({ url: p.url }))));
  const conflicts: Affected[] = [];
  for (const p of h) {
    if ((p.canonicalCount ?? 0) > 1) conflicts.push({ url: p.url, note: `${p.canonicalCount} canonical tags` });
    else if (p.canonical) {
      try {
        if (new URL(p.canonical).hostname.replace(/^www\./, "") !== site.host.replace(/^www\./, "")) conflicts.push({ url: p.url, note: `Canonical points to another domain: ${p.canonical}` });
      } catch {
        conflicts.push({ url: p.url, note: "Invalid canonical URL" });
      }
      const target = byUrl.get(p.canonical);
      if (target && target.status !== 200) conflicts.push({ url: p.url, note: `Canonical target returns ${target.status}` });
      if (target && noindex(target)) conflicts.push({ url: p.url, note: "Canonical target is noindex" });
    }
  }
  f.push(make("tech.canonical-conflict", conflicts));

  const variants = [...groupBy(h, (p) => {
    try {
      const u = new URL(p.finalUrl);
      const params = [...u.searchParams.entries()].sort().map(([k, v]) => `${k}=${v}`).join("&");
      return `${u.hostname.replace(/^www\./, "")}${u.pathname.toLowerCase().replace(/\/$/, "")}?${params}`;
    } catch {
      return null;
    }
  }).values()].filter((g) => new Set(g.map((p) => p.finalUrl)).size > 1);
  f.push(make("tech.duplicate-urls", variants.flatMap((g) => g.map((p) => ({ url: p.finalUrl, note: `Same as ${g.find((x) => x.finalUrl !== p.finalUrl)?.finalUrl}` })))));

  f.push(make("tech.noindex", h.filter(noindex).map((p) => ({ url: p.url, note: p.xRobots && /noindex/i.test(p.xRobots) ? "X-Robots-Tag: noindex" : `meta robots: ${p.metaRobots}` }))));
  f.push(make("tech.nofollow", h.filter((p) => /nofollow/i.test(p.metaRobots ?? "")).map((p) => ({ url: p.url, note: p.metaRobots ?? "" }))));
  f.push(make("tech.depth", h.filter((p) => p.depth > 3 && p.depth < 99).map((p) => ({ url: p.url, note: `${p.depth} clicks deep` }))));

  // Orphans: sitemap URLs never linked from any crawled page.
  const smUrls = queue.filter((q) => q.source === "sitemap").map((q) => q.url);
  const crawlCapped = queue.some((q) => q.status === "skipped" && q.reason === "limit");
  if (!smUrls.length) f.push(make("tech.orphans", [], { status: "not_tested", summary: "Needs an XML sitemap to compare against." }));
  else if (crawlCapped)
    f.push(make("tech.orphans", [], { status: "not_tested", summary: "The crawl stopped at the page limit, so links from uncrawled pages can’t be ruled out. Orphan detection needs a complete crawl." }));
  else {
    const linked = new Set<string>([startUrl, site.origin + "/"]);
    for (const p of pages) for (const l of p.links) if (l.internal) linked.add(sameUrl(l.href));
    const orphans = smUrls.filter((u) => !linked.has(sameUrl(u)) && sameUrl(u) !== sameUrl(startUrl));
    f.push(make("tech.orphans", orphans.map((u) => ({ url: u, note: "In sitemap, not linked from crawled pages" })), { details: { sitemapUrlsCompared: smUrls.length } }));
  }

  const urlIssues: Affected[] = [];
  for (const p of h) {
    const u = new URL(p.finalUrl);
    const notes: string[] = [];
    if (p.finalUrl.length > 115) notes.push(`${p.finalUrl.length} chars`);
    if (/[A-Z]/.test(u.pathname)) notes.push("uppercase");
    if (/_/.test(u.pathname)) notes.push("underscores");
    if (/%20| /.test(u.pathname)) notes.push("spaces");
    if ([...u.searchParams.keys()].length > 3) notes.push(">3 parameters");
    if (notes.length) urlIssues.push({ url: p.finalUrl, note: notes.join(", ") });
  }
  f.push(make("tech.url-structure", urlIssues));

  const paths = [...new Set(pages.flatMap((p) => p.links.filter((l) => l.internal).map((l) => new URL(l.href).pathname)))].filter((x) => x !== "/" && !/\.[a-z0-9]{2,5}$/i.test(x));
  const slash = paths.filter((x) => x.endsWith("/")).length;
  const share = paths.length ? Math.min(slash, paths.length - slash) / paths.length : 0;
  f.push(
    paths.length < 5
      ? make("tech.trailing-slash", [], { status: "na", summary: "Too few internal paths to compare." })
      : make("tech.trailing-slash", share >= 0.2 ? [{ url: site.origin, note: `${slash} paths with slash, ${paths.length - slash} without` }] : [], {
          summary: share >= 0.2 ? "Internal links mix trailing-slash and non-slash URLs." : "Internal URLs use a consistent trailing-slash style.",
        }),
  );

  const hl = h.filter((p) => p.hreflang.length);
  if (!hl.length) f.push(make("tech.hreflang", [], { status: "na", summary: "No hreflang annotations found (only needed for multi-language/region sites)." }));
  else {
    const iss: Affected[] = [];
    for (const p of hl) {
      const bad = p.hreflang.filter((x) => !/^([a-z]{2,3}(-[a-z]{2,4})?(-[a-z]{2})?|x-default)$/i.test(x.lang));
      if (bad.length) iss.push({ url: p.url, note: `Invalid codes: ${bad.map((b) => b.lang).join(", ")}` });
      if (!p.hreflang.some((x) => sameUrl(x.href) === sameUrl(p.finalUrl))) iss.push({ url: p.url, note: "No self-referencing hreflang" });
      if (!p.hreflang.some((x) => x.lang.toLowerCase() === "x-default")) iss.push({ url: p.url, note: "No x-default" });
    }
    f.push(make("tech.hreflang", iss, { details: { pagesWithHreflang: hl.length } }));
  }

  f.push(make("tech.mixed-content", h.filter((p) => p.mixedContent.length).map((p) => ({ url: p.url, note: `${p.mixedContent.length} insecure resource(s), e.g. ${p.mixedContent[0]}` }))));
  f.push(make("tech.js-rendering", h.filter((p) => p.jsAppShell).map((p) => ({ url: p.url, note: `${p.wordCount} words in server HTML` }))));

  const pag = h.filter((p) => p.relNext || p.relPrev);
  f.push(make("tech.pagination", [], { status: pag.length ? "passed" : "na", summary: pag.length ? `${pag.length} page(s) use rel=next/prev. Make sure pages also link to each other normally.` : "No paginated series detected." }));

  const redirecting = new Map(pages.filter((p) => p.redirects.length && p.status < 400).map((p) => [p.url, p.finalUrl]));
  const ir: Affected[] = [];
  for (const p of pages) for (const l of p.links) if (l.internal && redirecting.has(l.href) && ir.length < 500) ir.push({ url: p.url, note: `→ ${l.href} redirects to ${redirecting.get(l.href)}` });
  f.push(make("tech.internal-redirects", ir));

  const nf = site.notFoundTest;
  f.push(!nf ? make("tech.soft-404", [], { status: "not_tested" }) : make("tech.soft-404", nf.status === 404 || nf.status === 410 ? [] : [{ url: nf.url, note: `Returned ${nf.status || "no response"} instead of 404` }]));
  return f;
}

// ───────────────────────── on-page ─────────────────────────
function onpage({ pages }: Ctx): Finding[] {
  const f: Finding[] = [];
  const ix = pages.filter(indexable);
  f.push(make("onpage.title-missing", ix.filter((p) => !p.title).map((p) => ({ url: p.url }))));
  const dupT = [...groupBy(ix, (p) => p.title?.toLowerCase()).entries()].filter(([, g]) => g.length > 1);
  f.push(make("onpage.title-duplicate", dupT.flatMap(([t, g]) => g.map((p) => ({ url: p.url, note: `“${t.slice(0, 70)}” (${g.length} pages)` })))));
  f.push(make("onpage.title-length", ix.filter((p) => p.title && (p.title.length < 30 || p.title.length > 60)).map((p) => ({ url: p.url, note: `${p.title!.length} chars: “${p.title!.slice(0, 80)}”` }))));
  f.push(make("onpage.title-multiple", pages.filter(html200).filter((p) => (p.titleCount ?? 0) > 1).map((p) => ({ url: p.url, note: `${p.titleCount} title tags` }))));
  f.push(make("onpage.meta-missing", ix.filter((p) => !p.metaDescription).map((p) => ({ url: p.url }))));
  const dupD = [...groupBy(ix, (p) => p.metaDescription?.toLowerCase()).entries()].filter(([, g]) => g.length > 1);
  f.push(make("onpage.meta-duplicate", dupD.flatMap(([d, g]) => g.map((p) => ({ url: p.url, note: `“${d.slice(0, 70)}…” (${g.length} pages)` })))));
  f.push(make("onpage.meta-length", ix.filter((p) => p.metaDescription && (p.metaDescription.length < 70 || p.metaDescription.length > 160)).map((p) => ({ url: p.url, note: `${p.metaDescription!.length} chars` }))));
  f.push(make("onpage.h1-missing", ix.filter((p) => !p.h1.filter(Boolean).length).map((p) => ({ url: p.url }))));
  f.push(make("onpage.h1-multiple", ix.filter((p) => p.h1.length > 1).map((p) => ({ url: p.url, note: `${p.h1.length} H1s` }))));
  f.push(
    make(
      "onpage.heading-hierarchy",
      ix
        .map((p) => {
          let skip: string | null = null;
          for (let i = 1; i < p.headingOrder.length && !skip; i++) if (p.headingOrder[i] - p.headingOrder[i - 1] > 1) skip = `H${p.headingOrder[i - 1]} → H${p.headingOrder[i]}`;
          return skip ? { url: p.url, note: skip } : null;
        })
        .filter(Boolean) as Affected[],
    ),
  );
  f.push(make("onpage.subheadings", ix.filter((p) => p.wordCount >= 300 && !p.h2.length).map((p) => ({ url: p.url, note: `${p.wordCount} words, no H2` }))));
  f.push(
    make(
      "onpage.title-h1-match",
      ix
        .filter((p) => p.title && p.h1[0])
        .filter((p) => {
          const a = new Set(keyTerms(p.title!));
          const b = keyTerms(p.h1[0]);
          return a.size > 0 && b.length > 0 && !b.some((w) => a.has(w));
        })
        .map((p) => ({ url: p.url, note: `Title “${p.title!.slice(0, 50)}” vs H1 “${p.h1[0].slice(0, 50)}”` })),
    ),
  );
  f.push(make("onpage.open-graph", ix.filter((p) => !p.og["og:title"] || !p.og["og:description"] || !p.og["og:image"]).map((p) => ({ url: p.url, note: ["og:title", "og:description", "og:image"].filter((k) => !p.og[k]).join(", ") + " missing" }))));
  f.push(make("onpage.twitter-card", ix.filter((p) => !p.twitter["twitter:card"]).map((p) => ({ url: p.url }))));
  f.push(make("onpage.text-ratio", ix.filter((p) => p.textRatio < 10).map((p) => ({ url: p.url, note: `${p.textRatio}% text` }))));
  const GENERIC = /^(click here|here|read more|more|learn more|this|link|go|continue|details|view more|see more)$/i;
  const gen: Affected[] = [];
  for (const p of ix) {
    const n = p.links.filter((l) => l.internal && GENERIC.test(l.text)).length;
    if (n) gen.push({ url: p.url, note: `${n} generic anchor(s)` });
  }
  f.push(make("onpage.anchor-text", gen));
  f.push(make("onpage.lang", pages.filter(html200).filter((p) => !p.lang).map((p) => ({ url: p.url }))));
  const ext = pages.reduce((n, p) => n + p.links.filter((l) => !l.internal).length, 0);
  f.push(make("onpage.external-links", [], { status: "passed", summary: `${ext} outbound links found across crawled pages (status not checked).`, details: { externalLinks: ext } }));
  return f;
}

// ───────────────────────── content ─────────────────────────
function content({ pages }: Ctx): Finding[] {
  const f: Finding[] = [];
  const ix = pages.filter(indexable);
  const contentPages = ix.filter((p) => !UTILITY.test(new URL(p.finalUrl).pathname));
  f.push(make("content.thin", contentPages.filter((p) => p.wordCount < 150 && !p.jsAppShell).map((p) => ({ url: p.url, note: `${p.wordCount} words` }))));
  const dups = [...groupBy(ix, (p) => p.textHash).values()].filter((g) => new Set(g.map((p) => sameUrl(p.finalUrl))).size > 1);
  f.push(make("content.duplicate", dups.flatMap((g) => g.map((p) => ({ url: p.url, note: `Same text as ${g.length - 1} other page(s)` })))));
  const rd = ix.filter((p) => p.readability != null);
  f.push(
    rd.length
      ? make("content.readability", rd.filter((p) => (p.readability ?? 100) < 30).map((p) => ({ url: p.url, note: `Flesch ${p.readability}` })), {
          details: { averageFlesch: Math.round(rd.reduce((a, p) => a + (p.readability ?? 0), 0) / rd.length) },
        })
      : make("content.readability", [], { status: "na", summary: "Not enough English body text to score readability." }),
  );
  f.push(make("content.paragraphs", ix.filter((p) => p.longParagraphs > 0).map((p) => ({ url: p.url, note: `${p.longParagraphs} paragraph(s) over 150 words` }))));
  f.push(make("content.structure", ix.filter((p) => p.wordCount >= 600 && p.h2.length + p.h3.length < 2).map((p) => ({ url: p.url, note: `${p.wordCount} words, ${p.h2.length + p.h3.length} subheadings` }))));
  // Topic relevance: do the title's key terms actually appear in the page's body text?
  const rel: Affected[] = [];
  for (const p of contentPages) {
    if (!p.title || p.wordCount < 150) continue;
    const brand = new URL(p.finalUrl).hostname.replace(/^www\./, "").split(".")[0];
    const terms = [...new Set(keyTerms(p.title))].filter((t) => t !== brand).slice(0, 6);
    if (terms.length < 2) continue;
    const hay = `${p.textSample ?? ""} ${p.h1.join(" ")} ${p.h2.join(" ")}`.toLowerCase();
    const hit = terms.filter((t) => hay.includes(t)).length;
    if (hit / terms.length < 0.5) rel.push({ url: p.url, note: `${hit}/${terms.length} title terms found in body: ${terms.join(", ")}` });
  }
  f.push(make("content.topic-relevance", rel));
  const articles = ix.filter((p) => /\/(blog|news|article|articles|posts?|insights|resources)\//i.test(new URL(p.finalUrl).pathname));
  f.push(articles.length ? make("content.freshness", articles.filter((p) => !p.dateModified).map((p) => ({ url: p.url }))) : make("content.freshness", [], { status: "na", summary: "No blog or article URLs detected." }));
  const hasContactPage = pages.some((p) => /contact/i.test(p.finalUrl) && p.status === 200);
  const hasAbout = pages.some((p) => /\/(about|about-us|team|our-team|our-story|who-we-are|company|experience)(\/|$|\?)/i.test(p.finalUrl) && p.status === 200);
  const hasInfo = pages.some((p) => p.hasContactInfo);
  const missing = [!hasContactPage && "contact page", !hasAbout && "about page", !hasInfo && "visible phone/email"].filter(Boolean) as string[];
  f.push(make("content.trust-pages", missing.length ? [{ url: pages[0]?.url ?? "", note: `Not found: ${missing.join(", ")}` }] : [], { summary: missing.length ? `Not found within the crawl: ${missing.join(", ")}.` : "Contact and about information found." }));
  const wc = contentPages.map((p) => p.wordCount).sort((a, b) => a - b);
  const median = wc.length ? wc[Math.floor(wc.length / 2)] : 0;
  f.push(make("content.depth", [], { status: wc.length ? "passed" : "na", summary: wc.length ? `Median of ${median} words across ${wc.length} content pages.` : "No content pages to measure.", details: { medianWords: median } }));
  return f;
}

// ───────────────────────── performance ─────────────────────────
const isPsi = (x: unknown): x is PageSpeedResult => !!x && typeof x === "object" && "metrics" in (x as object);

function band(id: string, value: number | null | undefined, good: number, poor: number, display: string, url: string, poorStatus: Status = "error"): Finding {
  if (value == null) return make(id, [], { status: "not_tested", summary: "Metric not returned by PageSpeed Insights." });
  const status: Status = value <= good ? "passed" : value <= poor ? "warning" : poorStatus;
  return make(id, status === "passed" ? [] : [{ url, note: display }], { status, summary: display });
}

function performance({ site }: Ctx): Finding[] {
  const ps = site.pagespeed ?? {};
  const mob = isPsi(ps.mobile) ? ps.mobile : null;
  const desk = isPsi(ps.desktop) ? ps.desktop : null;
  const errText = (x: unknown) => (x && typeof x === "object" && "error" in (x as object) ? (x as { error: string }).error : "PageSpeed Insights did not return data.");
  const nt = (id: string, why: string) => make(id, [], { status: "not_tested", summary: why });
  const f: Finding[] = [];

  const score = (id: string, r: PageSpeedResult | null, raw: unknown) => {
    if (!r || r.score == null) return nt(id, errText(raw));
    const s = Math.round(r.score * 100);
    const status: Status = s >= 90 ? "passed" : s >= 50 ? "warning" : "error";
    return make(id, status === "passed" ? [] : [{ url: r.url, note: `Score ${s}/100` }], { status, summary: `Score ${s}/100.`, details: { score: s } });
  };
  f.push(score("perf.score-mobile", mob, ps.mobile));
  f.push(score("perf.score-desktop", desk, ps.desktop));

  if (!mob) {
    for (const id of ["perf.lcp", "perf.cls", "perf.fcp", "perf.tbt", "perf.si"]) f.push(nt(id, errText(ps.mobile)));
  } else {
    const m = mob.metrics;
    f.push(band("perf.lcp", m.lcp?.value != null ? m.lcp.value / 1000 : null, 2.5, 4, `LCP ${m.lcp?.display ?? "?"}`, mob.url));
    f.push(band("perf.cls", m.cls?.value, 0.1, 0.25, `CLS ${m.cls?.display ?? "?"}`, mob.url));
    f.push(band("perf.fcp", m.fcp?.value != null ? m.fcp.value / 1000 : null, 1.8, 3, `FCP ${m.fcp?.display ?? "?"}`, mob.url, "warning"));
    f.push(band("perf.tbt", m.tbt?.value, 200, 600, `TBT ${m.tbt?.display ?? "?"}`, mob.url, "warning"));
    f.push(band("perf.si", m.si?.value != null ? m.si.value / 1000 : null, 3.4, 5.8, `Speed Index ${m.si?.display ?? "?"}`, mob.url, "warning"));
  }
  const inp = mob?.field?.INTERACTION_TO_NEXT_PAINT;
  f.push(inp ? band("perf.inp", inp.p75, 200, 500, `INP p75 ${inp.p75} ms (real users)`, mob!.url) : nt("perf.inp", mob ? "Google has no real-user INP data for this site yet (common for lower-traffic sites)." : errText(ps.mobile)));

  // Opportunities from the mobile run (desktop used as fallback).
  const src = mob ?? desk;
  const opp = (id: string, auditIds: string[]) => {
    if (!src) return nt(id, errText(ps.mobile));
    const hits = [...src.opportunities, ...src.diagnostics].filter((o) => auditIds.includes(o.id));
    return make(id, hits.map((h) => ({ url: src.url, note: `${h.title}${h.display ? ` — ${h.display}` : ""}` })), { summary: hits.length ? hits.map((h) => h.display || h.title).join("; ") : "No significant savings found." });
  };
  f.push(opp("perf.render-blocking", ["render-blocking-resources", "render-blocking-insight"]));
  f.push(opp("perf.unused-css", ["unused-css-rules"]));
  f.push(opp("perf.unused-js", ["unused-javascript"]));
  f.push(opp("perf.compression", ["uses-text-compression", "document-latency-insight"]));
  f.push(opp("perf.caching", ["uses-long-cache-ttl", "cache-insight"]));
  f.push(opp("perf.images", ["uses-optimized-images", "modern-image-formats", "offscreen-images", "uses-responsive-images", "image-delivery-insight"]));
  f.push(opp("perf.js-execution", ["bootup-time", "mainthread-work-breakdown"]));
  f.push(opp("perf.minify", ["unminified-css", "unminified-javascript"]));
  return f;
}

// ───────────────────────── mobile ─────────────────────────
function mobile({ pages, site }: Ctx): Finding[] {
  const f: Finding[] = [];
  const h = pages.filter(html200);
  const vp: Affected[] = [];
  for (const p of h) {
    if (!p.viewport) vp.push({ url: p.url, note: "No meta viewport" });
    // Same rule as Lighthouse's meta-viewport audit: width=device-width or an initial-scale.
    else if (!/width\s*=\s*device-width/i.test(p.viewport) && !/initial-scale\s*=/i.test(p.viewport)) vp.push({ url: p.url, note: `viewport: ${p.viewport}` });
  }
  const zoomOff = h.filter((p) => p.viewport && /(user-scalable\s*=\s*(no|0))|(maximum-scale\s*=\s*1(\.0)?\b)/i.test(p.viewport));
  f.push(vp.length ? make("mobile.viewport", vp) : make("mobile.viewport", zoomOff.map((p) => ({ url: p.url, note: "Zoom disabled" })), { status: zoomOff.length ? "warning" : "passed", summary: zoomOff.length ? "Viewport set, but zooming is disabled on some pages." : "All pages set a responsive viewport." }));

  const mob = isPsi(site.pagespeed?.mobile) ? (site.pagespeed!.mobile as PageSpeedResult) : null;
  const lh = (id: string, auditId: string[], fallback?: () => Finding) => {
    const a = mob?.diagnostics.find((d) => auditId.includes(d.id));
    const passedA = mob?.passedAudits?.some((x) => auditId.includes(x));
    if (a) return make(id, [{ url: mob!.url, note: a.display || a.title }]);
    if (passedA) return make(id, [], { summary: "Passed Lighthouse’s mobile audit." });
    return fallback ? fallback() : make(id, [], { status: "not_tested", summary: "Lighthouse didn’t return this audit for the page." });
  };
  // Current Lighthouse versions no longer report font-size or content-width; we only use
  // what can actually be measured and say so otherwise.
  f.push(
    lh("mobile.font-size", ["font-size"], () =>
      h.some((p) => p.smallFontHints > 0)
        ? make("mobile.font-size", h.filter((p) => p.smallFontHints).map((p) => ({ url: p.url, note: `${p.smallFontHints} inline font sizes under 12px` })))
        : make("mobile.font-size", [], { status: "not_tested", summary: "No inline font sizes under 12px in the HTML. Rendered font sizes need a real browser check, which this audit doesn’t run." }),
    ),
  );
  f.push(lh("mobile.tap-targets", ["tap-targets", "target-size"]));
  f.push(lh("mobile.content-width", ["content-width"], () => make("mobile.content-width", [], { status: "not_tested", summary: "Horizontal overflow needs a real browser render; Google’s current Lighthouse no longer reports it." })));
  const imgs = h.flatMap((p) => p.images.filter((i) => i.src && !/\.svg(\?|$)/i.test(i.src)));
  f.push(imgs.length < 3 ? make("mobile.responsive-images", [], { status: "na", summary: "Too few images to assess." }) : (() => {
    const share = imgs.filter((i) => i.srcset).length / imgs.length;
    return make("mobile.responsive-images", share < 0.5 ? [{ url: h[0]?.url ?? "", note: `${Math.round(share * 100)}% of images use srcset/picture` }] : [], { summary: `${Math.round(share * 100)}% of images are responsive.` });
  })());
  const fieldCat = mob?.field?.OVERALL?.category;
  f.push(!mob ? make("mobile.performance", [], { status: "not_tested", summary: "PageSpeed Insights data unavailable." }) : !fieldCat ? make("mobile.performance", [], { status: "not_tested", summary: "No real-user (CrUX) data for this site yet." }) : make("mobile.performance", fieldCat === "FAST" ? [] : [{ url: mob.url, note: `Real-user mobile experience: ${fieldCat.toLowerCase()}` }], { status: fieldCat === "FAST" ? "passed" : fieldCat === "AVERAGE" ? "warning" : "error", summary: `Real-user mobile assessment: ${fieldCat.toLowerCase()}.` }));
  return f;
}

// ───────────────────────── images ─────────────────────────
function images({ pages, site }: Ctx): Finding[] {
  const f: Finding[] = [];
  const h = pages.filter(html200);
  const all = h.flatMap((p) => p.images.map((i) => ({ ...i, page: p.url })));
  if (!all.length) {
    for (const id of ["images.alt-missing", "images.alt-empty", "images.alt-quality", "images.dimensions", "images.size", "images.format", "images.lazy", "images.filenames"]) f.push(make(id, [], { status: "na", summary: "No images found on crawled pages." }));
    return f;
  }
  const perPage = (pred: (i: (typeof all)[number]) => boolean, label: string) => {
    const m = new Map<string, number>();
    for (const i of all) if (pred(i)) m.set(i.page, (m.get(i.page) ?? 0) + 1);
    return [...m.entries()].map(([url, n]) => ({ url, note: `${n} ${label}` }));
  };
  f.push(make("images.alt-missing", perPage((i) => i.alt === null, "image(s) without alt")));
  f.push(make("images.alt-empty", perPage((i) => i.alt !== null && i.alt.trim() === "", "image(s) with empty alt")));
  const GENERIC_ALT = /^(image|img|photo|picture|logo|icon|banner|graphic|untitled|placeholder|\d+)$/i;
  f.push(make("images.alt-quality", perPage((i) => !!i.alt && i.alt.trim().length > 0 && (i.alt.trim().length < 3 || GENERIC_ALT.test(i.alt.trim()) || /\.(jpe?g|png|webp|gif|svg)$/i.test(i.alt.trim())), "image(s) with generic alt")));
  f.push(make("images.dimensions", perPage((i) => !i.width || !i.height, "image(s) without width/height")));

  const checks = site.imageChecks ?? [];
  if (!checks.length) {
    f.push(make("images.size", [], { status: "not_tested", summary: "Image files could not be sampled." }));
    f.push(make("images.format", [], { status: "not_tested", summary: "Image files could not be sampled." }));
  } else {
    f.push(make("images.size", checks.filter((c) => c.bytes > 200_000).map((c) => ({ url: c.src, note: fmtBytes(c.bytes) })), { details: { sampled: checks.length } }));
    const modern = checks.filter((c) => /webp|avif|svg/i.test(c.type)).length;
    const share = modern / checks.length;
    f.push(make("images.format", share < 0.5 ? checks.filter((c) => !/webp|avif|svg/i.test(c.type)).map((c) => ({ url: c.src, note: c.type || "unknown" })) : [], { summary: `${Math.round(share * 100)}% of ${checks.length} sampled images use modern formats.` }));
  }
  f.push(make("images.lazy", h.filter((p) => p.images.length > 5 && !p.images.some((i) => i.loading === "lazy")).map((p) => ({ url: p.url, note: `${p.images.length} images, none lazy-loaded` }))));
  // Judge the real file name — for image proxies like /_next/image?url=… use the source path.
  const fileName = (src: string) => {
    try {
      const u = new URL(src);
      const inner = u.searchParams.get("url") || u.searchParams.get("src");
      const path = inner ? decodeURIComponent(inner).split("?")[0] : u.pathname;
      return path.split("/").pop() ?? "";
    } catch {
      return "";
    }
  };
  const GENERIC_FILE = /^(img|image|dsc|dscn|screenshot|screen[-_ ]shot|photo|pxl|untitled|wp-image)[-_ ]?\d*\.[a-z0-9]+$|^[a-f0-9]{16,}\.[a-z0-9]+$|^\d{6,}\.[a-z0-9]+$/i;
  const gf = [...new Set(all.filter((i) => i.src.startsWith("http") && GENERIC_FILE.test(fileName(i.src))).map((i) => i.src))];
  f.push(make("images.filenames", gf.map((u) => ({ url: u }))));
  return f;
}

// ───────────────────────── internal links ─────────────────────────
function links({ pages, startUrl, queue }: Ctx): Finding[] {
  const f: Finding[] = [];
  const h = pages.filter(html200);
  const internal = h.flatMap((p) => p.links.filter((l) => l.internal));
  const unique = new Set(internal.map((l) => sameUrl(l.href)));
  f.push(make("links.overview", [], { status: "passed", summary: `${internal.length} internal links to ${unique.size} unique URLs across ${h.length} pages.`, details: { internalLinks: internal.length, uniqueTargets: unique.size } }));
  const ix = h.filter(indexable);
  f.push(make("links.too-few", ix.filter((p) => new Set(p.links.filter((l) => l.internal && sameUrl(l.href) !== sameUrl(p.finalUrl)).map((l) => sameUrl(l.href))).size < 3).map((p) => ({ url: p.url, note: `${new Set(p.links.filter((l) => l.internal).map((l) => sameUrl(l.href))).size} unique internal links` }))));
  f.push(make("links.too-many", h.filter((p) => p.links.filter((l) => l.internal).length > 150).map((p) => ({ url: p.url, note: `${p.links.filter((l) => l.internal).length} internal links` }))));
  const inbound = new Map<string, Set<string>>();
  for (const p of h) for (const l of p.links) if (l.internal) {
    const k = sameUrl(l.href);
    if (!inbound.has(k)) inbound.set(k, new Set());
    if (sameUrl(p.finalUrl) !== k) inbound.get(k)!.add(p.url);
  }
  const capped = queue.some((q) => q.status === "skipped" && q.reason === "limit");
  const weak = ix.filter((p) => sameUrl(p.finalUrl) !== sameUrl(startUrl) && p.depth < 99 && (inbound.get(sameUrl(p.finalUrl))?.size ?? 0) <= 1).map((p) => ({ url: p.url, note: `${inbound.get(sameUrl(p.finalUrl))?.size ?? 0} inbound link(s) from crawled pages` }));
  f.push(make("links.weak-inlinks", weak, capped && weak.length ? { summary: `${weak.length} pages affected — counted within the crawled pages only, since the crawl hit its page limit.` } : {}));
  f.push(make("links.empty-anchors", h.map((p) => ({ url: p.url, n: p.links.filter((l) => l.internal && !l.text).length })).filter((x) => x.n).map((x) => ({ url: x.url, note: `${x.n} link(s) without text` }))));
  const keyRe = /\/(contact|about|services?|pricing|book|appointments?)(\/|$)/i;
  const key = h.filter((p) => keyRe.test(new URL(p.finalUrl).pathname));
  f.push(key.length ? make("links.key-pages-depth", key.filter((p) => p.depth > 2 && p.depth < 99).map((p) => ({ url: p.url, note: `${p.depth} clicks deep` }))) : make("links.key-pages-depth", [], { status: "na", summary: "No contact/about/services pages detected by URL." }));
  return f;
}

// ───────────────────────── structured data ─────────────────────────
function schema({ pages, startUrl }: Ctx): Finding[] {
  const f: Finding[] = [];
  const h = pages.filter(html200);
  const withLd = h.filter((p) => p.jsonLd.length || p.microdataTypes.length);
  f.push(make("schema.present", withLd.length ? [] : [{ url: startUrl, note: "No JSON-LD or microdata on crawled pages" }], { summary: withLd.length ? `${withLd.length} of ${h.length} pages contain structured data.` : "No structured data found." }));
  const invalid = h.filter((p) => p.jsonLd.some((j) => !j.valid));
  f.push(withLd.length || invalid.length ? make("schema.syntax", invalid.map((p) => ({ url: p.url, note: p.jsonLd.find((j) => !j.valid)?.error ?? "Invalid JSON" }))) : make("schema.syntax", [], { status: "na", summary: "No JSON-LD to validate." }));
  const home = h.find((p) => sameUrl(p.finalUrl) === sameUrl(startUrl)) ?? h[0];
  const homeTypes = home ? [...home.jsonLd.flatMap((j) => j.types), ...home.microdataTypes] : [];
  const ENTITY = /^(Organization|LocalBusiness|Person|WebSite|Corporation|ProfessionalService|MedicalBusiness|Dentist|Store|Restaurant|.*Business)$/;
  f.push(home ? make("schema.entity", homeTypes.some((t) => ENTITY.test(t)) ? [] : [{ url: home.url, note: homeTypes.length ? `Found: ${homeTypes.join(", ")}` : "No schema on start page" }]) : make("schema.entity", [], { status: "not_tested" }));
  const deep = h.some((p) => p.depth >= 2 && p.depth < 99);
  const allTypes = new Map<string, number>();
  for (const p of h) for (const t of new Set([...p.jsonLd.flatMap((j) => j.types), ...p.microdataTypes])) allTypes.set(t, (allTypes.get(t) ?? 0) + 1);
  f.push(!deep ? make("schema.breadcrumbs", [], { status: "na", summary: "No pages two or more levels deep." }) : make("schema.breadcrumbs", allTypes.has("BreadcrumbList") ? [] : [{ url: startUrl, note: "No BreadcrumbList markup found" }]));
  const list = [...allTypes.entries()].sort((a, b) => b[1] - a[1]);
  f.push(make("schema.types", [], { status: list.length ? "passed" : "na", summary: list.length ? list.map(([t, n]) => `${t} (${n})`).join(", ") : "No schema types detected.", details: { types: Object.fromEntries(list) } }));
  return f;
}

export const MODULES: Record<Category, (ctx: Ctx) => Finding[]> = { technical, onpage, content, performance, mobile, images, links, schema };
