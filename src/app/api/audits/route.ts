import { NextResponse } from "next/server";
import { createAudit, AuditInputError } from "@/lib/audit/runner";
import { clientIp } from "@/lib/audit/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Start a new audit. Body: { url: string } → { id } */
export async function POST(req: Request) {
  let body: { url?: unknown; company?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  // Honeypot field: bots fill it, people never see it.
  if (typeof body.company === "string" && body.company.trim()) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  if (typeof body.url !== "string") return NextResponse.json({ error: "Please enter a website URL." }, { status: 422 });
  try {
    const { id } = await createAudit(body.url, clientIp(req));
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    if (e instanceof AuditInputError) return NextResponse.json({ error: e.message }, { status: e.code === "rate_limited" ? 429 : 422 });
    console.error("create audit failed", e);
    return NextResponse.json({ error: "The audit service is unavailable right now. Please try again shortly." }, { status: 500 });
  }
}
