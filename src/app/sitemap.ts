import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { absUrl } from "@/lib/seo";
import { listLivePosts } from "@/lib/blog/db";
import { tools, TOOLS_HUB } from "@/content/tools";

/**
 * Indexable pages only, on the canonical domain. URLs match each page's canonical exactly.
 * Admin, API and individual audit result pages are deliberately left out (they're noindex).
 * Blog posts are included automatically once published (unless set to noindex or canonicalised elsewhere).
 *
 * lastmod dates are real, so search engines can trust them: pages that only change when the
 * site is deployed use the deploy time; posts use their last edit (or publish time, if later);
 * /blog uses its newest post. Publishing or editing refreshes this file immediately; the
 * 60-second fallback also picks up scheduled posts within a minute of going live.
 */
export const revalidate = 60;

const DEPLOYED_AT = new Date(process.env.SITE_BUILT_AT ?? Date.now());
const latest = (...d: (Date | null)[]) => new Date(Math.max(...d.filter((x): x is Date => !!x && !isNaN(x.getTime())).map((x) => x.getTime())));

const PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; images?: string[] }[] = [
  { path: "/", priority: 1, changeFrequency: "monthly", images: [`${site.url}${site.photo}`] },
  { path: "/work", priority: 0.9, changeFrequency: "monthly" },
  { path: "/seo-audit", priority: 0.9, changeFrequency: "monthly" },
  { path: TOOLS_HUB.href, priority: 0.9, changeFrequency: "monthly" },
  ...tools.filter((t) => t.href !== "/seo-audit").map((t) => ({ path: t.href, priority: 0.8, changeFrequency: "monthly" as const })),
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
  { path: "/experience", priority: 0.8, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.7, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await listLivePosts().catch(() => []);
  const postModified = (p: (typeof posts)[number]) => latest(new Date(p.updatedAt), p.publishedAt ? new Date(p.publishedAt) : null);
  const newestPost = posts.length ? latest(...posts.map(postModified)) : null;

  const pages: MetadataRoute.Sitemap = PAGES.map((p) => ({
    url: absUrl(p.path),
    // The blog index changes whenever a post goes live or is edited.
    lastModified: p.path === "/blog" ? latest(DEPLOYED_AT, newestPost) : DEPLOYED_AT,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
    ...(p.images ? { images: p.images } : {}),
  }));

  const postEntries: MetadataRoute.Sitemap = posts
    // Skip noindex posts and posts whose canonical points to another URL (e.g. syndicated articles).
    .filter((p) => !p.noindex && (!p.canonicalUrl || p.canonicalUrl === absUrl(`/blog/${p.slug}`)))
    .map((p) => ({
      url: absUrl(`/blog/${p.slug}`),
      lastModified: postModified(p),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      ...(p.coverImage ? { images: [p.coverImage.startsWith("/") ? `${site.url}${p.coverImage}` : p.coverImage] } : {}),
    }));
  return [...pages, ...postEntries];
}
