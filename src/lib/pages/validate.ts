import { parseCustomSchema } from "@/lib/blog/custom-schema";
import { LIMITS, SECTION_TYPES, slugProblem, newId, type Cta, type Img, type PageInput, type Section, type SectionType } from "./types";

/**
 * Turns an untrusted request body into a clean PageInput. Unknown fields are dropped,
 * strings are trimmed and length-capped, links and image URLs are checked. Rich HTML is
 * cleaned separately on the server (service.ts) before saving.
 */
type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});
const str = (v: unknown, max: number = LIMITS.short) => (typeof v === "string" ? v.replace(/\r\n/g, "\n").trim().slice(0, max) : "");
const arr = (v: unknown) => (Array.isArray(v) ? v.slice(0, LIMITS.items) : []);

/** Internal path, https link, mailto or tel. Anything else (javascript:, data:, //host) is refused. */
export function safeHref(h: string): boolean {
  if (!h) return true;
  if (h.startsWith("/")) return !h.startsWith("//") && !/\s/.test(h);
  return /^(https?:\/\/[^\s]+|mailto:[^\s]+|tel:\+?[\d\s-]+)$/i.test(h);
}
export const safeImage = (u: string) => !u || (u.startsWith("/") && !u.startsWith("//")) || /^https:\/\/[^\s"']+$/i.test(u);

function img(v: unknown): Img | null {
  const o = obj(v);
  const url = str(o.url, 600);
  if (!url) return null;
  const n = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x > 0 && x < 20000 ? Math.round(x) : undefined);
  return { url, alt: str(o.alt, 200), width: n(o.width), height: n(o.height) };
}
const link = (v: unknown): Cta => ({ label: str(obj(v).label, 60), href: str(obj(v).href, 600) });

function section(v: unknown): Section | null {
  const o = obj(v);
  const type = o.type as SectionType;
  if (!SECTION_TYPES.some((t) => t.type === type)) return null;
  const id = typeof o.id === "string" && /^[a-z0-9]{4,16}$/.test(o.id) ? o.id : newId();
  const base = { id, ...(o.hidden === true ? { hidden: true } : {}) };
  const s = (k: string, max?: number) => str(o[k], max);
  switch (type) {
    case "hero":
      return { ...base, type, eyebrow: s("eyebrow"), heading: s("heading", 200), text: s("text", LIMITS.text), image: img(o.image), primary: link(o.primary), secondary: link(o.secondary) };
    case "answer":
      return { ...base, type, question: s("question", 200), answer: s("answer", LIMITS.text) };
    case "text":
      return { ...base, type, eyebrow: s("eyebrow"), heading: s("heading", 200), html: str(o.html, LIMITS.html) };
    case "imageText":
      return { ...base, type, eyebrow: s("eyebrow"), heading: s("heading", 200), html: str(o.html, LIMITS.html), image: img(o.image), imageSide: o.imageSide === "left" ? "left" : "right", cta: link(o.cta) };
    case "cards":
      return {
        ...base,
        type,
        eyebrow: s("eyebrow"),
        heading: s("heading", 200),
        intro: s("intro", LIMITS.text),
        columns: o.columns === 2 || o.columns === 4 ? o.columns : 3,
        items: arr(o.items).map((x) => ({ title: str(obj(x).title, 120), text: str(obj(x).text, LIMITS.text), href: str(obj(x).href, 600) })),
      };
    case "steps":
      return { ...base, type, eyebrow: s("eyebrow"), heading: s("heading", 200), items: arr(o.items).map((x) => ({ title: str(obj(x).title, 120), text: str(obj(x).text, LIMITS.text) })) };
    case "stats":
      return {
        ...base,
        type,
        eyebrow: s("eyebrow"),
        heading: s("heading", 200),
        items: arr(o.items).map((x) => ({ value: str(obj(x).value, 24), label: str(obj(x).label, 80), context: str(obj(x).context, 300) })),
      };
    case "image":
      return { ...base, type, image: img(o.image), caption: s("caption", 300), wide: o.wide === true };
    case "quote":
      return { ...base, type, quote: s("quote", LIMITS.text), name: s("name", 80), role: s("role", 120) };
    case "faq":
      return { ...base, type, eyebrow: s("eyebrow"), heading: s("heading", 200), items: arr(o.items).map((x) => ({ q: str(obj(x).q, 300), a: str(obj(x).a, LIMITS.text * 2) })) };
    case "links":
      return { ...base, type, heading: s("heading", 200), links: arr(o.links).map((x) => ({ label: str(obj(x).label, 120), href: str(obj(x).href, 600), note: str(obj(x).note, 200) })) };
    case "cta":
      return { ...base, type, eyebrow: s("eyebrow"), heading: s("heading", 200), text: s("text", LIMITS.text), primary: link(o.primary), secondary: link(o.secondary) };
    case "closing":
      return { ...base, type, label: s("label", 60), line1: s("line1", 60), line2: s("line2", 60), body: s("body", 400) };
  }
}

/** Problems inside one section (shown on that section in the editor). */
function sectionErrors(sec: Section, index: number, published: boolean): string[] {
  const e: string[] = [];
  const hrefs: string[] = [];
  const imgs: (Img | null)[] = [];
  switch (sec.type) {
    case "hero":
      if (index !== 0) e.push("The hero must be the first section (it holds the page's H1).");
      if (published && !sec.heading) e.push("Add the hero heading.");
      hrefs.push(sec.primary.href, sec.secondary.href);
      imgs.push(sec.image);
      break;
    case "answer":
      if (published && (!sec.question || !sec.answer)) e.push("Add both the question and the answer.");
      break;
    case "imageText":
      hrefs.push(sec.cta.href);
      imgs.push(sec.image);
      break;
    case "cards":
      hrefs.push(...sec.items.map((i) => i.href));
      break;
    case "image":
      imgs.push(sec.image);
      if (published && !sec.image) e.push("Choose an image.");
      break;
    case "faq":
      if (published && sec.items.some((i) => !i.q || !i.a)) e.push("Every FAQ needs a question and an answer.");
      break;
    case "links":
      hrefs.push(...sec.links.map((l) => l.href));
      break;
    case "cta":
      hrefs.push(sec.primary.href, sec.secondary.href);
      break;
  }
  if (hrefs.some((h) => !safeHref(h))) e.push("A link isn't valid. Use a site path like /contact, or a full https:// address.");
  for (const im of imgs) {
    if (im && !safeImage(im.url)) e.push("An image address isn't valid.");
    if (published && im && !im.alt) e.push("Add alt text to the image.");
  }
  return e;
}

export function parsePageInput(body: unknown): { input: PageInput; errors: Record<string, string> } {
  const o = obj(body);
  const errors: Record<string, string> = {};
  const status = o.status === "published" ? "published" : "draft";
  const sections = (Array.isArray(o.sections) ? o.sections.slice(0, LIMITS.sections) : [])
    .map(section)
    .filter((x): x is Section => !!x);
  const input: PageInput = {
    title: str(o.title, 120),
    slug: str(o.slug, 120).replace(/^\/+|\/+$/g, "").toLowerCase(),
    status,
    metaTitle: str(o.metaTitle, 120),
    metaDescription: str(o.metaDescription, 320),
    ogImage: str(o.ogImage, 600),
    noindex: o.noindex === true,
    customSchema: typeof o.customSchema === "string" ? o.customSchema.trim().slice(0, 50_000) : "",
    sections,
  };

  if (!input.title) errors.title = "Add a page name.";
  const sp = slugProblem(input.slug);
  if (sp) errors.slug = sp;
  if (input.ogImage && !safeImage(input.ogImage)) errors.ogImage = "Use an image from the media library or a full https:// address.";
  if (input.customSchema) {
    const p = parseCustomSchema(input.customSchema);
    if (!p.ok) errors.customSchema = p.error;
  }
  if (status === "published") {
    if (!input.metaDescription) errors.metaDescription = "Add a meta description before publishing.";
    if (!sections.some((x) => !x.hidden)) errors.sections = "Add at least one visible section before publishing.";
  }
  if (sections.filter((x) => x.type === "hero").length > 1) errors.sections = "Use only one hero per page.";
  sections.forEach((sec, i) => {
    const e = sectionErrors(sec, i, status === "published" && !sec.hidden);
    if (e.length) errors[`section:${sec.id}`] = e.join(" ");
  });
  return { input, errors };
}
