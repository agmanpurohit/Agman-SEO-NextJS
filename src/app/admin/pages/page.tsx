import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin } from "@/lib/audit/admin-auth";
import { listPages } from "@/lib/pages/db";
import { TEMPLATES, pagePath } from "@/lib/pages/types";
import { AdminLogin } from "@/components/audit/AdminControls";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { PageRowActions } from "@/components/admin/pages/PageRowActions";

export const metadata: Metadata = { title: "Pages" };
export const dynamic = "force-dynamic";

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dubai" }) : "–");

export default async function PagesAdmin() {
  if (!(await isAdmin())) {
    return (
      <section className="wrap flex min-h-[80svh] items-center pt-[var(--header-h)]">
        <AdminLogin />
      </section>
    );
  }
  const pages = await listPages();
  const live = pages.filter((p) => p.status === "published").length;

  return (
    <section className="wrap pt-[calc(var(--header-h)+2.5rem)] pb-20">
      <AdminTabs active="pages" title="Pages" />
      <p className="t-body mt-4 max-w-[52rem] text-sm">
        Build new pages from sections: landing pages, service pages for new countries, about pages. They use the site&apos;s own design, go into the sitemap when published, and can be fine-tuned in{" "}
        <Link href="/admin/seo" className="link-u text-bone">
          SEO
        </Link>
        . The coded pages (home, work, India services…) stay as they are.
      </p>

      <h2 className="t-label mt-10 !text-bone">New page</h2>
      <ul className="mt-3 grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-3">
        {TEMPLATES.map((t) => (
          <li key={t.key} className="bg-ink">
            <Link href={`/admin/pages/new?template=${t.key}`} className="group flex h-full flex-col p-5 transition-colors hover:bg-ink-2">
              <span className="font-medium text-bone">{t.label}</span>
              <span className="mt-1 text-xs text-mute">{t.hint}</span>
              <span className="t-label mt-auto pt-4 !text-bone transition-transform group-hover:translate-x-1">Start →</span>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="t-label mt-10 !text-bone">
        Your pages{" "}
        <span className="text-mute">
          · {live} live · {pages.length - live} drafts
        </span>
      </h2>
      {pages.length === 0 ? (
        <div className="mt-3 border border-dashed border-line-2 p-10 text-center">
          <p className="t-h3">No pages yet</p>
          <p className="t-body mt-2">Pick a starting point above. Pages stay drafts until you publish them.</p>
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto border border-line">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-ink-2">
              <tr className="t-label">
                {["Page", "Status", "Sections", "Updated", ""].map((h) => (
                  <th key={h} className="px-4 py-3 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => {
                const isLive = p.status === "published";
                return (
                  <tr key={p.id} className="border-t border-line align-top">
                    <td className="px-4 py-3">
                      <Link href={`/admin/pages/${p.id}`} className="link-u font-medium text-bone">
                        {p.title}
                      </Link>
                      <span className="t-mono mt-0.5 block text-xs text-mute">{pagePath(p.slug)}</span>
                      {p.noindex && <span className="t-label mt-1 block !text-[0.6rem] !text-ember-soft">noindex</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs ${isLive ? "border-[#4fd18b]/50 text-[#4fd18b]" : "border-line-2 text-bone-dim"}`}>{isLive ? "Live" : "Draft"}</span>
                    </td>
                    <td className="px-4 py-3 text-bone-dim">{p.sections.filter((s) => !s.hidden).length}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-bone-dim">{fmt(p.updatedAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link href={`/admin/pages/${p.id}`} className="link-u text-bone">
                        Edit
                      </Link>
                      {isLive && (
                        <>
                          {" · "}
                          <a href={pagePath(p.slug)} target="_blank" rel="noopener noreferrer" className="link-u text-bone">
                            View ↗
                          </a>
                        </>
                      )}
                      {" · "}
                      <PageRowActions id={p.id} title={p.title} live={isLive} path={pagePath(p.slug)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
