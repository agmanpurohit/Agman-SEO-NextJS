import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/audit/admin-auth";
import { getPage } from "@/lib/pages/db";
import { AdminLogin } from "@/components/audit/AdminControls";
import { PageEditor } from "@/components/admin/pages/PageEditor";
import { site } from "@/content/site";
import type { PageInput } from "@/lib/pages/types";
import { sitePageOptions } from "../editor-data";

export const metadata: Metadata = { title: "Edit page" };
export const dynamic = "force-dynamic";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return (
      <section className="wrap flex min-h-[80svh] items-center pt-[var(--header-h)]">
        <AdminLogin />
      </section>
    );
  }
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const page = await getPage(id);
  if (!page) notFound();
  const initial: PageInput = {
    title: page.title,
    slug: page.slug,
    status: page.status,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    ogImage: page.ogImage,
    noindex: page.noindex,
    customSchema: page.customSchema,
    sections: page.sections,
  };
  return (
    <section className="wrap pt-[var(--header-h)]">
      <PageEditor key={page.id} id={page.id} initial={initial} publishedAt={page.publishedAt} siteUrl={site.url} pages={await sitePageOptions()} />
    </section>
  );
}
