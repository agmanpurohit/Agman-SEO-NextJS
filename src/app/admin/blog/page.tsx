import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin } from "@/lib/audit/admin-auth";
import { listAllPosts } from "@/lib/blog/db";
import { isScheduled } from "@/lib/blog/types";
import { AdminLogin } from "@/components/audit/AdminControls";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { DeletePostButton } from "@/components/admin/DeletePostButton";

export const metadata: Metadata = { title: "Blog dashboard" };
export const dynamic = "force-dynamic";

const scoreTone = (s: number) => (s >= 80 ? "text-[#4fd18b]" : s >= 50 ? "text-[#f0b64a]" : "text-ember");
const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "–");

export default async function BlogAdminPage() {
  if (!(await isAdmin())) {
    return (
      <section className="wrap flex min-h-[80svh] items-center pt-[var(--header-h)]">
        <AdminLogin />
      </section>
    );
  }
  const posts = await listAllPosts();
  const live = posts.filter((p) => p.status === "published" && !isScheduled(p)).length;
  const scheduled = posts.filter(isScheduled).length;
  const drafts = posts.filter((p) => p.status === "draft").length;
  const avg = posts.length ? Math.round(posts.reduce((n, p) => n + p.seoScore, 0) / posts.length) : 0;

  return (
    <section className="wrap pt-[calc(var(--header-h)+2.5rem)] pb-20">
      <AdminTabs
        active="blog"
        title="Blog posts"
        actions={
          <Link href="/admin/blog/new" className="btn btn-primary !h-11">
            New post
          </Link>
        }
      />

      <dl className="mt-8 grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
        {[
          ["Published", live],
          ["Scheduled", scheduled],
          ["Drafts", drafts],
          ["Average SEO score", posts.length ? avg : "–"],
        ].map(([k, v]) => (
          <div key={k as string} className="bg-ink p-5">
            <dt className="t-label">{k}</dt>
            <dd className="mt-1 text-3xl font-light">{v}</dd>
          </div>
        ))}
      </dl>

      {posts.length === 0 ? (
        <div className="mt-10 border border-dashed border-line-2 p-10 text-center">
          <p className="t-h3">No posts yet</p>
          <p className="t-body mt-2">Write your first article. It stays a draft until you publish it.</p>
          <Link href="/admin/blog/new" className="btn btn-primary mt-6 inline-flex">
            Write a post
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto border border-line">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-ink-2">
              <tr className="t-label">
                {["Title", "Status", "Category", "SEO", "Published", "Updated", ""].map((h) => (
                  <th key={h} className="px-4 py-3 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => {
                const sched = isScheduled(p);
                const label = p.status === "draft" ? "Draft" : sched ? "Scheduled" : "Published";
                const tone = p.status === "draft" ? "border-line-2 text-bone-dim" : sched ? "border-[#f0b64a]/50 text-[#f0b64a]" : "border-[#4fd18b]/50 text-[#4fd18b]";
                return (
                  <tr key={p.id} className="border-t border-line align-top">
                    <td className="px-4 py-3">
                      <Link href={`/admin/blog/${p.id}`} className="link-u font-medium text-bone">
                        {p.title}
                      </Link>
                      <span className="t-mono mt-0.5 block text-xs text-mute">/blog/{p.slug}</span>
                      {p.featured && <span className="t-label ember mt-1 block !text-[0.6rem]">Featured</span>}
                      {p.noindex && <span className="t-label mt-1 block !text-[0.6rem] !text-ember-soft">noindex</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs ${tone}`}>{label}</span>
                    </td>
                    <td className="px-4 py-3 text-bone-dim">{p.category || "–"}</td>
                    <td className={`px-4 py-3 text-lg font-semibold ${scoreTone(p.seoScore)}`}>{p.seoScore}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-bone-dim">{fmt(p.publishedAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-bone-dim">{fmt(p.updatedAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link href={`/admin/blog/${p.id}`} className="link-u text-bone">
                        Edit
                      </Link>
                      {p.status === "published" && !sched && (
                        <>
                          {" · "}
                          <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer" className="link-u text-bone">
                            View ↗
                          </a>
                        </>
                      )}
                      {" · "}
                      <DeletePostButton id={p.id} title={p.title} />
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
