import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/audit/admin-auth";
import { parsePageInput } from "@/lib/pages/validate";
import { persistPage, PageConflictError } from "@/lib/pages/service";
import { getPage, pageSlugTaken } from "@/lib/pages/db";
import { newId } from "@/lib/pages/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Create a page, or copy one: { duplicateOf: id } makes a draft copy at a free URL. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  let source: unknown = body;
  const dup = Number((body as { duplicateOf?: unknown }).duplicateOf);
  if (dup) {
    const orig = await getPage(dup);
    if (!orig) return NextResponse.json({ error: "Not found" }, { status: 404 });
    let slug = `${orig.slug}-copy`.slice(0, 110);
    for (let i = 2; await pageSlugTaken(slug); i++) slug = `${orig.slug}-copy-${i}`.slice(0, 110);
    source = { ...orig, slug, title: `${orig.title} (copy)`, status: "draft", sections: orig.sections.map((s) => ({ ...s, id: newId() })) };
  }

  const { input, errors } = parsePageInput(source);
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 422 });
  try {
    const page = await persistPage(input);
    return NextResponse.json({ page }, { status: 201 });
  } catch (e) {
    if (e instanceof PageConflictError) return NextResponse.json({ errors: { slug: e.message } }, { status: 409 });
    console.error("page create failed", e);
    return NextResponse.json({ error: "Couldn’t save the page." }, { status: 500 });
  }
}
