import type { Metadata } from "next";
import { isAdmin } from "@/lib/audit/admin-auth";
import { listLeads, leadTotals, type LeadFilter } from "@/lib/audit/leads";
import { AdminLogin, AdminLogout } from "@/components/audit/AdminControls";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const scoreTone = (s: number | null) => (s == null ? "text-mute" : s >= 80 ? "text-[#4fd18b]" : s >= 50 ? "text-[#f0b64a]" : "text-ember");

export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!(await isAdmin())) {
    return (
      <section className="wrap flex min-h-[80svh] items-center pt-[var(--header-h)]">
        <AdminLogin />
      </section>
    );
  }
  const sp = await searchParams;
  const f: LeadFilter = { q: sp.q ?? "", consent: (sp.consent as LeadFilter["consent"]) ?? "", score: (sp.score as LeadFilter["score"]) ?? "", from: sp.from ?? "", to: sp.to ?? "" };
  const [rows, totals] = await Promise.all([listLeads(f), leadTotals()]);
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <section className="wrap pt-[calc(var(--header-h)+2.5rem)] pb-20">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="t-label ember">Admin</p>
          <h1 className="t-h2 mt-2">SEO audit leads</h1>
        </div>
        <AdminLogout />
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
        {[
          ["Leads", totals.leads],
          ["Audits run", totals.audits],
          ["Audits completed", totals.completed],
          ["Marketing consent", totals.consented],
        ].map(([k, v]) => (
          <div key={k as string} className="bg-ink p-5">
            <dt className="t-label">{k}</dt>
            <dd className="mt-1 text-3xl font-light">{v}</dd>
          </div>
        ))}
      </dl>

      <form className="mt-8 flex flex-wrap items-end gap-3" method="get">
        <label className="flex flex-col gap-1">
          <span className="t-label">Search</span>
          <input name="q" defaultValue={f.q} placeholder="Name, email or website" className="h-11 w-64 rounded border border-line-2 bg-ink-2 px-3 text-bone outline-none focus:border-bone" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="t-label">Score</span>
          <select name="score" defaultValue={f.score} className="h-11 rounded border border-line-2 bg-ink-2 px-3 text-bone">
            <option value="">Any</option>
            <option value="low">0–49</option>
            <option value="mid">50–79</option>
            <option value="high">80–100</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="t-label">Consent</span>
          <select name="consent" defaultValue={f.consent} className="h-11 rounded border border-line-2 bg-ink-2 px-3 text-bone">
            <option value="">Any</option>
            <option value="yes">Opted in</option>
            <option value="no">Not opted in</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="t-label">From</span>
          <input type="date" name="from" defaultValue={f.from} className="h-11 rounded border border-line-2 bg-ink-2 px-3 text-bone" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="t-label">To</span>
          <input type="date" name="to" defaultValue={f.to} className="h-11 rounded border border-line-2 bg-ink-2 px-3 text-bone" />
        </label>
        <button className="btn btn-primary !h-11">Filter</button>
        <a href={`/api/admin/leads.csv${qs ? `?${qs}` : ""}`} className="btn btn-ghost !h-11">
          Export CSV
        </a>
      </form>

      <div className="mt-8 overflow-x-auto border border-line">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-ink-2">
            <tr className="t-label">
              {["Date", "Name", "Email", "Website", "Score", "Issues", "Consent", "Email status", ""].map((h) => (
                <th key={h} className="px-4 py-3 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-bone-dim">
                  No leads match these filters.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line align-top">
                <td className="px-4 py-3 whitespace-nowrap text-bone-dim">{new Date(r.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</td>
                <td className="px-4 py-3 text-bone">{r.name}</td>
                <td className="px-4 py-3">
                  <a href={`mailto:${r.email}`} className="link-u text-bone">
                    {r.email}
                  </a>
                </td>
                <td className="max-w-[16rem] px-4 py-3 break-all text-bone-dim">{r.url}</td>
                <td className={`px-4 py-3 text-lg font-semibold ${scoreTone(r.score)}`}>{r.score ?? "–"}</td>
                <td className="px-4 py-3 text-bone-dim">
                  {r.issues ?? "–"}
                  {r.critical ? <span className="ember"> · {r.critical} critical</span> : null}
                </td>
                <td className="px-4 py-3 text-bone-dim">{r.marketing_consent ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-xs text-bone-dim">
                  You: {r.owner_email_status ?? "–"}
                  <br />
                  Visitor: {r.visitor_email_status ?? "–"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <a href={`/seo-audit/${r.audit_id}`} target="_blank" rel="noopener noreferrer" className="link-u text-bone">
                    Results ↗
                  </a>
                  <br />
                  <a href={`/api/audits/${r.audit_id}/report`} className="link-u text-bone">
                    PDF ↓
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="t-body mt-4 text-xs">Audit status for each lead: {rows.filter((r) => r.audit_status !== "complete").length} not complete. Showing up to 500 most recent; export includes all matches.</p>
    </section>
  );
}
