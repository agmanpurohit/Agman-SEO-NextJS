import type { Metadata } from "next";
import { SeoShell } from "@/components/admin/seo/SeoShell";
import { SitemapManager } from "@/components/admin/seo/SitemapManager";
import { sitemapRows } from "@/lib/site/sitemap";
import { isAdmin } from "@/lib/audit/admin-auth";

export const metadata: Metadata = { title: "Sitemap" };
export const dynamic = "force-dynamic";

export default async function SitemapAdminPage() {
  if (!(await isAdmin())) return <SeoShell section="sitemap" title="Sitemap">{null}</SeoShell>;
  const rows = (await sitemapRows()).map((r) => ({
    path: r.path,
    label: r.label,
    group: r.group,
    include: r.include,
    reason: r.reason,
    priority: r.priority,
    changefreq: r.changefreq ?? "monthly",
    lastModified: r.lastModified.toISOString(),
    custom: r.custom,
    ruled: r.ruled,
    blogId: r.blogId,
  }));
  return (
    <SeoShell
      section="sitemap"
      title="Sitemap"
      intro="Every page that can appear in sitemap.xml. New pages and blog posts are added automatically; pages set to noindex or canonicalised elsewhere are left out automatically. Changes go live as soon as you make them."
    >
      <SitemapManager rows={rows} />
    </SeoShell>
  );
}
