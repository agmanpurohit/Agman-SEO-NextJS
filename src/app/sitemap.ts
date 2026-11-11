import type { MetadataRoute } from "next";
import { sitemapRows } from "@/lib/site/sitemap";

/**
 * Indexable pages only, on the canonical domain. URLs match each page's canonical exactly.
 * The page list lives in src/lib/site/registry.ts; Admin → SEO → Sitemap can exclude pages,
 * change priority or change frequency, and add extra URLs. Pages set to noindex (in the SEO
 * manager or the blog editor) or canonicalised elsewhere are left out automatically.
 *
 * lastmod dates are real: deploy time for pages that change on deploy, last edit (or publish
 * time) for posts, newest post for /blog. Saving in the dashboard refreshes this file at once;
 * the 60-second fallback also picks up scheduled posts within a minute of going live.
 */
export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rows = await sitemapRows();
  return rows
    .filter((r) => r.include)
    .map((r) => ({
      url: r.url,
      lastModified: r.lastModified,
      changeFrequency: r.changefreq,
      priority: r.priority,
      ...(r.images ? { images: r.images } : {}),
    }));
}
