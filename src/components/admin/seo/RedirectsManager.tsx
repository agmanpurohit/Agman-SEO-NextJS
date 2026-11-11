"use client";

import { useMemo, useState, type FormEvent } from "react";
import { matchRedirect, REDIRECT_STATUSES, type RedirectRule } from "@/lib/site/redirect-match";

type R = { id: number; source: string; destination: string; status: number; enabled: boolean; note: string; hits: number; lastHit: string | null; createdAt: string };
const input = "h-10 w-full rounded border border-line-2 bg-ink-2 px-3 text-sm text-bone outline-none placeholder:text-mute focus:border-bone";
const STATUS_HINT: Record<number, string> = { 301: "Permanent (most common)", 302: "Temporary", 307: "Temporary, keeps method", 308: "Permanent, keeps method" };
const blank = { id: 0, source: "", destination: "", status: 301, note: "" };

export function RedirectsManager({ initial }: { initial: R[] }) {
  const [list, setList] = useState(initial);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [testUrl, setTestUrl] = useState("");

  async function send(body: Record<string, unknown>, method: "POST" | "DELETE" = "POST", id?: number) {
    setBusy(true);
    setError("");
    setNotice("");
    const res = await fetch(method === "DELETE" ? `/api/admin/seo/redirects?id=${id}` : "/api/admin/seo/redirects", {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "DELETE" ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't save the redirect.");
      return false;
    }
    setList(data.redirects);
    return true;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const editing = form.id > 0;
    const existing = list.find((r) => r.id === form.id);
    if (await send({ ...form, id: editing ? form.id : undefined, enabled: existing?.enabled ?? true })) {
      setNotice(editing ? "Redirect updated. Live within 30 seconds." : "Redirect added. Live within 30 seconds.");
      setForm(blank);
    }
  }

  const rules: RedirectRule[] = useMemo(() => list.filter((r) => r.enabled).map((r) => ({ id: r.id, source: r.source, destination: r.destination, status: r.status })), [list]);
  const tested = useMemo(() => {
    if (!testUrl.trim()) return null;
    const hops: string[] = [];
    let cur = testUrl.trim();
    for (let i = 0; i < 6; i++) {
      const m = matchRedirect(cur, rules);
      if (!m) break;
      hops.push(`${m.rule.status} → ${m.location}`);
      if (/^https?:\/\//i.test(m.location)) break;
      cur = m.location;
    }
    return hops;
  }, [testUrl, rules]);

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0">
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 border border-line p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_170px_auto] md:items-end">
          <label className="block">
            <span className="t-label mb-1 block">From (old URL)</span>
            <input className={input} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="/old-page or /old-folder/*" required />
          </label>
          <label className="block">
            <span className="t-label mb-1 block">To</span>
            <input className={input} value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="/new-page or https://…" required />
          </label>
          <label className="block">
            <span className="t-label mb-1 block">Type</span>
            <select className={input} value={form.status} onChange={(e) => setForm({ ...form, status: Number(e.target.value) })}>
              {REDIRECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s} · {STATUS_HINT[s]}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <button className="btn btn-primary !h-10 !px-5" disabled={busy}>
              {form.id ? "Update" : "Add"}
            </button>
            {form.id > 0 && (
              <button type="button" className="btn btn-ghost !h-10 !px-4" onClick={() => setForm(blank)}>
                Cancel
              </button>
            )}
          </div>
          <label className="block md:col-span-4">
            <span className="t-label mb-1 block">Note (optional)</span>
            <input className={input} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Why this redirect exists, e.g. page renamed in Nov 2026" />
          </label>
        </form>
        {error && (
          <p role="alert" className="mt-3 text-sm text-ember-soft">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="mt-3 text-sm text-[#4fd18b]">
            {notice}
          </p>
        )}

        <div className="mt-6 overflow-x-auto border border-line">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-ink-2">
              <tr className="t-label">
                {["On", "From", "To", "Type", "Used", ""].map((h) => (
                  <th key={h} className="px-4 py-2.5 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-bone-dim">
                    No redirects yet. Add one when you rename, move or delete a page.
                  </td>
                </tr>
              )}
              {list.map((r) => (
                <tr key={r.id} className={`border-t border-line align-top ${r.enabled ? "" : "opacity-50"}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" className="h-4 w-4 accent-[#ff5a1f]" checked={r.enabled} disabled={busy} onChange={(e) => send({ ...r, enabled: e.target.checked })} aria-label={`Redirect ${r.source} enabled`} />
                  </td>
                  <td className="t-mono max-w-[14rem] px-4 py-3 text-xs break-all text-bone">
                    {r.source}
                    {r.note && <span className="mt-1 block font-sans text-[0.7rem] text-mute">{r.note}</span>}
                  </td>
                  <td className="t-mono max-w-[14rem] px-4 py-3 text-xs break-all text-bone-dim">{r.destination}</td>
                  <td className="px-4 py-3 text-xs text-bone-dim">{r.status}</td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap text-bone-dim">
                    {r.hits.toLocaleString()} times
                    {r.lastHit && <span className="block text-mute">last {new Date(r.lastHit).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-xs whitespace-nowrap">
                    <button type="button" className="text-bone-dim hover:text-bone" onClick={() => setForm({ id: r.id, source: r.source, destination: r.destination, status: r.status, note: r.note })}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="ml-3 text-mute hover:text-ember"
                      disabled={busy}
                      onClick={() => window.confirm(`Delete the redirect from ${r.source}?`) && send({}, "DELETE", r.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="space-y-6">
        <div className="space-y-3 border border-line p-4">
          <p className="t-label">Test a URL</p>
          <input className={input} value={testUrl} onChange={(e) => setTestUrl(e.target.value)} placeholder="/old-page" aria-label="URL to test" />
          {tested && (tested.length ? <ol className="t-mono space-y-1 text-xs text-[#4fd18b]">{tested.map((h, i) => <li key={i}>{h}</li>)}</ol> : <p className="text-xs text-bone-dim">No redirect: the page loads normally.</p>)}
          {tested && tested.length > 1 && <p className="text-xs text-[#f0b64a]">This goes through {tested.length} redirects. Point the first one straight at the final page.</p>}
        </div>
        <div className="space-y-2 text-xs leading-relaxed text-mute">
          <p>
            <strong className="text-bone-dim">301</strong> for pages that moved for good: Google passes the old page&apos;s ranking signals to the new URL. Use 302 only for short, temporary moves.
          </p>
          <p>
            <strong className="text-bone-dim">Folders:</strong> <span className="t-mono">/old-blog/*</span> → <span className="t-mono">/blog/*</span> redirects every page inside, keeping the rest of the path.
          </p>
          <p>Loops and long chains are blocked when you save. Admin and API addresses can&apos;t be redirected.</p>
        </div>
      </aside>
    </div>
  );
}
