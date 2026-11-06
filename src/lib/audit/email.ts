import "server-only";
import { reportConfig } from "./config";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Sends one email through Resend's REST API. Returns "sent", "not_configured" or an error string. */
export async function sendEmail(o: { to: string; subject: string; html: string; text: string; replyTo?: string; attachment?: { filename: string; content: Buffer } }): Promise<string> {
  if (!reportConfig.resendKey || !o.to) return "not_configured";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${reportConfig.resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: reportConfig.from,
        to: [o.to],
        reply_to: o.replyTo,
        subject: o.subject,
        html: o.html,
        text: o.text,
        attachments: o.attachment ? [{ filename: o.attachment.filename, content: o.attachment.content.toString("base64") }] : undefined,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("Resend error", res.status, t.slice(0, 300));
      return `error ${res.status}`;
    }
    return "sent";
  } catch (e) {
    console.error("Resend request failed", e);
    return "error network";
  }
}

export function ownerLeadEmail(p: { name: string; email: string; consent: boolean; domain: string; url: string; score: number | null; issues: number; auditLink: string }) {
  const rows = [
    ["Name", p.name],
    ["Email", p.email],
    ["Website", p.url],
    ["SEO score", p.score == null ? "–" : `${p.score}/100`],
    ["Issues found", String(p.issues)],
    ["Marketing consent", p.consent ? "Yes" : "No"],
  ];
  return {
    subject: `[SEO Audit lead] ${p.name} — ${p.domain} (${p.score ?? "–"}/100)`,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1d1c1a">
      <h2 style="margin:0 0 12px">New SEO audit lead</h2>
      <table cellpadding="6" style="border-collapse:collapse">${rows.map(([k, v]) => `<tr><td style="color:#6e6a63">${esc(k)}</td><td><strong>${esc(v)}</strong></td></tr>`).join("")}</table>
      <p><a href="${esc(p.auditLink)}">Open the online results</a>. The full PDF report is attached.</p></div>`,
    text: `New SEO audit lead\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nResults: ${p.auditLink}`,
  };
}

export function visitorReportEmail(p: { name: string; domain: string; score: number | null; auditLink: string; ownerEmail: string }) {
  const first = p.name.split(/\s+/)[0];
  return {
    subject: `Your SEO audit report for ${p.domain}`,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#1d1c1a">
      <p>Hi ${esc(first)},</p>
      <p>Your SEO audit for <strong>${esc(p.domain)}</strong> is attached as a PDF. The site scored <strong>${p.score ?? "–"}/100</strong>.</p>
      <p>You can also view the interactive results here: <a href="${esc(p.auditLink)}">${esc(p.auditLink)}</a></p>
      <p>If you’d like help fixing any of the issues, just reply to this email.</p>
      <p>— Agman Rajpurohit<br/>SEO & Digital Marketing Specialist, Dubai</p></div>`,
    text: `Hi ${first},\n\nYour SEO audit for ${p.domain} is attached. Score: ${p.score ?? "–"}/100.\nView online: ${p.auditLink}\n\nReply to this email if you'd like help.\n— Agman Rajpurohit`,
  };
}
