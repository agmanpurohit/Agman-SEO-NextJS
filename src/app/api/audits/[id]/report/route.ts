import { sql, ensureSchema } from "@/lib/audit/db";
import { getStatus } from "@/lib/audit/runner";
import { renderReport } from "@/lib/audit/report";
import { isAdmin } from "@/lib/audit/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ID = /^[A-Za-z0-9_-]{8,20}$/;

/**
 * PDF download. Requires the private token issued after the lead form, or an admin session.
 * The PDF is rebuilt from the stored findings, so it always matches the results page.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ID.test(id)) return new Response("Not found", { status: 404 });
  const token = new URL(req.url).searchParams.get("token") ?? "";
  await ensureSchema();

  let recipient = "Website owner";
  const admin = await isAdmin();
  if (!admin) {
    if (!/^[A-Za-z0-9_-]{20,40}$/.test(token)) return new Response("Not authorised", { status: 403 });
    const rows = (await sql()`SELECT name FROM leads WHERE audit_id = ${id} AND download_token = ${token} LIMIT 1`) as { name: string }[];
    if (!rows.length) return new Response("Not authorised", { status: 403 });
    recipient = rows[0].name;
  } else {
    const rows = (await sql()`SELECT name FROM leads WHERE audit_id = ${id} ORDER BY created_at LIMIT 1`) as { name: string }[];
    if (rows.length) recipient = rows[0].name;
  }

  const audit = await getStatus(id);
  if (!audit || audit.status !== "complete") return new Response("Report not available", { status: 404 });
  const pdf = await renderReport(audit, recipient);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="SEO-Audit-${audit.domain.replace(/[^a-z0-9.-]/gi, "")}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
