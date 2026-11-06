import { NextResponse } from "next/server";
import { step } from "@/lib/audit/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// PageSpeed Insights calls can take 60–90s on heavy pages.
export const maxDuration = 120;

const ID = /^[A-Za-z0-9_-]{8,20}$/;

/** Advance the audit by one unit of real work and return its stored status. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ID.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const s = await step(id);
  if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(s, { headers: { "Cache-Control": "no-store" } });
}
