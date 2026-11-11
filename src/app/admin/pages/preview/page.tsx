import type { Metadata } from "next";
import { isAdmin } from "@/lib/audit/admin-auth";
import { getSetting } from "@/lib/site/db";
import { AdminLogin } from "@/components/audit/AdminControls";
import { BuilderPageView } from "@/components/pages/BuilderPageView";
import { PreviewRefresh } from "@/components/admin/pages/PreviewRefresh";
import { pagePath, type PageInput } from "@/lib/pages/types";

export const metadata: Metadata = { title: "Page preview" };
export const dynamic = "force-dynamic";

/** The page as it's being edited (unsaved changes included), rendered exactly like the live page. */
export default async function PagePreview() {
  if (!(await isAdmin())) {
    return (
      <section className="wrap flex min-h-[80svh] items-center pt-[var(--header-h)]">
        <AdminLogin />
      </section>
    );
  }
  const page = await getSetting<PageInput>("page-preview");
  if (!page) {
    return (
      <section className="wrap pt-[calc(var(--header-h)+4rem)] pb-20">
        <p className="t-h3">Nothing to preview yet</p>
        <p className="t-body mt-2">Open a page in Admin → Pages and press Preview.</p>
      </section>
    );
  }
  return (
    <>
      <PreviewRefresh />
      <BuilderPageView page={page} path={pagePath(page.slug || "preview")} description={page.metaDescription || page.title} />
    </>
  );
}
