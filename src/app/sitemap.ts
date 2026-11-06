import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { absUrl } from "@/lib/seo";

/**
 * Indexable pages only, on the canonical domain. URLs match each page's canonical exactly.
 * Admin, API and individual audit result pages are deliberately left out (they're noindex).
 */
const PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; images?: string[] }[] = [
  { path: "/", priority: 1, changeFrequency: "monthly", images: [`${site.url}${site.photo}`] },
  { path: "/work", priority: 0.9, changeFrequency: "monthly" },
  { path: "/seo-audit", priority: 0.9, changeFrequency: "monthly" },
  { path: "/experience", priority: 0.8, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.7, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PAGES.map((p) => ({
    url: absUrl(p.path),
    lastModified,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
    ...(p.images ? { images: p.images } : {}),
  }));
}
