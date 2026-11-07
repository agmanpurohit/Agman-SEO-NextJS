import "server-only";
import { sql } from "@/lib/audit/db";
import type { Post, PostInput, PostSummary, TocItem } from "./types";

let ready: Promise<void> | null = null;

/** Creates blog tables on first use (idempotent), in the same Neon database as the audit tool. */
export function ensureBlogSchema() {
  if (!ready) {
    ready = (async () => {
      const q = sql();
      await q`CREATE TABLE IF NOT EXISTS blog_posts (
        id SERIAL PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        excerpt TEXT NOT NULL DEFAULT '',
        content_md TEXT NOT NULL DEFAULT '',
        content_html TEXT NOT NULL DEFAULT '',
        toc JSONB NOT NULL DEFAULT '[]'::jsonb,
        cover_image TEXT,
        cover_alt TEXT NOT NULL DEFAULT '',
        category TEXT NOT NULL DEFAULT '',
        tags TEXT[] NOT NULL DEFAULT '{}',
        focus_keyword TEXT NOT NULL DEFAULT '',
        secondary_keywords TEXT[] NOT NULL DEFAULT '{}',
        meta_title TEXT NOT NULL DEFAULT '',
        meta_description TEXT NOT NULL DEFAULT '',
        canonical_url TEXT NOT NULL DEFAULT '',
        noindex BOOLEAN NOT NULL DEFAULT false,
        nofollow BOOLEAN NOT NULL DEFAULT false,
        og_title TEXT NOT NULL DEFAULT '',
        og_description TEXT NOT NULL DEFAULT '',
        og_image TEXT,
        faq JSONB NOT NULL DEFAULT '[]'::jsonb,
        status TEXT NOT NULL DEFAULT 'draft',
        published_at TIMESTAMPTZ,
        featured BOOLEAN NOT NULL DEFAULT false,
        word_count INT NOT NULL DEFAULT 0,
        reading_minutes INT NOT NULL DEFAULT 1,
        seo_score INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await q`CREATE INDEX IF NOT EXISTS blog_posts_live ON blog_posts (status, published_at DESC)`;
      // Old slugs keep working: a renamed post's previous URLs 308-redirect to the new one.
      await q`CREATE TABLE IF NOT EXISTS blog_redirects (
        old_slug TEXT PRIMARY KEY,
        post_id INT NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await q`CREATE TABLE IF NOT EXISTS blog_media (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        mime TEXT NOT NULL,
        bytes BYTEA NOT NULL,
        size INT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

type Row = Record<string, unknown>;
const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : null);

function toPost(r: Row): Post {
  return {
    id: r.id as number,
    slug: r.slug as string,
    title: r.title as string,
    excerpt: r.excerpt as string,
    contentMd: r.content_md as string,
    contentHtml: r.content_html as string,
    toc: (r.toc as TocItem[]) ?? [],
    coverImage: (r.cover_image as string) ?? null,
    coverAlt: r.cover_alt as string,
    category: r.category as string,
    tags: (r.tags as string[]) ?? [],
    focusKeyword: r.focus_keyword as string,
    secondaryKeywords: (r.secondary_keywords as string[]) ?? [],
    metaTitle: r.meta_title as string,
    metaDescription: r.meta_description as string,
    canonicalUrl: r.canonical_url as string,
    noindex: r.noindex as boolean,
    nofollow: r.nofollow as boolean,
    ogTitle: r.og_title as string,
    ogDescription: r.og_description as string,
    ogImage: (r.og_image as string) ?? null,
    faq: (r.faq as Post["faq"]) ?? [],
    status: r.status as Post["status"],
    publishedAt: iso(r.published_at),
    featured: r.featured as boolean,
    wordCount: r.word_count as number,
    readingMinutes: r.reading_minutes as number,
    seoScore: r.seo_score as number,
    createdAt: iso(r.created_at)!,
    updatedAt: iso(r.updated_at)!,
  };
}

function toSummary(r: Row): PostSummary {
  const p = toPost({ ...r, content_md: "", content_html: "", toc: [], faq: [] });
  const { id, title, slug, excerpt, coverImage, coverAlt, category, tags, status, publishedAt, updatedAt, readingMinutes, featured, seoScore, noindex, canonicalUrl } = p;
  return { id, title, slug, excerpt, coverImage, coverAlt, category, tags, status, publishedAt, updatedAt, readingMinutes, featured, seoScore, noindex, canonicalUrl };
}

const SUMMARY_COLS = "id, slug, title, excerpt, cover_image, cover_alt, category, tags, status, published_at, updated_at, reading_minutes, featured, seo_score, noindex, canonical_url";

/** Published posts whose publish time has passed, newest first. */
export async function listLivePosts(): Promise<PostSummary[]> {
  await ensureBlogSchema();
  const rows = (await sql().query(`SELECT ${SUMMARY_COLS} FROM blog_posts WHERE status = 'published' AND published_at <= now() ORDER BY published_at DESC LIMIT 500`)) as Row[];
  return rows.map(toSummary);
}

export async function getLivePostBySlug(slug: string): Promise<Post | null> {
  await ensureBlogSchema();
  const rows = (await sql()`SELECT * FROM blog_posts WHERE slug = ${slug} AND status = 'published' AND published_at <= now() LIMIT 1`) as Row[];
  return rows[0] ? toPost(rows[0]) : null;
}

/** For a retired slug, the post's current slug (if that post is live). */
export async function resolveRedirect(slug: string): Promise<string | null> {
  await ensureBlogSchema();
  const rows = (await sql()`SELECT p.slug FROM blog_redirects r JOIN blog_posts p ON p.id = r.post_id
    WHERE r.old_slug = ${slug} AND p.status = 'published' AND p.published_at <= now() LIMIT 1`) as { slug: string }[];
  return rows[0]?.slug ?? null;
}

export async function listAllPosts(): Promise<PostSummary[]> {
  await ensureBlogSchema();
  const rows = (await sql().query(`SELECT ${SUMMARY_COLS} FROM blog_posts ORDER BY updated_at DESC`)) as Row[];
  return rows.map(toSummary);
}

export async function getPostById(id: number): Promise<Post | null> {
  await ensureBlogSchema();
  const rows = (await sql()`SELECT * FROM blog_posts WHERE id = ${id}`) as Row[];
  return rows[0] ? toPost(rows[0]) : null;
}

export async function slugTaken(slug: string, exceptId?: number) {
  await ensureBlogSchema();
  const rows = (await sql()`SELECT 1 FROM blog_posts WHERE slug = ${slug} AND id <> ${exceptId ?? -1}
    UNION SELECT 1 FROM blog_redirects WHERE old_slug = ${slug} AND post_id <> ${exceptId ?? -1} LIMIT 1`) as unknown[];
  return rows.length > 0;
}

export type Derived = { contentHtml: string; toc: TocItem[]; wordCount: number; readingMinutes: number; seoScore: number };

export async function savePost(input: PostInput, d: Derived, id?: number): Promise<Post> {
  await ensureBlogSchema();
  const q = sql();
  const v = {
    ...input,
    tags: input.tags,
    secondaryKeywords: input.secondaryKeywords,
    faq: JSON.stringify(input.faq),
    toc: JSON.stringify(d.toc),
    // Publishing without a date means "now"; drafts keep whatever date was set.
    publishedAt: input.status === "published" ? (input.publishedAt ?? new Date().toISOString()) : input.publishedAt,
  };
  let rows: Row[];
  if (id) {
    const before = (await q`SELECT slug FROM blog_posts WHERE id = ${id}`) as { slug: string }[];
    if (!before.length) throw new Error("not_found");
    rows = (await q`UPDATE blog_posts SET
      slug = ${v.slug}, title = ${v.title}, excerpt = ${v.excerpt}, content_md = ${v.contentMd}, content_html = ${d.contentHtml},
      toc = ${v.toc}::jsonb, cover_image = ${v.coverImage}, cover_alt = ${v.coverAlt}, category = ${v.category}, tags = ${v.tags}::text[],
      focus_keyword = ${v.focusKeyword}, secondary_keywords = ${v.secondaryKeywords}::text[], meta_title = ${v.metaTitle},
      meta_description = ${v.metaDescription}, canonical_url = ${v.canonicalUrl}, noindex = ${v.noindex}, nofollow = ${v.nofollow},
      og_title = ${v.ogTitle}, og_description = ${v.ogDescription}, og_image = ${v.ogImage}, faq = ${v.faq}::jsonb,
      status = ${v.status}, published_at = ${v.publishedAt}, featured = ${v.featured}, word_count = ${d.wordCount},
      reading_minutes = ${d.readingMinutes}, seo_score = ${d.seoScore}, updated_at = now()
      WHERE id = ${id} RETURNING *`) as Row[];
    if (before[0].slug !== v.slug) {
      await q`INSERT INTO blog_redirects (old_slug, post_id) VALUES (${before[0].slug}, ${id}) ON CONFLICT (old_slug) DO UPDATE SET post_id = EXCLUDED.post_id`;
      await q`DELETE FROM blog_redirects WHERE old_slug = ${v.slug}`;
    }
  } else {
    rows = (await q`INSERT INTO blog_posts (slug, title, excerpt, content_md, content_html, toc, cover_image, cover_alt, category, tags,
      focus_keyword, secondary_keywords, meta_title, meta_description, canonical_url, noindex, nofollow, og_title, og_description,
      og_image, faq, status, published_at, featured, word_count, reading_minutes, seo_score)
      VALUES (${v.slug}, ${v.title}, ${v.excerpt}, ${v.contentMd}, ${d.contentHtml}, ${v.toc}::jsonb, ${v.coverImage}, ${v.coverAlt},
      ${v.category}, ${v.tags}::text[], ${v.focusKeyword}, ${v.secondaryKeywords}::text[], ${v.metaTitle}, ${v.metaDescription},
      ${v.canonicalUrl}, ${v.noindex}, ${v.nofollow}, ${v.ogTitle}, ${v.ogDescription}, ${v.ogImage}, ${v.faq}::jsonb, ${v.status},
      ${v.publishedAt}, ${v.featured}, ${d.wordCount}, ${d.readingMinutes}, ${d.seoScore}) RETURNING *`) as Row[];
  }
  return toPost(rows[0]);
}

export async function deletePost(id: number) {
  await ensureBlogSchema();
  const rows = (await sql()`DELETE FROM blog_posts WHERE id = ${id} RETURNING slug`) as { slug: string }[];
  return rows[0]?.slug ?? null;
}

export async function listCategories(): Promise<string[]> {
  await ensureBlogSchema();
  const rows = (await sql()`SELECT DISTINCT category FROM blog_posts WHERE category <> '' ORDER BY category`) as { category: string }[];
  return rows.map((r) => r.category);
}

// ── media ──
export async function saveMedia(id: string, filename: string, mime: string, data: Buffer) {
  await ensureBlogSchema();
  await sql()`INSERT INTO blog_media (id, filename, mime, bytes, size) VALUES (${id}, ${filename}, ${mime}, ${"\\x" + data.toString("hex")}::bytea, ${data.length})`;
}

export async function getMedia(id: string): Promise<{ mime: string; data: Buffer } | null> {
  await ensureBlogSchema();
  const rows = (await sql()`SELECT mime, encode(bytes, 'base64') AS b64 FROM blog_media WHERE id = ${id}`) as { mime: string; b64: string }[];
  return rows[0] ? { mime: rows[0].mime, data: Buffer.from(rows[0].b64, "base64") } : null;
}

export async function listMedia() {
  await ensureBlogSchema();
  return (await sql()`SELECT id, filename, mime, size, created_at FROM blog_media ORDER BY created_at DESC LIMIT 200`) as { id: string; filename: string; mime: string; size: number; created_at: string }[];
}
