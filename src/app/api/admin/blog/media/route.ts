import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { isAdmin } from "@/lib/audit/admin-auth";
import { saveMedia } from "@/lib/blog/db";
import { ensureMediaSchema, imageSize, setMediaDetails, listMediaItems } from "@/lib/media/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX = 4 * 1024 * 1024; // stays under Vercel's 4.5 MB request limit

/** Identify the real file type from its first bytes (never trust the browser's MIME type). SVG is refused. */
function sniff(b: Buffer): { mime: string; ext: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: "image/png", ext: "png" };
  if (b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP") return { mime: "image/webp", ext: "webp" };
  if (b.subarray(0, 6).toString("ascii") === "GIF87a" || b.subarray(0, 6).toString("ascii") === "GIF89a") return { mime: "image/gif", ext: "gif" };
  if (b.subarray(4, 12).toString("ascii") === "ftypavif") return { mime: "image/avif", ext: "avif" };
  return null;
}

/** Upload an image (multipart field "file"). Returns its public URL. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "Images must be 4 MB or smaller. Compress it (e.g. to WebP) and try again." }, { status: 413 });
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type) return NextResponse.json({ error: "Only JPG, PNG, WebP, GIF or AVIF images are allowed." }, { status: 415 });
  const base = (file.name || "image").replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "image";
  const id = `${base}-${randomBytes(4).toString("hex")}.${type.ext}`;
  await saveMedia(id, file.name || id, type.mime, buf);
  // Library details: dimensions measured from the file, optional alt text and display name.
  await ensureMediaSchema();
  const { width, height } = await imageSize(buf);
  const alt = String(form?.get("alt") ?? "").trim().slice(0, 250);
  const title = String(form?.get("title") ?? "").trim().slice(0, 120) || (file.name || "").replace(/\.[^.]+$/, "").slice(0, 120);
  await setMediaDetails(id, { alt, title, width, height });
  return NextResponse.json({ url: `/api/blog/media/${id}`, id, size: buf.length, width, height, alt, title }, { status: 201 });
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  return NextResponse.json({ media: await listMediaItems() }, { headers: { "Cache-Control": "no-store" } });
}
