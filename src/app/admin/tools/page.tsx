import type { Metadata } from "next";
import { isAdmin } from "@/lib/audit/admin-auth";
import { listUsage, usageStats, LOGGED_TOOLS, RETENTION_DAYS, type UsageFilter } from "@/lib/tools/usage";
import { AdminLogin } from "@/components/audit/AdminControls";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { DeleteUsageButton } from "@/components/admin/DeleteUsageButton";
import { tools } from "@/content/tools";

export const metadata: Metadata = { title: "Tool usage" };
export const dynamic = "force-dynamic";

const toolName = (slug: string) => tools.find((t) => t.slug === slug)?.name ?? slug;
const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dubai" });

const ACTION_LABEL: Record<string, string> = {
  use: "Used",
  copy: "Copied",
  download: "Downloaded",
  "copy-csv": "Copied CSV",
  "fetch-url": "Checked URL",
  crawl: "Crawled site",
  "paste-urls": "Pasted URLs",
};

/** Rough, readable device label from the user agent. */
function device(ua: string | null) {
  if (!ua) return "–";
  const type = /iPad|Tablet/i.test(ua) ? "Tablet" : /Mobi|Android|iPhone/i.test(ua) ? "Mobile" : "Desktop";
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : /bot|crawl|spider/i.test(ua) ? "Bot" : "Other";
  const os = /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) && !/iPhone|iPad/.test(ua) ? "macOS" : /Android/.test(ua) ? "Android" : /iPhone|iPad|iOS/.test(ua) ? "iOS" : /Linux/.test(ua) ? "Linux" : "";
  return [type, browser, os].filter(Boolean).join(" · ");
}

const flag = (cc: string | null) => (cc && /^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map((c) => 0x1f1a5 + c.charCodeAt(0))) : "");

export default async function ToolUsagePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!(await isAdmin())) {
    return (
      <section className="wrap flex min-h-[80svh] items-center pt-[var(--header-h)]">
        <AdminLogin />
      </section>
    );
  }
  const sp = await searchParams;
  const f: UsageFilter = { tool: sp.tool ?? "", q: sp.q ?? "", from: sp.from ?? "", to: sp.to ?? "", mine: sp.mine === "show" ? "show" : "hide" };
  const [rows, stats] = await Promise.all([listUsage(f), usageStats(f.mine !== "show")]);
  const qs = new URLSearchParams(Object.entries(f).filter(([k, v]) => v && !(k === "mine" && v === "hide")) as [string, string][]).toString();
  const input = "h-11 rounded border border-line-2 bg-ink-2 px-3 text-bone outline-none focus:border-bone";

  return (
    <section className="wrap pt-[calc(var(--header-h)+2.5rem)] pb-20">
      <AdminTabs active="tools" title="Free tool usage" />

      <dl className="mt-8 grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
        {[
          ["Tool sessions", stats.sessions],
          ["Last 7 days", stats.week],
          ["Unique IPs", stats.visitors],
          ["Total interactions", stats.events],
        ].map(([k, v]) => (
          <div key={k as string} className="bg-ink p-5">
            <dt className="t-label">{k}</dt>
            <dd className="mt-1 text-3xl font-light">{v}</dd>
          </div>
        ))}
      </dl>

      <ul className="mt-4 flex flex-wrap gap-2 text-sm">
        {LOGGED_TOOLS.map((t) => (
          <li key={t}>
            <a
              href={`/admin/tools?${new URLSearchParams({ ...(qs ? Object.fromEntries(new URLSearchParams(qs)) : {}), tool: f.tool === t ? "" : t }).toString()}`}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors ${f.tool === t ? "border-bone bg-bone text-ink" : "border-line-2 text-bone-dim hover:border-bone hover:text-bone"}`}
            >
              {toolName(t)} <span className={f.tool === t ? "text-ink/70" : "text-mute"}>{stats.byTool[t] ?? 0}</span>
            </a>
          </li>
        ))}
      </ul>

      <form className="mt-8 flex flex-wrap items-end gap-3" method="get">
        <label className="flex flex-col gap-1">
          <span className="t-label">Search</span>
          <input name="q" defaultValue={f.q} placeholder="IP, URL, keyword, title…" className={`${input} w-64`} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="t-label">Tool</span>
          <select name="tool" defaultValue={f.tool} className={input}>
            <option value="">All tools</option>
            {LOGGED_TOOLS.map((t) => (
              <option key={t} value={t}>
                {toolName(t)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="t-label">From</span>
          <input type="date" name="from" defaultValue={f.from} className={input} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="t-label">To</span>
          <input type="date" name="to" defaultValue={f.to} className={input} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="t-label">Your visits</span>
          <select name="mine" defaultValue={f.mine} className={input}>
            <option value="hide">Hide (while signed in)</option>
            <option value="show">Show</option>
          </select>
        </label>
        <button className="btn btn-primary !h-11">Filter</button>
        <a href={`/api/admin/tool-usage.csv${qs ? `?${qs}` : ""}`} className="btn btn-ghost !h-11">
          Export CSV
        </a>
      </form>

      <div className="mt-8 overflow-x-auto border border-line">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="bg-ink-2">
            <tr className="t-label">
              {["Last used", "Tool", "What they did", "IP address", "Location", "Device", ""].map((h) => (
                <th key={h} className="px-4 py-3 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-bone-dim">
                  No tool usage matches these filters yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line align-top">
                <td className="px-4 py-3 whitespace-nowrap text-bone-dim">
                  {when(r.updated_at)}
                  {r.updated_at !== r.created_at && <span className="block text-xs text-mute">first {when(r.created_at)}</span>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-bone">
                  {toolName(r.tool)}
                  {r.is_admin && <span className="ml-2 rounded-full border border-line-2 px-2 py-0.5 text-[0.65rem] text-mute">you</span>}
                </td>
                <td className="max-w-[26rem] px-4 py-3">
                  <p className="break-words text-bone">{r.summary || "–"}</p>
                  <p className="mt-1 flex flex-wrap gap-1.5">
                    {r.actions.map((a) => (
                      <span key={a} className={`rounded-full px-2 py-0.5 text-[0.68rem] ${a === "copy" || a === "download" || a === "crawl" || a === "fetch-url" ? "bg-ember/15 text-ember-soft" : "bg-line text-bone-dim"}`}>
                        {ACTION_LABEL[a] ?? a}
                      </span>
                    ))}
                    <span className="text-[0.68rem] text-mute">
                      {r.events} interaction{r.events === 1 ? "" : "s"}
                    </span>
                  </p>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-bone-dim hover:text-bone">Full details</summary>
                    <pre className="t-mono mt-2 max-h-80 overflow-auto rounded border border-line bg-ink p-3 text-[0.7rem] leading-5 whitespace-pre-wrap text-bone-dim">
                      {JSON.stringify(r.data, null, 2)}
                    </pre>
                    {r.referrer && <p className="mt-1 text-xs break-all text-mute">From page: {r.referrer}</p>}
                    {r.user_agent && <p className="mt-1 text-xs break-all text-mute">User agent: {r.user_agent}</p>}
                  </details>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="t-mono text-bone">{r.ip ?? "–"}</span>
                  {r.ip && r.ip !== "unknown" && (
                    <span className="mt-1 block text-xs">
                      <a href={`/admin/tools?q=${encodeURIComponent(r.ip)}`} className="link-u text-bone-dim">
                        All from this IP
                      </a>
                      {" · "}
                      <a href={`https://ipinfo.io/${encodeURIComponent(r.ip)}`} target="_blank" rel="noopener noreferrer" className="link-u text-bone-dim">
                        Lookup ↗
                      </a>
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-bone-dim">
                  {r.country ? (
                    <>
                      <span aria-hidden="true">{flag(r.country)} </span>
                      {[r.city, r.country].filter(Boolean).join(", ")}
                    </>
                  ) : (
                    "–"
                  )}
                </td>
                <td className="px-4 py-3 text-xs whitespace-nowrap text-bone-dim">{device(r.user_agent)}</td>
                <td className="px-4 py-3">
                  <DeleteUsageButton id={r.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="t-body mt-4 text-xs">
        Each row is one visitor session on one tool, updated as they keep working. Times are Dubai time. Showing up to 300 most recent; export includes all matches. Records are deleted automatically after{" "}
        {RETENTION_DAYS} days. Location comes from Vercel and is only available on the live site.
      </p>
    </section>
  );
}
