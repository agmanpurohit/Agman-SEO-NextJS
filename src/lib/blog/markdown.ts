import "server-only";
import { Marked, type Tokens } from "marked";
import sanitizeHtml from "sanitize-html";
import { load } from "cheerio";
import { slugify, type ContentFormat, type TocItem } from "./types";
import { site } from "@/content/site";

const SITE_HOST = new URL(site.url).hostname.replace(/^www\./, "");

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Allow-list for post bodies. Anything else (scripts, iframes, styles, event handlers) is removed. */
const SANITIZE: sanitizeHtml.IOptions = {
  allowedTags: [
    "h1", "h2", "h3", "h4", "h5", "h6", "p", "a", "strong", "b", "em", "i", "u", "del", "s", "code", "pre", "blockquote", "ul", "ol", "li", "hr", "br",
    "img", "figure", "figcaption", "table", "caption", "thead", "tbody", "tfoot", "tr", "th", "td", "span", "sup", "sub", "mark", "kbd", "abbr", "input",
  ],
  allowedAttributes: {
    a: ["href", "title"],
    img: ["src", "alt", "title", "width", "height"],
    code: ["class"],
    th: ["align", "colspan", "rowspan", "scope"],
    td: ["align", "colspan", "rowspan"],
    ol: ["start", "reversed"],
    abbr: ["title"],
    input: ["type", "checked", "disabled"],
  },
  allowedClasses: { code: [/^language-[\w-]+$/] },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["https", "http"] },
  allowProtocolRelative: false,
  // Text inside removed wrappers (div, section, font, style spans…) is kept; script/style contents are dropped.
  nonTextTags: ["script", "style", "textarea", "option", "noscript", "template", "iframe", "object"],
  transformTags: {
    // The post title is the page's only H1, so body H1s become H2s.
    h1: "h2",
    b: "strong",
    i: "em",
    // Task-list checkboxes only, always disabled.
    input: (tagName, attribs) => (attribs.type === "checkbox" ? { tagName, attribs: { type: "checkbox", disabled: "", ...(attribs.checked !== undefined ? { checked: "" } : {}) } } : { tagName: "span", attribs: {} }),
  },
  exclusiveFilter: (frame) => frame.tag === "span" && !frame.text.trim() && !frame.mediaChildren?.length,
};

function markdownToHtml(md: string) {
  const marked = new Marked({ gfm: true, breaks: false });
  marked.use({
    renderer: {
      // Markdown images: the optional title becomes a visible caption.
      image({ href, title, text }: Tokens.Image) {
        const cap = title ? `<figcaption>${esc(title)}</figcaption>` : "";
        return `<figure><img src="${esc(href)}" alt="${esc(text)}" />${cap}</figure>`;
      },
    },
  });
  return marked.parse(md || "", { async: false }) as string;
}

/**
 * Post body → safe HTML, the same way for every format:
 * 1. Markdown is converted to HTML (HTML from the visual editor or pasted code is used as-is)
 * 2. the HTML is sanitised with an allow-list, so even admin content can't inject scripts
 * 3. structure is normalised: H2/H3 get stable ids and anchors (for the table of contents),
 *    external links open in a new tab with rel="noopener noreferrer", images are lazy-loaded
 *    and stand-alone images are wrapped in <figure>, empty paragraphs are removed
 */
export function renderContent(source: string, format: ContentFormat): { html: string; toc: TocItem[] } {
  const raw = format === "markdown" ? markdownToHtml(source) : source || "";
  const clean = sanitizeHtml(raw, SANITIZE);
  const $ = load(clean, null, false);

  // Empty paragraphs (common when pasting from Word/Docs or the visual editor).
  $("p").each((_, el) => {
    const $el = $(el);
    if (!$el.text().replace(/ /g, " ").trim() && !$el.find("img, input").length) $el.remove();
  });

  // Headings: unique ids, anchor links, table of contents.
  const toc: TocItem[] = [];
  const used = new Map<string, number>();
  $("h2, h3, h4, h5, h6").each((_, el) => {
    const $el = $(el);
    const text = $el.text().replace(/\s+/g, " ").trim();
    if (!text) return void $el.remove();
    const tag = (el as { tagName: string }).tagName.toLowerCase();
    if (!/^h[234]$/.test(tag)) return;
    const base = slugify(text) || "section";
    const n = used.get(base) ?? 0;
    used.set(base, n + 1);
    const id = n ? `${base}-${n + 1}` : base;
    $el.attr("id", id);
    $el.prepend(`<a class="heading-anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>`);
    const level = Number(tag.slice(1));
    if (level === 2 || level === 3) toc.push({ id, text, level });
  });

  // Links: external ones open safely in a new tab.
  $("a[href]").each((_, el) => {
    const $el = $(el);
    if ($el.hasClass("heading-anchor")) return;
    const href = $el.attr("href") ?? "";
    let external = false;
    try {
      const u = new URL(href, site.url);
      external = /^https?:$/.test(u.protocol) && u.hostname.replace(/^www\./, "") !== SITE_HOST;
    } catch {
      /* relative or invalid: treat as internal */
    }
    if (external) $el.attr({ target: "_blank", rel: "noopener noreferrer" });
  });

  // Images: lazy loading; a paragraph holding only an image becomes a <figure>.
  $("img").each((_, el) => {
    const $el = $(el);
    $el.attr({ loading: "lazy", decoding: "async" });
    if (!$el.attr("alt")) $el.attr("alt", "");
    const $p = $el.parent("p");
    if ($p.length && $p.children().length === 1 && !$p.text().trim()) {
      const title = $el.attr("title");
      $p.replaceWith(`<figure>${$.html($el)}${title ? `<figcaption>${esc(title)}</figcaption>` : ""}</figure>`);
    }
  });

  return { html: $.html(), toc };
}

/** Kept for older callers: Markdown only. */
export const renderMarkdown = (md: string) => renderContent(md, "markdown");

/** Clean editor HTML for storage (same allow-list as rendering, without anchors or ids). */
export const cleanHtml = (html: string) => sanitizeHtml(html || "", SANITIZE);
