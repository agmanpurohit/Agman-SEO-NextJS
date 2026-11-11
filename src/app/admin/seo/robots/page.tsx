import type { Metadata } from "next";
import { SeoShell } from "@/components/admin/seo/SeoShell";
import { RobotsEditor } from "@/components/admin/seo/RobotsEditor";
import { getSetting } from "@/lib/site/db";
import { defaultRobots } from "@/lib/site/robots-text";
import { isAdmin } from "@/lib/audit/admin-auth";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Robots.txt" };
export const dynamic = "force-dynamic";

export default async function RobotsPage() {
  if (!(await isAdmin())) return <SeoShell section="robots" title="Robots.txt">{null}</SeoShell>;
  const saved = await getSetting<{ text: string }>("robots");
  const def = defaultRobots(site.url);
  return (
    <SeoShell section="robots" title="Robots.txt" intro="Edit the robots.txt file search engines and AI crawlers read before crawling the site. Changes go live as soon as you save.">
      <RobotsEditor initial={saved?.text || def} defaultText={def} siteUrl={site.url} isCustom={!!saved?.text} />
    </SeoShell>
  );
}
