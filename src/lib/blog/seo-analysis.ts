import type { PostInput } from "./types";

/**
 * On-page SEO analysis for a draft post, run live in the dashboard and stored as a score
 * when the post is saved. Checks are practical writing guidance, not ranking guarantees.
 */
export type SeoCheck = { id: string; label: string; status: "good" | "ok" | "bad"; detail: string; weight: number };

const words = (s: string) => (s.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? []);

/** Plain text from markdown (good enough for counting and keyword checks). */
export function mdToText(md: string) {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_>~|#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const wordCount = (md: string) => words(mdToText(md)).length;
export const readingMinutes = (md: string) => Math.max(1, Math.round(wordCount(md) / 225));

const includesPhrase = (hay: string, phrase: string) => {
  const p = phrase.trim().toLowerCase();
  return !!p && hay.toLowerCase().includes(p);
};

/** Rough Flesch reading ease (English). */
function flesch(text: string) {
  const ws = text.match(/[a-zA-Z]+/g) ?? [];
  const sentences = text.split(/[.!?]+(?:\s|$)/).filter((s) => s.trim().split(/\s+/).length > 2);
  if (ws.length < 100 || sentences.length < 3) return null;
  const syl = ws.reduce((n, w) => n + Math.max(1, (w.toLowerCase().replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").match(/[aeiouy]{1,2}/g) ?? []).length), 0);
  return Math.round(Math.max(0, Math.min(100, 206.835 - 1.015 * (ws.length / sentences.length) - 84.6 * (syl / ws.length))));
}

export const effectiveMetaTitle = (p: Pick<PostInput, "metaTitle" | "title">) => (p.metaTitle.trim() || p.title.trim());
export const effectiveMetaDescription = (p: Pick<PostInput, "metaDescription" | "excerpt">) => (p.metaDescription.trim() || p.excerpt.trim());

export function analysePost(p: PostInput, siteHost = "agmanrajpurohit.com"): { score: number; checks: SeoCheck[] } {
  const kw = p.focusKeyword.trim().toLowerCase();
  const text = mdToText(p.contentMd);
  const wc = words(text).length;
  const metaTitle = effectiveMetaTitle(p);
  const metaDesc = effectiveMetaDescription(p);
  const firstPara = mdToText(p.contentMd.split(/\n\s*\n/).find((b) => b.trim() && !/^#/.test(b.trim())) ?? "");
  const headings = [...p.contentMd.matchAll(/^(#{2,3})\s+(.+)$/gm)].map((m) => ({ level: m[1].length, text: m[2] }));
  const h1InBody = /^#\s+/m.test(p.contentMd);
  const links = [...p.contentMd.matchAll(/\[[^\]]*\]\(([^)\s]+)/g)].map((m) => m[1]);
  const internal = links.filter((l) => l.startsWith("/") || l.includes(siteHost)).length;
  const external = links.length - internal;
  const images = [...p.contentMd.matchAll(/!\[([^\]]*)\]\(/g)];
  const imagesNoAlt = images.filter((m) => !m[1].trim()).length;
  const density = kw && wc ? (text.toLowerCase().split(kw).length - 1) / wc * 100 : 0;
  const read = flesch(text);

  const c: SeoCheck[] = [];
  const add = (id: string, label: string, status: SeoCheck["status"], detail: string, weight = 1) => c.push({ id, label, status, detail, weight });

  add("kw", "Focus keyword set", kw ? "good" : "bad", kw ? `“${p.focusKeyword}”` : "Add the main phrase you want this post to rank for.", 2);
  if (kw) {
    add("kw-title", "Keyword in SEO title", includesPhrase(metaTitle, kw) ? "good" : "bad", includesPhrase(metaTitle, kw) ? "Found in the title." : "Work the keyword into the title, ideally near the start.", 2);
    add("kw-desc", "Keyword in meta description", includesPhrase(metaDesc, kw) ? "good" : "ok", includesPhrase(metaDesc, kw) ? "Found in the description." : "Google bolds matching words in snippets; include it naturally.");
    add("kw-slug", "Keyword in URL", p.slug.includes(kw.replace(/\s+/g, "-")) || kw.split(/\s+/).every((w) => p.slug.includes(w)) ? "good" : "ok", `/blog/${p.slug || "…"}`);
    add("kw-intro", "Keyword in the first paragraph", includesPhrase(firstPara, kw) ? "good" : "ok", includesPhrase(firstPara, kw) ? "Introduced early." : "Mention the topic in your opening lines.");
    add("kw-heading", "Keyword in a subheading", headings.some((h) => includesPhrase(h.text, kw)) ? "good" : "ok", headings.length ? `${headings.length} subheadings` : "No H2/H3 yet.");
    add("kw-density", "Keyword usage", density === 0 ? "bad" : density > 3 ? "ok" : "good", density === 0 ? "Keyword not used in the body." : `${density.toFixed(1)}% of words${density > 3 ? " — reads as stuffed; vary the wording." : "."}`);
  }
  const tl = metaTitle.length;
  add("title-len", "SEO title length", !tl ? "bad" : tl >= 30 && tl <= 60 ? "good" : "ok", tl ? `${tl} characters (aim for 30–60).` : "Add a title.", 2);
  const dl = metaDesc.length;
  add("desc-len", "Meta description length", !dl ? "bad" : dl >= 120 && dl <= 160 ? "good" : "ok", dl ? `${dl} characters (aim for 120–160).` : "Write a description or an excerpt.", 2);
  add("slug", "Clean URL", !p.slug ? "bad" : p.slug.length <= 75 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug) ? "good" : "ok", p.slug ? `${p.slug.length} characters` : "Set a URL slug.");
  add("length", "Content length", wc >= 900 ? "good" : wc >= 400 ? "ok" : "bad", `${wc} words${wc < 400 ? " — most posts that rank cover the topic in more depth." : ""}`, 2);
  add("headings", "Subheadings (H2/H3)", headings.filter((h) => h.level === 2).length >= 2 ? "good" : headings.length ? "ok" : "bad", headings.length ? `${headings.filter((h) => h.level === 2).length} H2, ${headings.filter((h) => h.level === 3).length} H3` : "Break the post into sections with ## headings.");
  add("h1", "Single H1", h1InBody ? "bad" : "good", h1InBody ? "The post title is already the H1 — use ## for sections, not #." : "The title is the only H1.");
  add("internal", "Internal links", internal >= 2 ? "good" : internal === 1 ? "ok" : "bad", `${internal} link(s) to your own pages (e.g. /seo-audit, /work).`);
  add("external", "Outbound links", external >= 1 ? "good" : "ok", external ? `${external} link(s) to other sites.` : "Citing a credible source can support the post.");
  add("cover", "Cover image with alt text", p.coverImage && p.coverAlt.trim() ? "good" : p.coverImage ? "bad" : "ok", p.coverImage ? (p.coverAlt.trim() ? "Cover and alt text set." : "Describe the cover image in the alt text.") : "A cover image improves sharing and the blog grid.");
  if (images.length) add("img-alt", "Image alt text in body", imagesNoAlt ? "bad" : "good", imagesNoAlt ? `${imagesNoAlt} of ${images.length} images have no alt text.` : `All ${images.length} images described.`);
  add("excerpt", "Excerpt", p.excerpt.trim().length >= 60 ? "good" : p.excerpt.trim() ? "ok" : "bad", p.excerpt.trim() ? `${p.excerpt.trim().length} characters` : "Write a one- or two-sentence summary for the blog list.");
  if (read != null) add("read", "Readability", read >= 50 ? "good" : read >= 30 ? "ok" : "bad", `Flesch reading ease ${read}${read < 50 ? " — shorter sentences and plainer words help." : "."}`);
  add("category", "Category", p.category.trim() ? "good" : "ok", p.category.trim() || "Pick a category so readers can browse related posts.");
  if (p.noindex) add("noindex", "Indexing", "bad", "This post is set to noindex and won’t appear in Google.", 2);

  const max = c.reduce((n, x) => n + x.weight, 0);
  const got = c.reduce((n, x) => n + x.weight * (x.status === "good" ? 1 : x.status === "ok" ? 0.5 : 0), 0);
  return { score: max ? Math.round((got / max) * 100) : 0, checks: c };
}
