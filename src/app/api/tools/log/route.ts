import { logToolUse } from "@/lib/tools/log-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Free tools report what a visitor did here (see src/lib/tools/track.ts). Always 204. */
export async function POST(req: Request) {
  try {
    const text = await req.text();
    if (text.length > 80_000) return new Response(null, { status: 204 });
    const b = JSON.parse(text) as Record<string, unknown>;
    await logToolUse(req, { tool: String(b.tool ?? ""), sessionId: b.sid, summary: b.summary, data: b.data, action: b.action });
  } catch {
    /* ignore malformed reports */
  }
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
