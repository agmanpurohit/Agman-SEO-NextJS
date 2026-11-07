import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/audit/admin-auth";
import { deleteUsage } from "@/lib/tools/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Delete one tool-usage record (e.g. when a visitor asks for their data to be removed). */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await deleteUsage(id);
  return NextResponse.json({ ok: true });
}
