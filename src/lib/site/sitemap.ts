import "server-only";
import { site } from "@/content/site";
import { absUrl } from "@/lib/seo";
import { listSitePages, DEPLOYED_AT, type ChangeFreq } from "./registry";
import { allOverrides, listSitemapRules } from "./db";

export type SitemapRow = {
  path: string;
  url: string;
  label: string;
  group: string;
  include: boolean;
  /** Why a page is left out (when include is false). */
  reason?: string;
  priority: number;
  changefreq: ChangeFreq;
  lastModified: Date;
  images?: string[];
  custom?: boolean;
  /** True when the sitemap manager has a saved rule for this path. */
  ruled: boolean;
  blogId?: number;
};

const isOwnUrl = (u: string, path: string) => !u || u === absUrl(path) || u === path;

/**
 * Every candidate sitemap URL with its final status. The sitemap.xml route outputs the
 * included rows; the dashboard shows all of them with the reason for any exclusion.
 */
export async function sitemapRows(): Promise<SitemapRow[]> {
  const [pages, rules, overrides] = await Promise.all([listSitePages(), listSitemapRules(), allOverrides()]);
  const ruleFor = new Map(rules.map((r) => [r.path, r]));

  const rows: SitemapRow[] = pages.map((p) => {
    const r = ruleFor.get(p.path);
    const o = overrides.get(p.path);
    let reason: string | undefined;
    if (p.blog?.noindex) reason = "Post is set to noindex";
    else if (p.builder?.noindex) reason = "Page is set to noindex in the page builder";
    else if (p.blog && !isOwnUrl(p.blog.canonicalUrl, p.path)) reason = "Post canonical points elsewhere";
    else if (o?.robotsIndex === false) reason = "Set to noindex in the SEO manager";
    else if (o?.canonical && !isOwnUrl(o.canonical, p.path)) reason = "Canonical points to another URL";
    else if (r && !r.include) reason = "Excluded manually";
    return {
      path: p.path,
      url: absUrl(p.path),
      label: p.label,
      group: p.group,
      include: !reason,
      reason,
      priority: r?.priority ?? p.priority,
      changefreq: (r?.changefreq as ChangeFreq) ?? p.changefreq,
      lastModified: p.lastModified,
      images: p.images,
      ruled: !!r,
      blogId: p.blog?.id,
    };
  });

  // URLs added by hand (pages outside the registry, e.g. a future landing page).
  const known = new Set(pages.map((p) => p.path));
  for (const r of rules.filter((x) => x.custom && !known.has(x.path))) {
    rows.push({
      path: r.path,
      url: absUrl(r.path),
      label: "Custom URL",
      group: "Custom URLs",
      include: r.include,
      reason: r.include ? undefined : "Excluded manually",
      priority: r.priority ?? 0.5,
      changefreq: (r.changefreq as ChangeFreq) ?? "monthly",
      lastModified: DEPLOYED_AT,
      custom: true,
      ruled: true,
    });
  }
  return rows;
}

export const sitemapSiteUrl = site.url;
