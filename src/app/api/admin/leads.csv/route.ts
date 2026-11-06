import { isAdmin } from "@/lib/audit/admin-auth";
import { listLeads, type LeadFilter } from "@/lib/audit/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Quote every cell and neutralise spreadsheet formula injection (=, +, -, @).
const cell = (v: unknown) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response("Not authorised", { status: 401 });
  const p = new URL(req.url).searchParams;
  const f: LeadFilter = { q: p.get("q") ?? "", consent: (p.get("consent") as LeadFilter["consent"]) ?? "", score: (p.get("score") as LeadFilter["score"]) ?? "", from: p.get("from") ?? "", to: p.get("to") ?? "" };
  const rows = await listLeads(f, 10_000);
  const head = ["Date", "Name", "Email", "Website", "Score", "Issues", "Critical", "Marketing consent", "Audit status", "Owner email", "Visitor email", "Audit ID"];
  const lines = rows.map((r) =>
    [new Date(r.created_at).toISOString(), r.name, r.email, r.url, r.score, r.issues, r.critical, r.marketing_consent ? "yes" : "no", r.audit_status, r.owner_email_status, r.visitor_email_status, r.audit_id].map(cell).join(","),
  );
  return new Response("﻿" + [head.map(cell).join(","), ...lines].join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="seo-audit-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
