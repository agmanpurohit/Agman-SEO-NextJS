import "server-only";
import { Marked, type Tokens } from "marked";
import sanitizeHtml from "sanitize-html";
import { slugify, type TocItem } from "./types";
import { site } from "@/content/site";

const SITE_HOST = new URL(site.url).hostname;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Markdown → safe HTML for blog posts.
 * - H2/H3 get stable ids (for the table of contents and #anchors)
 * - external links open in a new tab with rel="noopener noreferrer"
 * - images are lazy-loaded and wrapped in <figure> with the title as caption
 * - output is sanitised with an allow-list, so even admin content can't inject scripts
 */
export function renderMarkdown(md: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const used = new Map<string, number>();
  const uniqueId = (text: string) => {
    const base = slugify(text) || "section";
    const n = used.get(base) ?? 0;
    used.set(base, n + 1);
    return n ? `${base}-${n + 1}` : base;
  };

  const marked = new Marked({ gfm: true, breaks: false });
  marked.use({
    renderer: {
      heading(this: { parser: { parseInline: (t: Tokens.Generic[]) => string } }, { tokens, depth, text }: Tokens.Heading) {
        const inner = this.parser.parseInline(tokens);
        // The post title is the page H1; demote any H1 in the body to H2.
        const level = Math.min(6, Math.max(2, depth));
        const plain = text.replace(/[*_`~]/g, "");
        const id = uniqueId(plain);
        if (level === 2 || level === 3) toc.push({ id, text: plain, level });
        return `<h${level} id="${id}"><a class="heading-anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>${inner}</h${level}>\n`;
      },
      link(this: { parser: { parseInline: (t: Tokens.Generic[]) => string } }, { href, title, tokens }: Tokens.Link) {
        const inner = this.parser.parseInline(tokens);
        let external = false;
        try {
          const u = new URL(href, site.url);
          external = /^https?:$/.test(u.protocol) && u.hostname !== SITE_HOST && u.hostname !== `www.${SITE_HOST}`;
        } catch {
          /* relative or invalid: treat as internal */
        }
        const t = title ? ` title="${esc(title)}"` : "";
        return external ? `<a href="${esc(href)}"${t} target="_blank" rel="noopener noreferrer">${inner}</a>` : `<a href="${esc(href)}"${t}>${inner}</a>`;
      },
      image({ href, title, text }: Tokens.Image) {
        const cap = title ? `<figcaption>${esc(title)}</figcaption>` : "";
        return `<figure><img src="${esc(href)}" alt="${esc(text)}" loading="lazy" decoding="async" />${cap}</figure>`;
      },
    },
  });

  const raw = marked.parse(md || "", { async: false }) as string;
  const html = sanitizeHtml(raw, {
    allowedTags: ["h2", "h3", "h4", "h5", "h6", "p", "a", "strong", "em", "del", "s", "code", "pre", "blockquote", "ul", "ol", "li", "hr", "br", "img", "figure", "figcaption", "table", "thead", "tbody", "tr", "th", "td", "span", "sup", "sub", "mark", "kbd", "input"],
    allowedAttributes: {
      a: ["href", "title", "target", "rel", "class", "aria-hidden", "tabindex"],
      img: ["src", "alt", "loading", "decoding", "width", "height"],
      h2: ["id"],
      h3: ["id"],
      h4: ["id"],
      code: ["class"],
      th: ["align"],
      td: ["align"],
      input: ["type", "checked", "disabled"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["https", "http"] },
    allowProtocolRelative: false,
    transformTags: {
      // Task-list checkboxes only, always disabled.
      input: (tagName, attribs) => (attribs.type === "checkbox" ? { tagName, attribs: { type: "checkbox", disabled: "", ...(attribs.checked !== undefined ? { checked: "" } : {}) } } : { tagName: "span", attribs: {} }),
    },
  });
  return { html, toc };
}
