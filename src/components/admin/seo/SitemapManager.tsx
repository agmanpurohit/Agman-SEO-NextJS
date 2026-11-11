"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type Row = {
  path: string;
  label: string;
  group: string;
  include: boolean;
  reason?: string;
  priority: number;
  changefreq: string;
  lastModified: string;
  custom?: boolean;
  ruled: boolean;
  blogId?: number;
};

const FREQS = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"];
const PRIORITIES = [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
const sel = "rounded border border-line-2 bg-ink-2 px-2 py-1.5 text-xs text-bone outline-none focus:border-bone disabled:opacity-40";

export function SitemapManager({ rows: initial }: { rows: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [newPath, setNewPath] = useState("");

  async function save(r: Row, patch: Partial<Row>) {
    const next = { ...r, ...patch };
    setBusy(r.path);
    setError("");
    const res = await fetch("/api/admin/seo/sitemap", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: r.path, include: next.reason && next.reason !== "Excluded manually" ? true : next.include, priority: next.priority, changefreq: next.changefreq, custom: !!r.custom }),
    });
    setBusy(null);
    if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "Couldn't save.");
    setRows((rs) => rs.map((x) => (x.path === r.path ? { ...next, ruled: true, reason: next.include ? (x.reason === "Excluded manually" ? undefined : x.reason) : x.reason ?? "Excluded manually" } : x)));
    router.refresh();
  }

  async function reset(r: Row) {
    if (r.custom && !window.confirm(`Remove ${r.path} from the sitemap list?`)) return;
    setBusy(r.path);
    const res = await fetch(`/api/admin/seo/sitemap?path=${encodeURIComponent(r.path)}`, { method: "DELETE" });
    setBusy(null);
    if (!res.ok) return setError("Couldn't reset.");
    router.refresh();
    if (r.custom) setRows((rs) => rs.filter((x) => x.path !== r.path));
  }

  async function addCustom(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/seo/sitemap", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: newPath, include: true, custom: true, priority: 0.5, changefreq: "monthly" }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error ?? "Couldn't add the URL.");
    setRows((rs) => (rs.some((r) => r.path === data.path) ? rs : [...rs, { path: data.path, label: "Custom URL", group: "Custom URLs", include: true, priority: 0.5, changefreq: "monthly", lastModified: new Date().toISOString(), custom: true, ruled: true }]));
    setNewPath("");
    router.refresh();
  }

  const groups = [...new Set(rows.map((r) => r.group))];
  const included = rows.filter((r) => r.include).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="text-sm text-bone-dim">
          <strong className="text-bone">{included}</strong> URLs in the sitemap · {rows.length - included} left out ·{" "}
          <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="link-u text-bone">
            view sitemap.xml ↗
          </a>
        </p>
        <form onSubmit={addCustom} className="flex flex-wrap items-center gap-2">
          <label htmlFor="custom-url" className="sr-only">
            Add a URL
          </label>
          <input id="custom-url" value={newPath} onChange={(e) => setNewPath(e.target.value)} placeholder="/new-landing-page" className="h-10 w-56 rounded border border-line-2 bg-ink-2 px-3 text-sm text-bone outline-none focus:border-bone" />
          <button className="btn btn-ghost !h-10 !px-4" disabled={!newPath.trim()}>
            Add URL
          </button>
        </form>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-ember-soft">
          {error}
        </p>
      )}

      {groups.map((g) => (
        <section key={g} className="mt-8">
          <h2 className="t-label !text-bone">{g}</h2>
          <div className="mt-3 overflow-x-auto border border-line">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-ink-2">
                <tr className="t-label">
                  {["In sitemap", "Page", "Priority", "Change frequency", "Last modified", ""].map((h) => (
                    <th key={h} className="px-4 py-2.5 font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows
                  .filter((r) => r.group === g)
                  .map((r) => {
                    const auto = !!r.reason && r.reason !== "Excluded manually";
                    return (
                      <tr key={r.path} className={`border-t border-line align-middle ${busy === r.path ? "opacity-60" : ""}`}>
                        <td className="px-4 py-3">
                          <label className="inline-flex cursor-pointer items-center gap-2">
                            <input type="checkbox" checked={r.include} disabled={auto || busy === r.path} onChange={(e) => save(r, { include: e.target.checked })} className="h-4 w-4 accent-[#ff5a1f]" aria-label={`Include ${r.path} in the sitemap`} />
                            <span className={`text-xs ${r.include ? "text-[#4fd18b]" : "text-[#f0b64a]"}`}>{r.include ? "Included" : "Left out"}</span>
                          </label>
                          {r.reason && (
                            <p className="mt-1 max-w-[16rem] text-[0.7rem] text-mute">
                              {r.reason}
                              {auto && !r.blogId && (
                                <>
                                  {" · "}
                                  <Link href={`/admin/seo/edit?path=${encodeURIComponent(r.path)}`} className="link-u text-bone-dim">
                                    change
                                  </Link>
                                </>
                              )}
                              {auto && r.blogId && (
                                <>
                                  {" · "}
                                  <Link href={`/admin/blog/${r.blogId}`} className="link-u text-bone-dim">
                                    edit post
                                  </Link>
                                </>
                              )}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-bone">{r.label}</p>
                          <a href={r.path} target="_blank" rel="noopener noreferrer" className="t-mono text-xs text-mute hover:text-bone">
                            {r.path}
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <select className={sel} value={r.priority} disabled={busy === r.path} onChange={(e) => save(r, { priority: Number(e.target.value) })} aria-label={`Priority for ${r.path}`}>
                            {PRIORITIES.map((p) => (
                              <option key={p} value={p}>
                                {p.toFixed(1)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select className={sel} value={r.changefreq} disabled={busy === r.path} onChange={(e) => save(r, { changefreq: e.target.value })} aria-label={`Change frequency for ${r.path}`}>
                            {FREQS.map((f) => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap text-bone-dim">{new Date(r.lastModified).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                        <td className="px-4 py-3 text-right">
                          {r.ruled && (
                            <button type="button" onClick={() => reset(r)} className="text-xs text-mute hover:text-ember">
                              {r.custom ? "Remove" : "Reset"}
                            </button>
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
      <p className="mt-6 text-xs leading-relaxed text-mute">
        Google ignores priority and change frequency; Bing may use them. What matters is that only indexable, canonical pages are listed, which happens automatically. After big changes, resubmit
        sitemap.xml in Google Search Console.
      </p>
    </div>
  );
}
