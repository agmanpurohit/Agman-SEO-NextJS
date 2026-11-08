import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/audit/admin-auth";
import { renderContent } from "@/lib/blog/markdown";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Renders the post body exactly as the public post page will (same sanitiser and structure), for the live preview. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const source = typeof body.contentMd === "string" ? body.contentMd.slice(0, 300_000) : "";
  return NextResponse.json(renderContent(source, body.contentFormat === "html" ? "html" : "markdown"));
}
