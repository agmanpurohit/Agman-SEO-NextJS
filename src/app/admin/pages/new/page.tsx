import type { Metadata } from "next";
import { isAdmin } from "@/lib/audit/admin-auth";
import { AdminLogin } from "@/components/audit/AdminControls";
import { PageEditor } from "@/components/admin/pages/PageEditor";
import { TEMPLATES, type PageInput } from "@/lib/pages/types";
import { site } from "@/content/site";
import { sitePageOptions } from "../editor-data";

export const metadata: Metadata = { title: "New page" };
export const dynamic = "force-dynamic";

export default async function NewPage({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  if (!(await isAdmin())) {
    return (
      <section className="wrap flex min-h-[80svh] items-center pt-[var(--header-h)]">
        <AdminLogin />
      </section>
    );
  }
  const { template } = await searchParams;
  const t = TEMPLATES.find((x) => x.key === template) ?? TEMPLATES[0];
  const initial: PageInput = { title: "", slug: "", status: "draft", metaTitle: "", metaDescription: "", ogImage: "", noindex: false, customSchema: "", sections: t.sections() };
  return (
    <section className="wrap pt-[var(--header-h)]">
      <PageEditor initial={initial} siteUrl={site.url} pages={await sitePageOptions()} />
    </section>
  );
}
