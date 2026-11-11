import "server-only";
import { listSitePages } from "@/lib/site/registry";
import type { SitePageOption } from "@/components/admin/pages/SectionForms";

/** Every public page, for the link pickers in the page builder. */
export async function sitePageOptions(): Promise<SitePageOption[]> {
  const pages = await listSitePages().catch(() => []);
  return pages.map((p) => ({ path: p.path, label: p.label, group: p.group }));
}
