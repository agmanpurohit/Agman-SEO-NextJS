import { getMedia } from "@/lib/blog/db";

export const runtime = "nodejs";

/** Serves uploaded blog images. Files never change once uploaded, so they cache for a year. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9-]{1,80}\.(jpg|png|webp|gif|avif)$/.test(id)) return new Response("Not found", { status: 404 });
  const m = await getMedia(id);
  if (!m) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(m.data), {
    headers: {
      "Content-Type": m.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
