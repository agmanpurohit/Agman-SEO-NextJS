import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { absUrl } from "@/lib/seo";
import { listLivePosts } from "@/lib/blog/db";

/**
 * Indexable pages only, on the canonical domain. URLs match each page's canonical exactly.
 * Admin, API and individual audit result pages are deliberately left out (they're noindex).
 * Blog posts are included automatically once published (unless set to noindex or canonicalised elsewhere).
 */
export const revalidate = 300;

const PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; images?: string[] }[] = [
  { path: "/", priority: 1, changeFrequency: "monthly", images: [`${site.url}${site.photo}`] },
  { path: "/work", priority: 0.9, changeFrequency: "monthly" },
  { path: "/seo-audit", priority: 0.9, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
  { path: "/experience", priority: 0.8, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.7, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = PAGES.map((p) => ({
    url: absUrl(p.path),
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
    ...(p.images ? { images: p.images } : {}),
  }));

  const posts = await listLivePosts().catch(() => []);
  const postEntries: MetadataRoute.Sitemap = posts
    // Skip noindex posts and posts whose canonical points to another URL (e.g. syndicated articles).
    .filter((p) => !p.noindex && (!p.canonicalUrl || p.canonicalUrl === absUrl(`/blog/${p.slug}`)))
    .map((p) => ({
      url: absUrl(`/blog/${p.slug}`),
      lastModified: new Date(p.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      ...(p.coverImage ? { images: [p.coverImage.startsWith("/") ? `${site.url}${p.coverImage}` : p.coverImage] } : {}),
    }));
  return [...pages, ...postEntries];
}
