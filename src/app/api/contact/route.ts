import { NextResponse } from "next/server";

/**
 * Contact form endpoint. Validates input, filters bots (honeypot + minimum fill time),
 * rate-limits per IP, then delivers the message by email through Resend.
 *
 * Required environment variables (see .env.example):
 *   RESEND_API_KEY      — API key from https://resend.com
 *   CONTACT_TO_EMAIL    — where enquiries are delivered
 *   CONTACT_FROM_EMAIL  — a sender on a domain verified in Resend
 *                         (until a domain is verified, "onboarding@resend.dev" works
 *                          for delivery to the Resend account's own email address)
 *
 * If they are missing, the endpoint answers 503 and the form tells the visitor to email
 * directly — it never pretends a message was sent.
 */

export const runtime = "nodejs";

const INQUIRY_TYPES = ["Job opportunity", "Freelance project", "Digital marketing services", "Website development", "Collaboration", "Other"] as const;

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const str = (k: string, max: number) => (typeof body[k] === "string" ? (body[k] as string).trim().slice(0, max) : "");
  const name = str("name", 120);
  const email = str("email", 200);
  const subject = str("subject", 160);
  const inquiry = str("inquiry", 60);
  const message = str("message", 5000);
  const company = str("company", 200); // honeypot
  const startedAt = Number(body.startedAt) || 0;

  // Bots: silently accept so they learn nothing, but send nothing.
  if (company || (startedAt && Date.now() - startedAt < 2500)) {
    return NextResponse.json({ ok: true });
  }

  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Please enter your name.";
  if (!EMAIL_RE.test(email)) errors.email = "Please enter a valid email address.";
  if (subject.length < 3) errors.subject = "Please add a short subject.";
  if (!INQUIRY_TYPES.includes(inquiry as (typeof INQUIRY_TYPES)[number])) errors.inquiry = "Please choose an enquiry type.";
  if (message.length < 20) errors.message = "Please write at least a couple of sentences (20+ characters).";
  if (Object.keys(errors).length) return NextResponse.json({ ok: false, errors }, { status: 422 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "Too many messages in a short time. Please try again later or email directly." }, { status: 429 });
  }

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL || "Portfolio <onboarding@resend.dev>";
  if (!key || !to) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const html = `
    <h2 style="font-family:sans-serif">New enquiry: ${escape(subject)}</h2>
    <p style="font-family:sans-serif"><strong>Type:</strong> ${escape(inquiry)}<br/>
    <strong>Name:</strong> ${escape(name)}<br/>
    <strong>Email:</strong> ${escape(email)}</p>
    <p style="font-family:sans-serif;white-space:pre-wrap">${escape(message)}</p>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `[Portfolio] ${inquiry}: ${subject}`,
        html,
        text: `${inquiry}\n${name} <${email}>\n\n${message}`,
      }),
    });
    if (!res.ok) {
      console.error("Resend error", res.status, await res.text());
      return NextResponse.json({ ok: false, error: "send_failed" }, { status: 502 });
    }
  } catch (err) {
    console.error("Resend request failed", err);
    return NextResponse.json({ ok: false, error: "send_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
