import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/audit/admin-auth";
import { setSetting, deleteSetting } from "@/lib/site/db";
import { validateSettings } from "@/lib/site/settings-shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Save site settings. Every page shows contact details, so the whole site is refreshed. */
export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const { value, errors } = validateSettings(body);
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 422 });
  await setSetting("site", value);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, settings: value });
}

/** Back to the values in the code (src/content/site.ts). */
export async function DELETE() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  await deleteSetting("site");
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
