import "server-only";
import { cache } from "react";
import { sql } from "@/lib/audit/db";
import type { BuilderPage, PageInput, Section } from "./types";

/** Pages made in the page builder. Created on first use, in the same Neon database. */
let ready: Promise<void> | null = null;
export function ensurePagesSchema() {
  if (!ready) {
    ready = (async () => {
      await sql()`CREATE TABLE IF NOT EXISTS builder_pages (
        id SERIAL PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        meta_title TEXT NOT NULL DEFAULT '',
        meta_description TEXT NOT NULL DEFAULT '',
        og_image TEXT NOT NULL DEFAULT '',
        noindex BOOLEAN NOT NULL DEFAULT false,
        custom_schema TEXT NOT NULL DEFAULT '',
        sections JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        published_at TIMESTAMPTZ
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
function toPage(r: Row): BuilderPage {
  return {
    id: r.id as number,
    slug: r.slug as string,
    title: r.title as string,
    status: r.status === "published" ? "published" : "draft",
    metaTitle: r.meta_title as string,
    metaDescription: r.meta_description as string,
    ogImage: r.og_image as string,
    noindex: r.noindex as boolean,
    customSchema: r.custom_schema as string,
    sections: (r.sections as Section[]) ?? [],
    createdAt: iso(r.created_at)!,
    updatedAt: iso(r.updated_at)!,
    publishedAt: iso(r.published_at),
  };
}

export async function listPages(): Promise<BuilderPage[]> {
  await ensurePagesSchema();
  return ((await sql()`SELECT * FROM builder_pages ORDER BY updated_at DESC`) as Row[]).map(toPage);
}

/** Published pages (cached per request: the registry, sitemap and route all read it). */
export const listLivePages = cache(async (): Promise<BuilderPage[]> => {
  await ensurePagesSchema();
  return ((await sql()`SELECT * FROM builder_pages WHERE status = 'published' ORDER BY slug`) as Row[]).map(toPage);
});

export async function getPage(id: number): Promise<BuilderPage | null> {
  await ensurePagesSchema();
  const [r] = (await sql()`SELECT * FROM builder_pages WHERE id = ${id}`) as Row[];
  return r ? toPage(r) : null;
}

export const getLivePage = cache(async (slug: string): Promise<BuilderPage | null> => {
  await ensurePagesSchema();
  const [r] = (await sql()`SELECT * FROM builder_pages WHERE slug = ${slug} AND status = 'published'`) as Row[];
  return r ? toPage(r) : null;
});

export async function pageSlugTaken(slug: string, exceptId?: number) {
  await ensurePagesSchema();
  const rows = (await sql()`SELECT 1 FROM builder_pages WHERE slug = ${slug} AND id <> ${exceptId ?? -1} LIMIT 1`) as unknown[];
  return rows.length > 0;
}

export async function savePage(p: PageInput, id?: number): Promise<BuilderPage> {
  await ensurePagesSchema();
  const sections = JSON.stringify(p.sections);
  const rows = id
    ? ((await sql()`UPDATE builder_pages SET
        slug = ${p.slug}, title = ${p.title}, status = ${p.status}, meta_title = ${p.metaTitle},
        meta_description = ${p.metaDescription}, og_image = ${p.ogImage}, noindex = ${p.noindex},
        custom_schema = ${p.customSchema}, sections = ${sections}::jsonb, updated_at = now(),
        published_at = CASE WHEN ${p.status} = 'published' THEN COALESCE(published_at, now()) ELSE published_at END
      WHERE id = ${id} RETURNING *`) as Row[])
    : ((await sql()`INSERT INTO builder_pages (slug, title, status, meta_title, meta_description, og_image, noindex, custom_schema, sections, published_at)
        VALUES (${p.slug}, ${p.title}, ${p.status}, ${p.metaTitle}, ${p.metaDescription}, ${p.ogImage}, ${p.noindex}, ${p.customSchema}, ${sections}::jsonb,
          ${p.status === "published" ? new Date().toISOString() : null})
        RETURNING *`) as Row[]);
  if (!rows[0]) throw new Error("Page not found");
  return toPage(rows[0]);
}

export async function deletePage(id: number): Promise<BuilderPage | null> {
  await ensurePagesSchema();
  const [r] = (await sql()`DELETE FROM builder_pages WHERE id = ${id} RETURNING *`) as Row[];
  return r ? toPage(r) : null;
}
