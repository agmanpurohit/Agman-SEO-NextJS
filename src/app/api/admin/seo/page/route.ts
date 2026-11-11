import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/audit/admin-auth";
import { listSitePages } from "@/lib/site/registry";
import { saveOverride, deleteOverride } from "@/lib/site/db";
import { parseOverride, isEmptyOverride } from "@/lib/site/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Only pages managed here (blog posts have their own SEO fields in the blog editor). */
async function editablePath(raw: unknown) {
  if (typeof raw !== "string") return null;
  const pages = await listSitePages();
  const p = pages.find((x) => x.path === raw && !x.blog);
  return p?.path ?? null;
}

function refresh(path: string) {
  revalidatePath(path);
  revalidatePath("/sitemap.xml");
}

/** Save (or clear) the SEO override for one page. */
export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const path = await editablePath(body.path);
  if (!path) return NextResponse.json({ error: "Unknown page." }, { status: 404 });
  const { value, errors } = parseOverride(path, body);
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 422 });
  if (isEmptyOverride(value)) await deleteOverride(path);
  else await saveOverride(value);
  refresh(path);
  return NextResponse.json({ ok: true, cleared: isEmptyOverride(value) });
}

/** Remove the override: the page goes back to its built-in SEO. */
export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const path = await editablePath(new URL(req.url).searchParams.get("path"));
  if (!path) return NextResponse.json({ error: "Unknown page." }, { status: 404 });
  await deleteOverride(path);
  refresh(path);
  return NextResponse.json({ ok: true });
}
