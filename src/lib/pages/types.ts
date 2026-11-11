/**
 * Page builder: section types, page shape, templates and URL rules. Shared by the admin
 * editor (client) and the server (validation, storage, rendering).
 *
 * Text fields in cards, steps, FAQs and similar accept [link text](/path) for links, the
 * same syntax the service pages use. "Text" and "Image + text" sections hold rich HTML from
 * the visual editor, cleaned on the server before it is saved.
 */
export type Img = { url: string; alt: string; width?: number; height?: number };
export type Cta = { label: string; href: string };

type Base = { id: string; hidden?: boolean };

export type HeroSection = Base & { type: "hero"; eyebrow: string; heading: string; text: string; image: Img | null; primary: Cta; secondary: Cta };
export type AnswerSection = Base & { type: "answer"; question: string; answer: string };
export type TextSection = Base & { type: "text"; eyebrow: string; heading: string; html: string };
export type ImageTextSection = Base & { type: "imageText"; eyebrow: string; heading: string; html: string; image: Img | null; imageSide: "left" | "right"; cta: Cta };
export type CardsSection = Base & { type: "cards"; eyebrow: string; heading: string; intro: string; columns: 2 | 3 | 4; items: { title: string; text: string; href: string }[] };
export type StepsSection = Base & { type: "steps"; eyebrow: string; heading: string; items: { title: string; text: string }[] };
export type StatsSection = Base & { type: "stats"; eyebrow: string; heading: string; items: { value: string; label: string; context: string }[] };
export type ImageSection = Base & { type: "image"; image: Img | null; caption: string; wide: boolean };
export type QuoteSection = Base & { type: "quote"; quote: string; name: string; role: string };
export type FaqSection = Base & { type: "faq"; eyebrow: string; heading: string; items: { q: string; a: string }[] };
export type LinksSection = Base & { type: "links"; heading: string; links: { label: string; href: string; note: string }[] };
export type CtaSection = Base & { type: "cta"; eyebrow: string; heading: string; text: string; primary: Cta; secondary: Cta };
export type ClosingSection = Base & { type: "closing"; label: string; line1: string; line2: string; body: string };

export type Section =
  | HeroSection
  | AnswerSection
  | TextSection
  | ImageTextSection
  | CardsSection
  | StepsSection
  | StatsSection
  | ImageSection
  | QuoteSection
  | FaqSection
  | LinksSection
  | CtaSection
  | ClosingSection;
export type SectionType = Section["type"];

export type PageStatus = "draft" | "published";
export type PageInput = {
  title: string;
  slug: string;
  status: PageStatus;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  noindex: boolean;
  customSchema: string;
  sections: Section[];
};
export type BuilderPage = PageInput & { id: number; createdAt: string; updatedAt: string; publishedAt: string | null };

export const LIMITS = { sections: 40, items: 24, html: 60_000, short: 160, text: 1_200 } as const;

// ── URLs ──
/** First URL segments the site already uses (or reserves), so a page can't hide a real route. */
export const RESERVED = [
  "admin", "api", "blog", "contact", "experience", "work", "free-seo-tools", "seo-audit", "india",
  "sitemap.xml", "robots.txt", "favicon.ico", "icon.svg", "manifest.webmanifest", "opengraph-image",
  "_next", "static", "public", "assets", "images", "fonts", "feed", "rss", "search", "login", "wp-admin", "wp-login.php",
];
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*){0,2}$/;
export const pagePath = (slug: string) => `/${slug}`;

export function slugProblem(slug: string): string | null {
  if (!slug) return "Add a URL.";
  if (slug.length > 120) return "Keep the URL under 120 characters.";
  if (!SLUG_RE.test(slug)) return "Use lowercase letters, numbers and hyphens, with up to 3 parts separated by / (e.g. uae/seo-specialist).";
  if (RESERVED.includes(slug.split("/")[0])) return `“/${slug.split("/")[0]}” is already used by the site. Pick another URL.`;
  return null;
}

export const toSlug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9/]+/g, "-")
    .replace(/\/+/g, "/")
    .replace(/(^[-/]+|[-/]+$)/g, "")
    .replace(/-*\/-*/g, "/")
    .slice(0, 120);

export const newId = () => Math.random().toString(36).slice(2, 10);

// ── Catalogue ──
const cta = (label = "", href = ""): Cta => ({ label, href });

export const SECTION_TYPES: { type: SectionType; label: string; hint: string; make: () => Section }[] = [
  {
    type: "hero",
    label: "Hero",
    hint: "Big page heading (the H1), intro, buttons and an optional image. Use once, at the top.",
    make: () => ({ id: newId(), type: "hero", eyebrow: "", heading: "", text: "", image: null, primary: cta("Discuss your project", "/contact"), secondary: cta("Free SEO audit", "/seo-audit") }),
  },
  {
    type: "answer",
    label: "Direct answer",
    hint: "One question with a short, direct answer. Helps Google snippets and AI answers quote the page.",
    make: () => ({ id: newId(), type: "answer", question: "", answer: "" }),
  },
  { type: "text", label: "Text", hint: "Rich text with headings, lists, links and images (visual editor).", make: () => ({ id: newId(), type: "text", eyebrow: "", heading: "", html: "" }) },
  {
    type: "imageText",
    label: "Image + text",
    hint: "An image beside rich text, with an optional button.",
    make: () => ({ id: newId(), type: "imageText", eyebrow: "", heading: "", html: "", image: null, imageSide: "right", cta: cta() }),
  },
  {
    type: "cards",
    label: "Cards",
    hint: "A grid of numbered cards: services, features, what's included. Cards can link to pages.",
    make: () => ({ id: newId(), type: "cards", eyebrow: "", heading: "", intro: "", columns: 3, items: [{ title: "", text: "", href: "" }] }),
  },
  { type: "steps", label: "Steps", hint: "A numbered process: how you work, step by step.", make: () => ({ id: newId(), type: "steps", eyebrow: "", heading: "", items: [{ title: "", text: "" }] }) },
  {
    type: "stats",
    label: "Numbers",
    hint: "Big numbers with a label and context. Use real, verifiable results only.",
    make: () => ({ id: newId(), type: "stats", eyebrow: "", heading: "", items: [{ value: "", label: "", context: "" }] }),
  },
  { type: "image", label: "Image", hint: "A single image with an optional caption.", make: () => ({ id: newId(), type: "image", image: null, caption: "", wide: false }) },
  { type: "quote", label: "Quote", hint: "A testimonial or pull quote.", make: () => ({ id: newId(), type: "quote", quote: "", name: "", role: "" }) },
  {
    type: "faq",
    label: "FAQs",
    hint: "Questions and answers. FAQ structured data is added automatically.",
    make: () => ({ id: newId(), type: "faq", eyebrow: "", heading: "Frequently asked questions", items: [{ q: "", a: "" }] }),
  },
  {
    type: "links",
    label: "Related pages",
    hint: "Internal links to other pages on the site, so visitors and crawlers can move between them.",
    make: () => ({ id: newId(), type: "links", heading: "Related pages", links: [] }),
  },
  {
    type: "cta",
    label: "Call to action",
    hint: "A short boxed prompt with one or two buttons.",
    make: () => ({ id: newId(), type: "cta", eyebrow: "", heading: "", text: "", primary: cta("Get in touch", "/contact"), secondary: cta() }),
  },
  {
    type: "closing",
    label: "Closing banner",
    hint: "The large animated closing block used across the site, linking to the contact page.",
    make: () => ({ id: newId(), type: "closing", label: "Start a project", line1: "Ready to grow", line2: "your business?", body: "" }),
  },
];
export const sectionLabel = (t: SectionType) => SECTION_TYPES.find((s) => s.type === t)?.label ?? t;
export const makeSection = (t: SectionType) => SECTION_TYPES.find((s) => s.type === t)!.make();

// ── Templates ──
const filled = <T extends Section>(t: T["type"], patch: Partial<T>) => ({ ...(makeSection(t) as T), ...patch });

export const TEMPLATES: { key: string; label: string; hint: string; sections: () => Section[] }[] = [
  { key: "blank", label: "Blank", hint: "Start with an empty hero.", sections: () => [makeSection("hero")] },
  {
    key: "service",
    label: "Service page",
    hint: "Same structure as the India service pages: hero, direct answer, context, scope, process, proof, FAQs, links, closing.",
    sections: () => [
      makeSection("hero"),
      makeSection("answer"),
      filled<TextSection>("text", { eyebrow: "Context" }),
      filled<CardsSection>("cards", { eyebrow: "Scope", heading: "What's included", columns: 4 }),
      filled<StepsSection>("steps", { eyebrow: "How it works", heading: "How I work, step by step" }),
      filled<StatsSection>("stats", { eyebrow: "Proof" }),
      makeSection("faq"),
      makeSection("links"),
      makeSection("closing"),
    ],
  },
  {
    key: "landing",
    label: "Landing page",
    hint: "Short campaign page: hero, benefits, image + text, call to action.",
    sections: () => [makeSection("hero"), filled<CardsSection>("cards", { heading: "Why it works", columns: 3 }), makeSection("imageText"), makeSection("faq"), makeSection("cta")],
  },
];

/** A section's main heading, for the editor outline. */
export function sectionSummary(s: Section): string {
  switch (s.type) {
    case "answer":
      return s.question;
    case "image":
      return s.caption || s.image?.alt || "";
    case "quote":
      return s.quote.slice(0, 80);
    case "closing":
      return `${s.line1} ${s.line2}`.trim();
    default:
      return "heading" in s ? s.heading : "";
  }
}

/** Every image URL a page uses (for the media library's "used in" list). */
export function pageImages(p: Pick<PageInput, "ogImage" | "sections">): string[] {
  const out = new Set<string>();
  if (p.ogImage) out.add(p.ogImage);
  for (const s of p.sections) {
    if ("image" in s && s.image?.url) out.add(s.image.url);
    if ("html" in s) for (const m of s.html.matchAll(/<img[^>]+src="([^"]+)"/g)) out.add(m[1]);
  }
  return [...out];
}
