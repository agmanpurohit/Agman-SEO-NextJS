import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/audit/admin-auth";
import { parsePageInput } from "@/lib/pages/validate";
import { cleanHtml } from "@/lib/blog/markdown";
import { setSetting } from "@/lib/site/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Stores the editor's unsaved page so /admin/pages/preview can show it. Nothing goes live. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { input } = parsePageInput({ ...body, status: "draft" });
  const clean = { ...input, sections: input.sections.map((s) => ("html" in s ? { ...s, html: cleanHtml(s.html) } : s)) };
  await setSetting("page-preview", clean);
  return NextResponse.json({ ok: true });
}
