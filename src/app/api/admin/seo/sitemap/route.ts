import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/audit/admin-auth";
import { saveSitemapRule, deleteSitemapRule } from "@/lib/site/db";
import { listSitePages } from "@/lib/site/registry";
import { PROTECTED, normalisePath } from "@/lib/site/redirect-match";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FREQS = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"];

/** Save a sitemap rule for a known page, or add a custom URL (custom: true). */
export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (typeof b.path !== "string") return NextResponse.json({ error: "Missing page." }, { status: 422 });
  const path = normalisePath(b.path);
  const known = (await listSitePages()).some((p) => p.path === path);
  const custom = b.custom === true && !known;
  if (!known && !custom) return NextResponse.json({ error: "Unknown page. Add it as a custom URL." }, { status: 404 });
  if (custom && (PROTECTED.test(path) || path.includes("*"))) return NextResponse.json({ error: "That path can't be added to the sitemap." }, { status: 422 });
  const priority = b.priority === null || b.priority === undefined || b.priority === "" ? null : Number(b.priority);
  if (priority !== null && (!Number.isFinite(priority) || priority < 0 || priority > 1)) return NextResponse.json({ error: "Priority must be between 0.0 and 1.0." }, { status: 422 });
  const changefreq = typeof b.changefreq === "string" && FREQS.includes(b.changefreq) ? b.changefreq : null;
  await saveSitemapRule({ path, include: b.include !== false, priority, changefreq, custom });
  revalidatePath("/sitemap.xml");
  return NextResponse.json({ ok: true, path });
}

/** Remove a rule (the page goes back to its default sitemap settings) or a custom URL. */
export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const path = new URL(req.url).searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Missing page." }, { status: 422 });
  await deleteSitemapRule(normalisePath(path));
  revalidatePath("/sitemap.xml");
  return NextResponse.json({ ok: true });
}
