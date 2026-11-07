import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/audit/admin-auth";
import { parsePostInput } from "@/lib/blog/validate";
import { persist, remove, SlugTakenError } from "@/lib/blog/service";
import { getPostById } from "@/lib/blog/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idOf = async (params: Promise<{ id: string }>) => {
  const n = Number((await params).id);
  return Number.isInteger(n) && n > 0 ? n : null;
};

/** Update a post. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  const id = await idOf(params);
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const existing = await getPostById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { input, errors } = parsePostInput(body);
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 422 });
  try {
    const post = await persist(input, id, existing.slug);
    return NextResponse.json({ post });
  } catch (e) {
    if (e instanceof SlugTakenError) return NextResponse.json({ errors: { slug: "Another post already uses this URL." } }, { status: 409 });
    console.error("blog update failed", e);
    return NextResponse.json({ error: "Couldn’t save the post." }, { status: 500 });
  }
}

/** Delete a post (and its old-slug redirects). */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  const id = await idOf(params);
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const slug = await remove(id);
  if (!slug) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
