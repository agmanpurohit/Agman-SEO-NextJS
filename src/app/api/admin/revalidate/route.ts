import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/audit/admin-auth";
import { revalidateSite } from "@/lib/blog/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Dashboard "Clear cache": every page is rebuilt with fresh content on its next visit. */
export async function POST() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  revalidateSite();
  return NextResponse.json({ ok: true, at: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
