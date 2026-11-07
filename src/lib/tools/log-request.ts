import "server-only";
import { clientIp, hashIp, overLimit } from "@/lib/audit/ratelimit";
import { ensureSchema } from "@/lib/audit/db";
import { isAdmin } from "@/lib/audit/admin-auth";
import { recordUsage, LOGGED_TOOLS, type LoggedTool } from "./usage";

const MAX_DATA_CHARS = 60_000;
const SID = /^[A-Za-z0-9_-]{8,40}$/;

const header = (req: Request, name: string, max = 300) => {
  const v = req.headers.get(name);
  return v ? v.slice(0, max) : null;
};

/** Trims strings and caps the total size so one request can't store huge payloads. */
function capData(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const walk = (v: unknown, depth: number): unknown => {
    if (depth > 4) return undefined;
    if (typeof v === "string") return v.slice(0, 20_000);
    if (typeof v === "number" || typeof v === "boolean" || v === null) return v;
    if (Array.isArray(v)) return v.slice(0, 300).map((x) => walk(x, depth + 1));
    if (typeof v === "object") return Object.fromEntries(Object.entries(v as Record<string, unknown>).slice(0, 60).map(([k, x]) => [k.slice(0, 60), walk(x, depth + 1)]));
    return undefined;
  };
  const out = walk(data, 0) as Record<string, unknown>;
  const json = JSON.stringify(out);
  return json.length > MAX_DATA_CHARS ? { truncated: true, preview: json.slice(0, MAX_DATA_CHARS) } : out;
}

/**
 * Stores one tool-usage event with the visitor's IP and location (from Vercel's headers).
 * Never throws: logging must not break a tool for the visitor.
 */
export async function logToolUse(req: Request, input: { tool: string; sessionId: unknown; summary?: unknown; data?: unknown; action?: unknown }) {
  try {
    if (!LOGGED_TOOLS.includes(input.tool as LoggedTool)) return false;
    const sessionId = typeof input.sessionId === "string" && SID.test(input.sessionId) ? input.sessionId : `srv-${crypto.randomUUID().slice(0, 18)}`;
    const ip = clientIp(req);
    await ensureSchema(); // rate_limits table
    if (await overLimit(`tool-log:${hashIp(ip)}`, 400, 3600)) return false;
    const city = header(req, "x-vercel-ip-city", 120);
    await recordUsage({
      sessionId,
      tool: input.tool as LoggedTool,
      summary: typeof input.summary === "string" ? input.summary.replace(/\s+/g, " ").trim().slice(0, 300) : "",
      data: capData(input.data),
      action: typeof input.action === "string" && /^[a-z0-9-]{2,30}$/.test(input.action) ? input.action : undefined,
      ip,
      country: header(req, "x-vercel-ip-country", 8),
      city: city ? decodeURIComponent(city) : null,
      userAgent: header(req, "user-agent", 400),
      referrer: header(req, "referer", 500),
      isAdmin: await isAdmin().catch(() => false),
    });
    return true;
  } catch (e) {
    console.error("tool usage log failed", e);
    return false;
  }
}
