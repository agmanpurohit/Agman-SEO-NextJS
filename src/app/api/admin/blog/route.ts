import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/audit/admin-auth";
import { parsePostInput } from "@/lib/blog/validate";
import { persist, SlugTakenError } from "@/lib/blog/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Create a post. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { input, errors } = parsePostInput(body);
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 422 });
  try {
    const post = await persist(input);
    return NextResponse.json({ post }, { status: 201 });
  } catch (e) {
    if (e instanceof SlugTakenError) return NextResponse.json({ errors: { slug: "Another post already uses this URL." } }, { status: 409 });
    console.error("blog create failed", e);
    return NextResponse.json({ error: "Couldn’t save the post." }, { status: 500 });
  }
}
