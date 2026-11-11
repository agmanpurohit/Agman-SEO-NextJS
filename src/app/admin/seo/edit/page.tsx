import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoShell } from "@/components/admin/seo/SeoShell";
import { SeoPageEditor } from "@/components/admin/seo/SeoPageEditor";
import { listSitePages } from "@/lib/site/registry";
import { getOverride } from "@/lib/site/db";
import { isAdmin } from "@/lib/audit/admin-auth";

export const metadata: Metadata = { title: "Edit page SEO" };
export const dynamic = "force-dynamic";

export default async function EditPageSeo({ searchParams }: { searchParams: Promise<{ path?: string }> }) {
  const { path = "" } = await searchParams;
  // Visitors only get the sign-in form (from SeoShell); nothing about pages is looked up.
  if (!(await isAdmin())) return <SeoShell section="pages" title="Edit page SEO">{null}</SeoShell>;
  const page = (await listSitePages()).find((p) => p.path === path && !p.blog);
  if (!page) notFound();
  const o = await getOverride(page.path);
  return (
    <SeoShell section="pages" title="Edit page SEO">
      <SeoPageEditor
        key={page.path}
        path={page.path}
        label={page.label}
        initial={
          o
            ? {
                title: o.title,
                description: o.description,
                canonical: o.canonical,
                robotsIndex: o.robotsIndex,
                robotsFollow: o.robotsFollow,
                ogTitle: o.ogTitle,
                ogDescription: o.ogDescription,
                ogImage: o.ogImage,
                customSchema: o.customSchema,
              }
            : null
        }
      />
    </SeoShell>
  );
}
