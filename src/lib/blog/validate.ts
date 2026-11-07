import "server-only";
import { slugify, type PostInput } from "./types";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const list = (v: unknown, maxItems: number, maxLen: number) =>
  Array.isArray(v) ? [...new Set(v.filter((x) => typeof x === "string").map((x) => (x as string).trim().slice(0, maxLen)).filter(Boolean))].slice(0, maxItems) : [];
/** Only https URLs or site-relative paths are accepted for images and canonicals. */
const url = (v: unknown) => {
  const s = str(v, 2000);
  if (!s) return "";
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : "";
  } catch {
    return "";
  }
};

/** Coerces untrusted JSON into a valid PostInput and returns field errors. */
export function parsePostInput(body: Record<string, unknown>): { input: PostInput; errors: Record<string, string> } {
  const title = str(body.title, 200);
  const slug = slugify(str(body.slug, 120) || title);
  const status = body.status === "published" ? "published" : "draft";
  let publishedAt: string | null = null;
  if (typeof body.publishedAt === "string" && body.publishedAt) {
    const d = new Date(body.publishedAt);
    if (!Number.isNaN(d.getTime())) publishedAt = d.toISOString();
  }
  const faq = Array.isArray(body.faq)
    ? (body.faq as unknown[])
        .map((f) => (f && typeof f === "object" ? { q: str((f as Record<string, unknown>).q, 300), a: str((f as Record<string, unknown>).a, 2000) } : null))
        .filter((f): f is { q: string; a: string } => !!f && !!f.q && !!f.a)
        .slice(0, 20)
    : [];

  const input: PostInput = {
    title,
    slug,
    excerpt: str(body.excerpt, 400),
    contentMd: typeof body.contentMd === "string" ? body.contentMd.slice(0, 200_000) : "",
    coverImage: url(body.coverImage) || null,
    coverAlt: str(body.coverAlt, 250),
    category: str(body.category, 60),
    tags: list(body.tags, 15, 40),
    focusKeyword: str(body.focusKeyword, 100),
    secondaryKeywords: list(body.secondaryKeywords, 10, 100),
    metaTitle: str(body.metaTitle, 120),
    metaDescription: str(body.metaDescription, 320),
    canonicalUrl: url(body.canonicalUrl),
    noindex: body.noindex === true,
    nofollow: body.nofollow === true,
    ogTitle: str(body.ogTitle, 120),
    ogDescription: str(body.ogDescription, 320),
    ogImage: url(body.ogImage) || null,
    faq,
    status,
    publishedAt,
    featured: body.featured === true,
  };

  const errors: Record<string, string> = {};
  if (title.length < 3) errors.title = "Give the post a title.";
  if (!slug) errors.slug = "The URL slug can’t be empty.";
  if (status === "published") {
    if (!input.contentMd.trim()) errors.contentMd = "Write some content before publishing.";
    if (input.coverImage && !input.coverAlt) errors.coverAlt = "Add alt text for the cover image.";
  }
  return { input, errors };
}
