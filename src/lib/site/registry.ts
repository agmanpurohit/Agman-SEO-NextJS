import "server-only";
import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { tools, TOOLS_HUB } from "@/content/tools";
import { services, servicePath, marketPath } from "@/content/services";
import { india } from "@/content/services/india";
import { listLivePosts } from "@/lib/blog/db";
import { listLivePages } from "@/lib/pages/db";
import { pagePath } from "@/lib/pages/types";

/**
 * Every public, indexable page on the site, in one list. The sitemap and the SEO manager both
 * read it, so a page added here appears in both. Blog posts come from the database.
 */
export type ChangeFreq = MetadataRoute.Sitemap[number]["changeFrequency"];
export type SitePage = {
  path: string;
  label: string;
  group: "Main pages" | "Services · India" | "Free SEO tools" | "Blog posts" | "Custom pages";
  priority: number;
  changefreq: ChangeFreq;
  lastModified: Date;
  images?: string[];
  /** Blog posts: SEO is edited in the blog editor; post noindex/canonical are respected. */
  blog?: { id: number; noindex: boolean; canonicalUrl: string };
  /** Pages made in the page builder. */
  builder?: { id: number; noindex: boolean };
};

export const DEPLOYED_AT = new Date(process.env.SITE_BUILT_AT ?? Date.now());
const latest = (...d: (Date | null)[]) => new Date(Math.max(...d.filter((x): x is Date => !!x && !isNaN(x.getTime())).map((x) => x.getTime())));

export async function listSitePages(): Promise<SitePage[]> {
  const [posts, built] = await Promise.all([listLivePosts().catch(() => []), listLivePages().catch(() => [])]);
  const postModified = (p: (typeof posts)[number]) => latest(new Date(p.updatedAt), p.publishedAt ? new Date(p.publishedAt) : null);
  const newestPost = posts.length ? latest(...posts.map(postModified)) : null;
  const d = DEPLOYED_AT;

  return [
    { path: "/", label: "Home", group: "Main pages", priority: 1, changefreq: "monthly", lastModified: d, images: [`${site.url}${site.photo}`] },
    { path: "/work", label: "Work", group: "Main pages", priority: 0.9, changefreq: "monthly", lastModified: d },
    { path: "/experience", label: "Experience", group: "Main pages", priority: 0.8, changefreq: "monthly", lastModified: d },
    { path: "/blog", label: "Blog", group: "Main pages", priority: 0.8, changefreq: "weekly", lastModified: latest(d, newestPost) },
    { path: "/contact", label: "Contact", group: "Main pages", priority: 0.7, changefreq: "yearly", lastModified: d },
    { path: marketPath("india"), label: "Services in India", group: "Services · India", priority: 0.9, changefreq: "monthly", lastModified: d, images: [`${site.url}${marketPath("india")}/opengraph-image`] },
    ...services.map((s) => ({
      path: servicePath("india", s.slug),
      label: india.services[s.slug].h1,
      group: "Services · India" as const,
      priority: 0.9,
      changefreq: "monthly" as const,
      lastModified: d,
      images: [`${site.url}${servicePath("india", s.slug)}/opengraph-image`],
    })),
    { path: TOOLS_HUB.href, label: TOOLS_HUB.label, group: "Free SEO tools", priority: 0.9, changefreq: "monthly", lastModified: d },
    ...tools.map((t) => ({ path: t.href, label: t.name, group: "Free SEO tools" as const, priority: t.href === "/seo-audit" ? 0.9 : 0.8, changefreq: "monthly" as const, lastModified: d })),
    ...posts.map((p) => ({
      path: `/blog/${p.slug}`,
      label: p.title,
      group: "Blog posts" as const,
      priority: 0.7,
      changefreq: "monthly" as const,
      lastModified: postModified(p),
      images: p.coverImage ? [p.coverImage.startsWith("/") ? `${site.url}${p.coverImage}` : p.coverImage] : undefined,
      blog: { id: p.id, noindex: p.noindex, canonicalUrl: p.canonicalUrl },
    })),
    ...built.map((p) => ({
      path: pagePath(p.slug),
      label: p.title,
      group: "Custom pages" as const,
      priority: 0.8,
      changefreq: "monthly" as const,
      lastModified: new Date(p.updatedAt),
      images: p.ogImage ? [p.ogImage.startsWith("/") ? `${site.url}${p.ogImage}` : p.ogImage] : undefined,
      builder: { id: p.id, noindex: p.noindex },
    })),
  ];
}
