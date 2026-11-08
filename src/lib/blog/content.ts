import type { ContentFormat } from "./types";

/**
 * Reads the structure of a post body in either format (Markdown or HTML): plain text,
 * headings, links, images and the first paragraph. Used for word counts, reading time and
 * the SEO checks, in the browser (live) and on the server (saved score). Regex-based on
 * purpose so it runs anywhere without a DOM.
 */
export type ContentFacts = {
  text: string;
  headings: { level: number; text: string }[];
  h1InBody: boolean;
  links: string[];
  images: { alt: string }[];
  firstParagraph: string;
};

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'", mdash: "—", ndash: "–", hellip: "…", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”" };
const decode = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+\d*);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });

/** Plain text from markdown (good enough for counting and keyword checks). */
export function mdToText(md: string) {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[*_>~|#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Plain text from HTML: drops scripts/styles/code blocks and tags, keeps word boundaries. */
export function htmlToText(html: string) {
  return decode(
    html
      .replace(/<(script|style|template|noscript)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<pre[\s\S]*?<\/pre>/gi, " ")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/(p|div|li|h[1-6]|tr|td|th|blockquote|figcaption|section|article)>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

const attr = (tag: string, name: string) => {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? decode(m[2] ?? m[3] ?? m[4] ?? "") : null;
};

export function contentFacts(source: string, format: ContentFormat): ContentFacts {
  const src = source || "";
  if (format === "html") {
    const headings = [...src.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({ level: Number(m[1]), text: htmlToText(m[2]) })).filter((h) => h.text);
    const links = [...src.matchAll(/<a\b[^>]*>/gi)].map((m) => attr(m[0], "href")).filter((h): h is string => !!h && !h.startsWith("#"));
    const images = [...src.matchAll(/<img\b[^>]*>/gi)].map((m) => ({ alt: attr(m[0], "alt") ?? "" }));
    const firstP = [...src.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => htmlToText(m[1])).find((t) => t.length > 0) ?? "";
    return { text: htmlToText(src), headings: headings.filter((h) => h.level >= 2 && h.level <= 3), h1InBody: headings.some((h) => h.level === 1), links, images, firstParagraph: firstP };
  }
  const headings = [...src.matchAll(/^(#{2,3})\s+(.+)$/gm)].map((m) => ({ level: m[1].length, text: mdToText(m[2]) }));
  const links = [...src.matchAll(/\[[^\]]*\]\(([^)\s]+)/g)].map((m) => m[1]).filter((l) => !l.startsWith("#"));
  // Inline HTML inside Markdown counts too.
  const htmlLinks = [...src.matchAll(/<a\b[^>]*>/gi)].map((m) => attr(m[0], "href")).filter((h): h is string => !!h);
  const images = [...src.matchAll(/!\[([^\]]*)\]\(/g)].map((m) => ({ alt: m[1] }));
  const firstBlock = src.split(/\n\s*\n/).find((b) => b.trim() && !/^\s*(#|!\[|```|<)/.test(b.trim())) ?? "";
  return { text: mdToText(src), headings, h1InBody: /^#\s+/m.test(src), links: [...links, ...htmlLinks], images, firstParagraph: mdToText(firstBlock) };
}

const countWords = (s: string) => (s.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? []).length;
export const wordCount = (source: string, format: ContentFormat = "markdown") => countWords(contentFacts(source, format).text);
export const readingMinutes = (source: string, format: ContentFormat = "markdown") => Math.max(1, Math.round(wordCount(source, format) / 225));
