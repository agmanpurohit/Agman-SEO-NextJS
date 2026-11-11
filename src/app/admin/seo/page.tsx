import type { Metadata } from "next";
import Link from "next/link";
import { SeoShell } from "@/components/admin/seo/SeoShell";
import { listSitePages } from "@/lib/site/registry";
import { allOverrides } from "@/lib/site/db";
import { sitemapRows } from "@/lib/site/sitemap";

export const metadata: Metadata = { title: "SEO manager" };
export const dynamic = "force-dynamic";

const chip = (text: string, tone: "ember" | "warn" | "mute" | "good" = "mute") => (
  <span
    key={text}
    className={`rounded-full px-2 py-0.5 text-[0.68rem] ${tone === "ember" ? "bg-ember/15 text-ember-soft" : tone === "warn" ? "bg-[#f0b64a]/15 text-[#f0b64a]" : tone === "good" ? "bg-[#4fd18b]/15 text-[#4fd18b]" : "bg-line text-bone-dim"}`}
  >
    {text}
  </span>
);

export default async function SeoPagesPage() {
  const [pages, overrides, rows] = await Promise.all([listSitePages(), allOverrides(), sitemapRows()]);
  const inSitemap = new Map(rows.map((r) => [r.path, r]));
  const groups = [...new Set(pages.map((p) => p.group))];
  const customised = pages.filter((p) => overrides.has(p.path)).length;

  return (
    <SeoShell
      section="pages"
      title="SEO manager"
      intro={
        <>
          Every public page, with the SEO settings you can change. Pages use their built-in title, description and schema until you override them here; clearing an override brings the
          built-in values back. Blog posts are edited in the{" "}
          <Link href="/admin/blog" className="link-u text-bone">
            blog editor
          </Link>
          .
        </>
      }
    >
      <dl className="grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
        {[
          ["Pages", pages.length],
          ["Customised", customised],
          ["In sitemap", rows.filter((r) => r.include).length],
          ["Left out of sitemap", rows.filter((r) => !r.include).length],
        ].map(([k, v]) => (
          <div key={k as string} className="bg-ink p-5">
            <dt className="t-label">{k}</dt>
            <dd className="mt-1 text-3xl font-light">{v}</dd>
          </div>
        ))}
      </dl>

      {groups.map((g) => (
        <section key={g} className="mt-10">
          <h2 className="t-label !text-bone">{g}</h2>
          <div className="mt-3 overflow-x-auto border border-line">
            <table className="w-full min-w-[760px] text-left text-sm">
              <tbody>
                {pages
                  .filter((p) => p.group === g)
                  .map((p) => {
                    const o = overrides.get(p.path);
                    const sm = inSitemap.get(p.path);
                    const chips = [
                      o?.title && chip("Custom title", "ember"),
                      o?.description && chip("Custom description", "ember"),
                      o?.canonical && chip("Custom canonical", "ember"),
                      (o?.ogTitle || o?.ogDescription || o?.ogImage) && chip("Custom social", "ember"),
                      o?.customSchema && chip("Custom schema", "ember"),
                      o?.robotsIndex === false && chip("noindex", "warn"),
                      o?.robotsFollow === false && chip("nofollow", "warn"),
                      (p.blog?.noindex || p.builder?.noindex) && chip("noindex", "warn"),
                      sm && !sm.include ? chip("Not in sitemap", "warn") : chip("In sitemap", "good"),
                    ].filter(Boolean);
                    return (
                      <tr key={p.path} className="border-t border-line first:border-t-0 align-top">
                        <td className="w-[38%] px-4 py-3">
                          <p className="text-bone">{p.label}</p>
                          <a href={p.path} target="_blank" rel="noopener noreferrer" className="t-mono text-xs text-mute hover:text-bone">
                            {p.path} ↗
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">{chips}</div>
                          {o?.updatedAt && <p className="mt-1.5 text-[0.7rem] text-mute">Edited {new Date(o.updatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dubai" })}</p>}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {p.blog ? (
                            <Link href={`/admin/blog/${p.blog.id}`} className="link-u text-bone">
                              Edit in blog editor
                            </Link>
                          ) : (
                            <>
                              {p.builder && (
                                <>
                                  <Link href={`/admin/pages/${p.builder.id}`} className="link-u text-bone">
                                    Edit page
                                  </Link>
                                  {" · "}
                                </>
                              )}
                              <Link href={`/admin/seo/edit?path=${encodeURIComponent(p.path)}`} className="link-u text-bone">
                                Edit SEO
                              </Link>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </SeoShell>
  );
}
