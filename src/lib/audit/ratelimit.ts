import "server-only";
import { createHash } from "node:crypto";
import { sql } from "./db";

/** One-way hash so raw IP addresses are never stored. */
export function hashIp(ip: string) {
  return createHash("sha256").update(`${process.env.ADMIN_SESSION_SECRET ?? "salt"}:${ip}`).digest("hex").slice(0, 32);
}

/** Visitor IP. On Vercel these headers are set by the platform and can't be spoofed by the client. */
export function clientIp(req: Request) {
  return (
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/** Current count for a key in this window, without adding to it. */
export async function currentCount(key: string, windowSeconds: number): Promise<number> {
  const windowStart = new Date(Math.floor(Date.now() / (windowSeconds * 1000)) * windowSeconds * 1000).toISOString();
  const rows = (await sql()`SELECT count FROM rate_limits WHERE key = ${key} AND window_start = ${windowStart}`) as { count: number }[];
  return rows[0]?.count ?? 0;
}

/**
 * Fixed-window counter stored in Postgres (works across serverless instances).
 * Returns true when the limit is exceeded.
 */
export async function overLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const q = sql();
  const windowStart = new Date(Math.floor(Date.now() / (windowSeconds * 1000)) * windowSeconds * 1000).toISOString();
  const rows = (await q`
    INSERT INTO rate_limits (key, window_start, count) VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT (key, window_start) DO UPDATE SET count = rate_limits.count + 1
    RETURNING count`) as { count: number }[];
  // Opportunistic cleanup of old windows.
  if (Math.random() < 0.02) await q`DELETE FROM rate_limits WHERE window_start < now() - interval '2 days'`;
  return (rows[0]?.count ?? 0) > limit;
}
