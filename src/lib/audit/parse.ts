import "server-only";
import { load } from "cheerio";
import { createHash } from "node:crypto";
import type { PageData } from "./types";

const clean = (s: string | undefined | null) => (s ?? "").replace(/\s+/g, " ").trim();

/** Normalises a link for crawling/dedup: absolute, no hash, no tracking params, consistent trailing slash handling kept as-is. */
export function normaliseLink(href: string, base: string): string | null {
  if (!href) return null;
  const h = href.trim();
  if (/^(mailto:|tel:|javascript:|data:|#|sms:|whatsapp:|ftp:)/i.test(h)) return null;
  try {
    const u = new URL(h, base);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.hash = "";
    for (const p of [...u.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|msclkid|mc_cid|mc_eid|ref$|_ga)/i.test(p)) u.searchParams.delete(p);
    }
    return u.toString();
  } catch {
    return null;
  }
}

const sameSite = (a: string, host: string) => {
  try {
    const h = new URL(a).hostname.replace(/^www\./, "");
    return h === host.replace(/^www\./, "");
  } catch {
    return false;
  }
};

/** Flesch reading ease for English text (rough syllable count). Null when too little text. */
function fleschReadingEase(text: string): number | null {
  const sentences = text.split(/[.!?]+(?:\s|$)/).filter((s) => s.trim().split(/\s+/).length > 2);
  const words = text.match(/[a-zA-Z]+/g) ?? [];
  if (words.length < 100 || sentences.length < 3) return null;
  const syllables = words.reduce((n, w) => {
    const m = w.toLowerCase().replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "").match(/[aeiouy]{1,2}/g);
    return n + Math.max(1, m?.length ?? 1);
  }, 0);
  const score = 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length);
  return Math.round(Math.max(0, Math.min(100, score)));
}

function collectTypes(node: unknown, out: string[]) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) return node.forEach((n) => collectTypes(n, out));
  const o = node as Record<string, unknown>;
  const t = o["@type"];
  if (typeof t === "string") out.push(t);
  else if (Array.isArray(t)) t.forEach((x) => typeof x === "string" && out.push(x));
  if (o["@graph"]) collectTypes(o["@graph"], out);
  for (const [k, v] of Object.entries(o)) if (k !== "@graph" && v && typeof v === "object") collectTypes(v, out);
}

/** Extracts SEO-relevant facts from HTML. Pure parsing — scripts are read as text, never run. */
export function parseHtml(html: string, pageUrl: string, siteHost: string): Omit<PageData, "url" | "finalUrl" | "status" | "depth" | "redirects" | "contentType" | "bytes" | "timeMs" | "isHtml"> {
  const $ = load(html);
  const head = $("head");

  const titles = $("title");
  const metaDesc = $('meta[name="description" i]');
  const canon = $('link[rel="canonical" i]');
  const baseHref = $("base[href]").attr("href");
  const base = baseHref ? (normaliseLink(baseHref, pageUrl) ?? pageUrl) : pageUrl;

  // JSON-LD (syntax only)
  const jsonLd: PageData["jsonLd"] = [];
  $('script[type="application/ld+json" i]').each((_, el) => {
    const raw = $(el).text().trim();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const types: string[] = [];
      collectTypes(parsed, types);
      jsonLd.push({ types: [...new Set(types)], valid: true });
    } catch (e) {
      jsonLd.push({ types: [], valid: false, error: (e as Error).message.slice(0, 120) });
    }
  });
  const microdataTypes = [
    ...new Set(
      $("[itemtype]")
        .map((_, el) => ($(el).attr("itemtype") ?? "").split("/").pop() ?? "")
        .get()
        .filter(Boolean),
    ),
  ];

  const scriptCount = $("script[src], script:not([type]), script[type='module']").length;

  // Content text: drop non-content elements on a clone
  const body = $("body").clone();
  body.find("script, style, noscript, template, svg, iframe, nav, header, footer, form").remove();
  const text = clean(body.text());
  const words = text ? text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)) : [];
  const fullText = clean($("body").clone().find("script,style,noscript,template").remove().end().text());

  const headings: number[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    headings.push(Number((el as { tagName: string }).tagName.slice(1)));
  });

  let paragraphs = 0;
  let longParagraphs = 0;
  const prose: string[] = [];
  $("p, li").each((_, el) => {
    const t = clean($(el).text());
    const w = t.split(/\s+/).filter(Boolean).length;
    if ((el as { tagName: string }).tagName === "p") {
      if (w >= 5) paragraphs++;
      if (w > 150) longParagraphs++;
    }
    // Readability uses running prose only (≥ 8 words), each block treated as its own sentence group.
    if (w >= 8) prose.push(/[.!?]$/.test(t) ? t : `${t}.`);
  });

  const images: PageData["images"] = [];
  $("img").each((_, el) => {
    const $el = $(el);
    const src = $el.attr("src") || $el.attr("data-src") || "";
    const abs = src && !src.startsWith("data:") ? normaliseLink(src, base) : null;
    images.push({
      src: abs ?? src.slice(0, 120),
      alt: $el.attr("alt") ?? null,
      width: $el.attr("width") ?? null,
      height: $el.attr("height") ?? null,
      loading: $el.attr("loading") ?? null,
      srcset: Boolean($el.attr("srcset") || $el.closest("picture").length),
    });
  });

  const links: PageData["links"] = [];
  $("a[href]").each((_, el) => {
    const $el = $(el);
    const abs = normaliseLink($el.attr("href") ?? "", base);
    if (!abs) return;
    const rel = ($el.attr("rel") ?? "").toLowerCase();
    links.push({
      href: abs,
      text: clean($el.text() || $el.attr("aria-label") || $el.find("img").attr("alt") || "").slice(0, 100),
      nofollow: rel.includes("nofollow"),
      internal: sameSite(abs, siteHost),
    });
  });

  const hreflang: PageData["hreflang"] = [];
  $('link[rel="alternate" i][hreflang]').each((_, el) => {
    const href = normaliseLink($(el).attr("href") ?? "", base);
    hreflang.push({ lang: ($(el).attr("hreflang") ?? "").trim(), href: href ?? "" });
  });

  const og: Record<string, string> = {};
  $('meta[property^="og:" i]').each((_, el) => {
    og[($(el).attr("property") ?? "").toLowerCase()] = clean($(el).attr("content"));
  });
  const twitter: Record<string, string> = {};
  $('meta[name^="twitter:" i]').each((_, el) => {
    twitter[($(el).attr("name") ?? "").toLowerCase()] = clean($(el).attr("content"));
  });

  // Mixed content: http:// subresources on an https page
  const mixedContent: string[] = [];
  if (pageUrl.startsWith("https:")) {
    $("img[src], script[src], link[rel='stylesheet'][href], iframe[src], video[src], audio[src], source[src]").each((_, el) => {
      const v = $(el).attr("src") || $(el).attr("href") || "";
      if (/^http:\/\//i.test(v)) mixedContent.push(v.slice(0, 200));
    });
  }

  // App-shell heuristic: little server-rendered text, an empty mount node and scripts present.
  const mount = $("#root, #__next, #app, #__nuxt, [data-reactroot], app-root").first();
  const mountEmpty = mount.length > 0 && clean(mount.text()).length < 50;
  const jsAppShell = words.length < 60 && scriptCount > 0 && (mountEmpty || $("noscript").text().toLowerCase().includes("javascript"));

  const dateModified =
    $('meta[property="article:modified_time" i]').attr("content") ||
    $('meta[property="og:updated_time" i]').attr("content") ||
    $("time[datetime]").last().attr("datetime") ||
    null;

  const htmlLen = html.length || 1;

  return {
    lang: $("html").attr("lang") ?? null,
    title: titles.length ? clean(titles.first().text()) : null,
    titleCount: titles.length,
    metaDescription: metaDesc.length ? clean(metaDesc.first().attr("content")) : null,
    metaDescriptionCount: metaDesc.length,
    metaRobots: clean($('meta[name="robots" i], meta[name="googlebot" i]').map((_, el) => $(el).attr("content")).get().join(", ")) || null,
    canonical: canon.length ? normaliseLink(canon.first().attr("href") ?? "", base) : null,
    canonicalCount: canon.length,
    viewport: head.find('meta[name="viewport" i]').attr("content") ?? $('meta[name="viewport" i]').attr("content") ?? null,
    h1: $("h1").map((_, el) => clean($(el).text()).slice(0, 150)).get(),
    h2: $("h2").map((_, el) => clean($(el).text()).slice(0, 120)).get().slice(0, 30),
    h3: $("h3").map((_, el) => clean($(el).text()).slice(0, 120)).get().slice(0, 30),
    headingOrder: headings.slice(0, 80),
    wordCount: words.length,
    textRatio: Math.round((fullText.length / htmlLen) * 1000) / 10,
    textHash: words.length >= 50 ? createHash("sha1").update(words.join(" ").toLowerCase()).digest("hex") : undefined,
    textSample: text.toLowerCase().slice(0, 4000),
    readability: fleschReadingEase(prose.join(" ")),
    paragraphs,
    longParagraphs,
    images: images.slice(0, 200),
    links: links.slice(0, 1000),
    hreflang,
    og,
    twitter,
    jsonLd,
    microdataTypes,
    mixedContent: mixedContent.slice(0, 20),
    relNext: $('link[rel="next" i]').attr("href") ?? null,
    relPrev: $('link[rel="prev" i]').attr("href") ?? null,
    scriptCount,
    jsAppShell,
    dateModified,
    hasForms: $("form").length > 0,
    hasContactInfo: /(\+?\d[\d\s().-]{7,}\d)|(@[a-z0-9-]+\.[a-z]{2,})/i.test(fullText) || $('a[href^="tel:"], a[href^="mailto:"]').length > 0,
    smallFontHints: $('[style*="font-size"]').filter((_, el) => /font-size:\s*(?:[0-9]|1[01])px/i.test($(el).attr("style") ?? "")).length,
  };
}
