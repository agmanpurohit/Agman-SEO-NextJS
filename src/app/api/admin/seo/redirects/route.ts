import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/audit/admin-auth";
import { listRedirects, saveRedirect, deleteRedirect, redirectSourceTaken } from "@/lib/site/db";
import { normalisePath, validateRedirect, REDIRECT_STATUSES } from "@/lib/site/redirect-match";
import { site } from "@/content/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function parse(b: Record<string, unknown>, id?: number) {
  const rawSource = typeof b.source === "string" ? b.source.trim().slice(0, 500) : "";
  const wildcard = rawSource.endsWith("/*") || rawSource.endsWith("*");
  const source = wildcard ? `${normalisePath(rawSource.replace(/\/?\*$/, ""))}/*` : normalisePath(rawSource);
  let destination = typeof b.destination === "string" ? b.destination.trim().slice(0, 1000) : "";
  if (destination && !/^https?:\/\//i.test(destination)) destination = normalisePath(destination).replace(/\/\*$/, "/*");
  const status = REDIRECT_STATUSES.includes(Number(b.status) as (typeof REDIRECT_STATUSES)[number]) ? Number(b.status) : 301;
  const others = (await listRedirects()).filter((r) => r.enabled && r.id !== id);
  const error = validateRedirect(source, destination, new URL(site.url).host, others) ?? ((await redirectSourceTaken(source, id)) ? "A redirect for this source already exists." : null);
  return { value: { id, source, destination, status, enabled: b.enabled !== false, note: typeof b.note === "string" ? b.note.trim().slice(0, 200) : "" }, error };
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  return NextResponse.json({ redirects: await listRedirects() }, { headers: { "Cache-Control": "no-store" } });
}

/** Create (no id) or update (with id) a redirect. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = Number.isSafeInteger(Number(b.id)) && Number(b.id) > 0 ? Number(b.id) : undefined;
  const { value, error } = await parse(b, id);
  if (error) return NextResponse.json({ error }, { status: 422 });
  await saveRedirect(value);
  return NextResponse.json({ ok: true, redirects: await listRedirects() });
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await deleteRedirect(id);
  return NextResponse.json({ ok: true, redirects: await listRedirects() });
}
