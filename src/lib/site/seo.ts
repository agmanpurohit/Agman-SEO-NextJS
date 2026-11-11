import "server-only";
import type { Metadata } from "next";
import { site } from "@/content/site";
import { getOverride } from "./db";

/** Path of a page from its metadata canonical (pageMeta always sets an absolute one). */
function pathFromMetadata(m: Metadata): string | null {
  const c = m.alternates?.canonical;
  const href = typeof c === "string" ? c : c instanceof URL ? c.toString() : c && "url" in c ? String(c.url) : null;
  if (!href) return null;
  try {
    const u = new URL(href, site.url);
    return u.pathname.replace(/\/$/, "") || "/";
  } catch {
    return null;
  }
}

const abs = (u: string) => (u.startsWith("/") ? `${site.url}${u}` : u);

/**
 * Applies the SEO manager's saved override (if any) on top of a page's coded metadata.
 * Empty override fields keep the coded value, so clearing a field restores the default.
 */
export async function withSeo(base: Metadata, pathArg?: string): Promise<Metadata> {
  const path = pathArg ?? pathFromMetadata(base);
  if (!path) return base;
  const o = await getOverride(path);
  if (!o) return base;

  const m: Metadata = { ...base };
  if (o.title) m.title = { absolute: o.title };
  if (o.description) m.description = o.description;
  if (o.canonical) m.alternates = { ...base.alternates, canonical: abs(o.canonical) };
  if (o.robotsIndex !== null || o.robotsFollow !== null) {
    const index = o.robotsIndex ?? true;
    const follow = o.robotsFollow ?? true;
    m.robots = { index, follow, googleBot: { index, follow, ...(index ? { "max-image-preview": "large", "max-snippet": -1 } : {}) } };
  }
  const ogTitle = o.ogTitle || o.title;
  const ogDesc = o.ogDescription || o.description;
  if (ogTitle || ogDesc || o.ogImage) {
    const image = o.ogImage ? [{ url: abs(o.ogImage), width: 1200, height: 630 }] : undefined;
    m.openGraph = { ...base.openGraph, ...(ogTitle ? { title: ogTitle } : {}), ...(ogDesc ? { description: ogDesc } : {}), ...(image ? { images: image } : {}) };
    m.twitter = { ...base.twitter, ...(ogTitle ? { title: ogTitle } : {}), ...(ogDesc ? { description: ogDesc } : {}), ...(image ? { images: [image[0].url] } : {}) } as Metadata["twitter"];
  }
  return m;
}
