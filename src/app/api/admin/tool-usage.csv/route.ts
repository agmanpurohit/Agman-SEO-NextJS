import { isAdmin } from "@/lib/audit/admin-auth";
import { listUsage, type UsageFilter } from "@/lib/tools/usage";
import { tools } from "@/content/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Quote every cell and neutralise spreadsheet formula injection (=, +, -, @).
const cell = (v: unknown) => {
  let s = v == null ? "" : typeof v === "string" ? v : JSON.stringify(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response("Not authorised", { status: 401 });
  const p = new URL(req.url).searchParams;
  const f: UsageFilter = { tool: p.get("tool") ?? "", q: p.get("q") ?? "", from: p.get("from") ?? "", to: p.get("to") ?? "", mine: p.get("mine") === "show" ? "show" : "hide" };
  const rows = await listUsage(f, 10_000);
  const name = (slug: string) => tools.find((t) => t.slug === slug)?.name ?? slug;
  const head = ["First used", "Last used", "Tool", "Summary", "IP address", "Country", "City", "Actions", "Events", "Your own visit", "User agent", "Referrer", "Data (JSON)"];
  const lines = rows.map((r) =>
    [new Date(r.created_at).toISOString(), new Date(r.updated_at).toISOString(), name(r.tool), r.summary, r.ip, r.country, r.city, r.actions.join(" "), r.events, r.is_admin ? "yes" : "no", r.user_agent, r.referrer, r.data].map(cell).join(","),
  );
  return new Response("﻿" + [head.map(cell).join(","), ...lines].join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="free-tool-usage-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
