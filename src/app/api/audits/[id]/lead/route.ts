import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { sql, ensureSchema } from "@/lib/audit/db";
import { getStatus } from "@/lib/audit/runner";
import { overLimit, clientIp, hashIp } from "@/lib/audit/ratelimit";
import { renderReport } from "@/lib/audit/report";
import { sendEmail, ownerLeadEmail, visitorReportEmail } from "@/lib/audit/email";
import { reportConfig } from "@/lib/audit/config";
import { site } from "@/content/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ID = /^[A-Za-z0-9_-]{8,20}$/;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;

/**
 * Lead capture — only for COMPLETED audits. Saves the lead, generates the PDF from stored
 * findings, emails it, and returns a private download token.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ID.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const str = (k: string, max: number) => (typeof b[k] === "string" ? (b[k] as string).trim().slice(0, max) : "");
  const name = str("name", 100);
  const email = str("email", 200).toLowerCase();
  const consent = b.consent === true;
  const startedAt = Number(b.startedAt) || 0;

  // Bots: honeypot filled or submitted impossibly fast. Answer generically, store nothing.
  if (str("company", 200) || (startedAt && Date.now() - startedAt < 1500)) return NextResponse.json({ error: "Please try again." }, { status: 400 });

  const errors: Record<string, string> = {};
  if (name.length < 2 || !/[\p{L}]/u.test(name)) errors.name = "Please enter your full name.";
  if (!EMAIL.test(email)) errors.email = "Please enter a valid email address.";
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 422 });

  await ensureSchema();
  const ip = clientIp(req);
  if (await overLimit(`lead:${hashIp(ip)}`, 8, 3600)) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });

  const audit = await getStatus(id);
  if (!audit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (audit.status !== "complete") return NextResponse.json({ error: "The audit hasn’t finished yet." }, { status: 409 });

  const q = sql();
  // One lead per audit+email; a repeat submission reuses the existing token and sends nothing twice.
  const rows = (await q`INSERT INTO leads (audit_id, name, email, marketing_consent, consent_at, download_token, ip_hash)
    VALUES (${id}, ${name}, ${email}, ${consent}, ${consent ? new Date().toISOString() : null}, ${randomBytes(18).toString("base64url")}, ${hashIp(ip)})
    ON CONFLICT (audit_id, email) DO UPDATE SET name = EXCLUDED.name
    RETURNING download_token, (xmax = 0) AS inserted`) as { download_token: string; inserted: boolean }[];
  const { download_token: token, inserted } = rows[0];

  const auditLink = `${site.url}/seo-audit/${id}`;
  let ownerStatus = "skipped (duplicate)";
  let visitorStatus = reportConfig.sendToVisitor ? "skipped (duplicate)" : "disabled until domain is verified";

  if (inserted) {
    let pdf: Buffer | null = null;
    try {
      pdf = await renderReport(audit, name);
    } catch (e) {
      console.error("PDF generation failed", e);
    }
    const attachment = pdf ? { filename: `SEO-Audit-${audit.domain}.pdf`, content: pdf } : undefined;

    const o = ownerLeadEmail({ name, email, consent, domain: audit.domain, url: audit.startUrl ?? audit.url, score: audit.scores?.overall ?? null, issues: audit.stats.issues ?? 0, auditLink });
    ownerStatus = await sendEmail({ to: reportConfig.ownerEmail, subject: o.subject, html: o.html, text: o.text, replyTo: email, attachment });

    if (reportConfig.sendToVisitor) {
      const v = visitorReportEmail({ name, domain: audit.domain, score: audit.scores?.overall ?? null, auditLink, ownerEmail: reportConfig.ownerEmail });
      visitorStatus = await sendEmail({ to: email, subject: v.subject, html: v.html, text: v.text, replyTo: reportConfig.ownerEmail, attachment });
    }

    await q`INSERT INTO reports (audit_id, generated_at, bytes, owner_email_status, visitor_email_status)
      VALUES (${id}, ${pdf ? new Date().toISOString() : null}, ${pdf?.length ?? null}, ${ownerStatus}, ${visitorStatus})
      ON CONFLICT (audit_id) DO UPDATE SET generated_at = EXCLUDED.generated_at, bytes = EXCLUDED.bytes,
        owner_email_status = EXCLUDED.owner_email_status, visitor_email_status = EXCLUDED.visitor_email_status, updated_at = now()`;
  }

  return NextResponse.json({ token, emailedToVisitor: visitorStatus === "sent" }, { status: inserted ? 201 : 200 });
}
