import type { Metadata } from "next";
import { SeoShell } from "@/components/admin/seo/SeoShell";
import { RedirectsManager } from "@/components/admin/seo/RedirectsManager";
import { listRedirects } from "@/lib/site/db";
import { isAdmin } from "@/lib/audit/admin-auth";

export const metadata: Metadata = { title: "Redirects" };
export const dynamic = "force-dynamic";

export default async function RedirectsPage() {
  if (!(await isAdmin())) return <SeoShell section="redirects" title="Redirects">{null}</SeoShell>;
  return (
    <SeoShell section="redirects" title="Redirects" intro="Send visitors and search engines from an old URL to a new one. Changes go live within 30 seconds.">
      <RedirectsManager initial={await listRedirects()} />
    </SeoShell>
  );
}
