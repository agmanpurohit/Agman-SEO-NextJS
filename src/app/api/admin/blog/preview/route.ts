import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/audit/admin-auth";
import { renderMarkdown } from "@/lib/blog/markdown";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Renders markdown exactly as the public post page will (same sanitiser), for the live preview. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const md = typeof body.contentMd === "string" ? body.contentMd.slice(0, 200_000) : "";
  return NextResponse.json(renderMarkdown(md));
}
