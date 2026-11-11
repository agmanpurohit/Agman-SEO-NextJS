import "server-only";
import { cache } from "react";
import { sql } from "@/lib/audit/db";

/**
 * Site manager storage: per-page SEO overrides, editable settings (robots.txt), sitemap rules
 * and redirects. Tables are created on first use, in the same Neon database as the rest.
 */
let ready: Promise<void> | null = null;
export function ensureSiteSchema() {
  if (!ready) {
    ready = (async () => {
      const q = sql();
      await q`CREATE TABLE IF NOT EXISTS seo_overrides (
        path TEXT PRIMARY KEY,
        title TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        canonical TEXT NOT NULL DEFAULT '',
        robots_index BOOLEAN,
        robots_follow BOOLEAN,
        og_title TEXT NOT NULL DEFAULT '',
        og_description TEXT NOT NULL DEFAULT '',
        og_image TEXT NOT NULL DEFAULT '',
        custom_schema TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await q`CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await q`CREATE TABLE IF NOT EXISTS sitemap_rules (
        path TEXT PRIMARY KEY,
        include BOOLEAN NOT NULL DEFAULT true,
        priority REAL,
        changefreq TEXT,
        custom BOOLEAN NOT NULL DEFAULT false,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await q`CREATE TABLE IF NOT EXISTS redirects (
        id SERIAL PRIMARY KEY,
        source TEXT NOT NULL UNIQUE,
        destination TEXT NOT NULL,
        status INT NOT NULL DEFAULT 301,
        enabled BOOLEAN NOT NULL DEFAULT true,
        note TEXT NOT NULL DEFAULT '',
        hits INT NOT NULL DEFAULT 0,
        last_hit TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

// ── SEO overrides ──
export type SeoOverride = {
  path: string;
  title: string;
  description: string;
  canonical: string;
  robotsIndex: boolean | null;
  robotsFollow: boolean | null;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  customSchema: string;
  updatedAt?: string;
};

type Row = Record<string, unknown>;
const toOverride = (r: Row): SeoOverride => ({
  path: r.path as string,
  title: r.title as string,
  description: r.description as string,
  canonical: r.canonical as string,
  robotsIndex: (r.robots_index as boolean | null) ?? null,
  robotsFollow: (r.robots_follow as boolean | null) ?? null,
  ogTitle: r.og_title as string,
  ogDescription: r.og_description as string,
  ogImage: r.og_image as string,
  customSchema: r.custom_schema as string,
  updatedAt: r.updated_at ? new Date(r.updated_at as string).toISOString() : undefined,
});

/** All overrides, read once per render (metadata and page body share the result). */
export const allOverrides = cache(async (): Promise<Map<string, SeoOverride>> => {
  try {
    await ensureSiteSchema();
    const rows = (await sql()`SELECT * FROM seo_overrides`) as Row[];
    return new Map(rows.map((r) => [r.path as string, toOverride(r)]));
  } catch (e) {
    // The site must still render if the database is unreachable: fall back to coded defaults.
    console.error("seo overrides unavailable", e);
    return new Map();
  }
});

export const getOverride = async (path: string) => (await allOverrides()).get(path) ?? null;

export async function saveOverride(o: SeoOverride) {
  await ensureSiteSchema();
  await sql()`INSERT INTO seo_overrides (path, title, description, canonical, robots_index, robots_follow, og_title, og_description, og_image, custom_schema, updated_at)
    VALUES (${o.path}, ${o.title}, ${o.description}, ${o.canonical}, ${o.robotsIndex}, ${o.robotsFollow}, ${o.ogTitle}, ${o.ogDescription}, ${o.ogImage}, ${o.customSchema}, now())
    ON CONFLICT (path) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, canonical = EXCLUDED.canonical,
      robots_index = EXCLUDED.robots_index, robots_follow = EXCLUDED.robots_follow, og_title = EXCLUDED.og_title,
      og_description = EXCLUDED.og_description, og_image = EXCLUDED.og_image, custom_schema = EXCLUDED.custom_schema, updated_at = now()`;
}

export async function deleteOverride(path: string) {
  await ensureSiteSchema();
  await sql()`DELETE FROM seo_overrides WHERE path = ${path}`;
}

// ── settings ──
export async function getSetting<T>(key: string): Promise<T | null> {
  try {
    await ensureSiteSchema();
    const rows = (await sql()`SELECT value FROM site_settings WHERE key = ${key}`) as { value: T }[];
    return rows[0]?.value ?? null;
  } catch (e) {
    console.error(`setting ${key} unavailable`, e);
    return null;
  }
}

export async function setSetting(key: string, value: unknown) {
  await ensureSiteSchema();
  await sql()`INSERT INTO site_settings (key, value, updated_at) VALUES (${key}, ${JSON.stringify(value)}::jsonb, now())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
}

export async function deleteSetting(key: string) {
  await ensureSiteSchema();
  await sql()`DELETE FROM site_settings WHERE key = ${key}`;
}

// ── sitemap rules ──
export type SitemapRule = { path: string; include: boolean; priority: number | null; changefreq: string | null; custom: boolean };

export async function listSitemapRules(): Promise<SitemapRule[]> {
  try {
    await ensureSiteSchema();
    const rows = (await sql()`SELECT path, include, priority, changefreq, custom FROM sitemap_rules ORDER BY path`) as Row[];
    return rows.map((r) => ({ path: r.path as string, include: r.include as boolean, priority: (r.priority as number | null) ?? null, changefreq: (r.changefreq as string | null) ?? null, custom: r.custom as boolean }));
  } catch (e) {
    console.error("sitemap rules unavailable", e);
    return [];
  }
}

export async function saveSitemapRule(r: SitemapRule) {
  await ensureSiteSchema();
  await sql()`INSERT INTO sitemap_rules (path, include, priority, changefreq, custom, updated_at) VALUES (${r.path}, ${r.include}, ${r.priority}, ${r.changefreq}, ${r.custom}, now())
    ON CONFLICT (path) DO UPDATE SET include = EXCLUDED.include, priority = EXCLUDED.priority, changefreq = EXCLUDED.changefreq, custom = EXCLUDED.custom, updated_at = now()`;
}

export async function deleteSitemapRule(path: string) {
  await ensureSiteSchema();
  await sql()`DELETE FROM sitemap_rules WHERE path = ${path}`;
}

// ── redirects ──
export type Redirect = { id: number; source: string; destination: string; status: number; enabled: boolean; note: string; hits: number; lastHit: string | null; createdAt: string };

export async function listRedirects(): Promise<Redirect[]> {
  await ensureSiteSchema();
  const rows = (await sql()`SELECT * FROM redirects ORDER BY created_at DESC`) as Row[];
  return rows.map((r) => ({
    id: r.id as number,
    source: r.source as string,
    destination: r.destination as string,
    status: r.status as number,
    enabled: r.enabled as boolean,
    note: r.note as string,
    hits: r.hits as number,
    lastHit: r.last_hit ? new Date(r.last_hit as string).toISOString() : null,
    createdAt: new Date(r.created_at as string).toISOString(),
  }));
}

export async function saveRedirect(r: { id?: number; source: string; destination: string; status: number; enabled: boolean; note: string }) {
  await ensureSiteSchema();
  if (r.id) {
    await sql()`UPDATE redirects SET source = ${r.source}, destination = ${r.destination}, status = ${r.status}, enabled = ${r.enabled}, note = ${r.note}, updated_at = now() WHERE id = ${r.id}`;
  } else {
    await sql()`INSERT INTO redirects (source, destination, status, enabled, note) VALUES (${r.source}, ${r.destination}, ${r.status}, ${r.enabled}, ${r.note})`;
  }
}

export async function deleteRedirect(id: number) {
  await ensureSiteSchema();
  await sql()`DELETE FROM redirects WHERE id = ${id}`;
}

export async function redirectSourceTaken(source: string, exceptId?: number) {
  await ensureSiteSchema();
  const rows = (await sql()`SELECT 1 FROM redirects WHERE lower(source) = lower(${source}) AND id <> ${exceptId ?? -1} LIMIT 1`) as unknown[];
  return rows.length > 0;
}
