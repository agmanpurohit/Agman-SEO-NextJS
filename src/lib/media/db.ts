import "server-only";
import { sql } from "@/lib/audit/db";
import { ensureBlogSchema } from "@/lib/blog/db";
import { ensureSiteSchema } from "@/lib/site/db";

/**
 * Media library on top of the blog_media table: adds alt text, a display name and image
 * dimensions, and works out where each file is used (blog posts and page SEO overrides).
 * File URLs never change (/api/blog/media/<id>), so renaming or re-describing is always safe.
 */
let ready: Promise<void> | null = null;
export function ensureMediaSchema() {
  if (!ready) {
    ready = (async () => {
      await ensureBlogSchema();
      const q = sql();
      await q`ALTER TABLE blog_media ADD COLUMN IF NOT EXISTS alt TEXT NOT NULL DEFAULT ''`;
      await q`ALTER TABLE blog_media ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT ''`;
      await q`ALTER TABLE blog_media ADD COLUMN IF NOT EXISTS width INT`;
      await q`ALTER TABLE blog_media ADD COLUMN IF NOT EXISTS height INT`;
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

export const mediaUrl = (id: string) => `/api/blog/media/${id}`;

export type MediaUsage = { kind: "post" | "page"; label: string; href: string; where: string };
export type MediaItem = {
  id: string;
  url: string;
  filename: string;
  title: string;
  alt: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  createdAt: string;
  usage: MediaUsage[];
};

/** Reads width and height from the image bytes (sharp ships with Next.js). */
export async function imageSize(buf: Buffer): Promise<{ width: number | null; height: number | null }> {
  try {
    const sharp = (await import("sharp")).default;
    const m = await sharp(buf, { animated: false }).metadata();
    return { width: m.width ?? null, height: m.height ?? null };
  } catch {
    return { width: null, height: null };
  }
}

/** Where every media file is referenced, keyed by media id. */
async function usageMap(): Promise<Map<string, MediaUsage[]>> {
  await ensureSiteSchema();
  const q = sql();
  const [postRows, pageRows] = await Promise.all([q`SELECT id, title, content_md, cover_image, og_image, custom_schema FROM blog_posts`, q`SELECT path, og_image, custom_schema FROM seo_overrides`]);
  const posts = postRows as { id: number; title: string; content_md: string; cover_image: string | null; og_image: string | null; custom_schema: string }[];
  const pages = pageRows as { path: string; og_image: string; custom_schema: string }[];
  const map = new Map<string, MediaUsage[]>();
  const add = (id: string, u: MediaUsage) => {
    const list = map.get(id) ?? [];
    if (!list.some((x) => x.href === u.href && x.where === u.where)) list.push(u);
    map.set(id, list);
  };
  const ids = (s: string | null | undefined) => [...(s ?? "").matchAll(/\/api\/blog\/media\/([a-z0-9-]+\.[a-z]+)/g)].map((m) => m[1]);
  for (const p of posts) {
    const href = `/admin/blog/${p.id}`;
    ids(p.cover_image).forEach((id) => add(id, { kind: "post", label: p.title, href, where: "Cover image" }));
    ids(p.og_image).forEach((id) => add(id, { kind: "post", label: p.title, href, where: "Social image" }));
    ids(p.content_md).forEach((id) => add(id, { kind: "post", label: p.title, href, where: "In the article" }));
    ids(p.custom_schema).forEach((id) => add(id, { kind: "post", label: p.title, href, where: "Custom schema" }));
  }
  for (const o of pages) {
    const href = `/admin/seo/edit?path=${encodeURIComponent(o.path)}`;
    ids(o.og_image).forEach((id) => add(id, { kind: "page", label: o.path, href, where: "Social image" }));
    ids(o.custom_schema).forEach((id) => add(id, { kind: "page", label: o.path, href, where: "Custom schema" }));
  }
  return map;
}

export async function listMediaItems(): Promise<MediaItem[]> {
  await ensureMediaSchema();
  const rows = (await sql()`SELECT id, filename, title, alt, mime, size, width, height, created_at FROM blog_media ORDER BY created_at DESC LIMIT 1000`) as {
    id: string;
    filename: string;
    title: string;
    alt: string;
    mime: string;
    size: number;
    width: number | null;
    height: number | null;
    created_at: string;
  }[];
  // Older uploads have no stored dimensions yet: measure them once and save.
  const missing = rows.filter((r) => r.width == null).slice(0, 20);
  for (const r of missing) {
    const data = (await sql()`SELECT encode(bytes, 'base64') AS b64 FROM blog_media WHERE id = ${r.id}`) as { b64: string }[];
    if (!data[0]) continue;
    const { width, height } = await imageSize(Buffer.from(data[0].b64, "base64"));
    if (width && height) {
      await sql()`UPDATE blog_media SET width = ${width}, height = ${height} WHERE id = ${r.id}`;
      r.width = width;
      r.height = height;
    }
  }
  const usage = await usageMap();
  return rows.map((r) => ({
    id: r.id,
    url: mediaUrl(r.id),
    filename: r.filename,
    title: r.title,
    alt: r.alt,
    mime: r.mime,
    size: r.size,
    width: r.width,
    height: r.height,
    createdAt: new Date(r.created_at).toISOString(),
    usage: usage.get(r.id) ?? [],
  }));
}

export async function mediaUsageFor(id: string) {
  return (await usageMap()).get(id) ?? [];
}

export async function updateMediaInfo(id: string, info: { alt: string; title: string }) {
  await ensureMediaSchema();
  const rows = (await sql()`UPDATE blog_media SET alt = ${info.alt}, title = ${info.title} WHERE id = ${id} RETURNING id`) as unknown[];
  return rows.length > 0;
}

export async function setMediaDetails(id: string, d: { alt?: string; title?: string; width: number | null; height: number | null }) {
  await ensureMediaSchema();
  await sql()`UPDATE blog_media SET alt = ${d.alt ?? ""}, title = ${d.title ?? ""}, width = ${d.width}, height = ${d.height} WHERE id = ${id}`;
}

export async function deleteMediaItem(id: string) {
  await ensureMediaSchema();
  const rows = (await sql()`DELETE FROM blog_media WHERE id = ${id} RETURNING id`) as unknown[];
  return rows.length > 0;
}
