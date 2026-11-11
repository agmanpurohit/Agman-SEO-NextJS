import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/audit/admin-auth";
import { updateMediaInfo, deleteMediaItem, mediaUsageFor } from "@/lib/media/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ID = /^[a-z0-9-]{1,80}\.(jpg|png|webp|gif|avif)$/;

/** Update a file's alt text and display name (its URL never changes). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await params;
  if (!ID.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const b = (await req.json().catch(() => ({}))) as { alt?: unknown; title?: unknown };
  const ok = await updateMediaInfo(id, {
    alt: typeof b.alt === "string" ? b.alt.trim().slice(0, 250) : "",
    title: typeof b.title === "string" ? b.title.trim().slice(0, 120) : "",
  });
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

/** Delete a file. If it's still used somewhere, the caller must confirm with ?force=1. */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await params;
  if (!ID.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const usage = await mediaUsageFor(id);
  if (usage.length && new URL(req.url).searchParams.get("force") !== "1") return NextResponse.json({ inUse: true, usage }, { status: 409 });
  const ok = await deleteMediaItem(id);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}
