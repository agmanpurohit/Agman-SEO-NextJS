import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/audit/admin-auth";
import { setSetting, deleteSetting } from "@/lib/site/db";
import { checkRobots, ROBOTS_MAX } from "@/lib/site/robots-text";
import { site } from "@/content/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Save robots.txt. Blocking errors (e.g. Disallow: / for everyone) need confirm: true. */
export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { text?: unknown; confirm?: unknown };
  const text = typeof body.text === "string" ? body.text.replace(/\r\n/g, "\n") : "";
  if (!text.trim()) return NextResponse.json({ error: "robots.txt can't be empty. Use “Reset to default” instead." }, { status: 422 });
  if (text.length > ROBOTS_MAX) return NextResponse.json({ error: "robots.txt is too long." }, { status: 422 });
  const errors = checkRobots(text, site.url).filter((i) => i.level === "error");
  if (errors.length && body.confirm !== true) return NextResponse.json({ needsConfirm: true, issues: errors }, { status: 409 });
  await setSetting("robots", { text });
  revalidatePath("/robots.txt");
  return NextResponse.json({ ok: true });
}

/** Back to the built-in robots.txt. */
export async function DELETE() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  await deleteSetting("robots");
  revalidatePath("/robots.txt");
  return NextResponse.json({ ok: true });
}
