import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/audit/admin-auth";
import { parsePageInput } from "@/lib/pages/validate";
import { persistPage, removePage, PageConflictError } from "@/lib/pages/service";
import { getPage } from "@/lib/pages/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idOf = async (params: Promise<{ id: string }>) => {
  const n = Number((await params).id);
  return Number.isInteger(n) && n > 0 ? n : null;
};

/** Update a page. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  const id = await idOf(params);
  if (!id || !(await getPage(id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { input, errors } = parsePageInput(body);
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 422 });
  try {
    return NextResponse.json({ page: await persistPage(input, id) });
  } catch (e) {
    if (e instanceof PageConflictError) return NextResponse.json({ errors: { slug: e.message } }, { status: 409 });
    console.error("page update failed", e);
    return NextResponse.json({ error: "Couldn’t save the page." }, { status: 500 });
  }
}

/** Delete a page. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  const id = await idOf(params);
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const page = await removePage(id);
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
