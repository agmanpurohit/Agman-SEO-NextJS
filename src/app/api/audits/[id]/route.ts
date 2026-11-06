import { NextResponse } from "next/server";
import { getStatus } from "@/lib/audit/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ID = /^[A-Za-z0-9_-]{8,20}$/;

/** Current status (and results once complete) for one audit. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ID.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const s = await getStatus(id);
  if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(s, { headers: { "Cache-Control": "no-store" } });
}
