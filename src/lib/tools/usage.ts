import "server-only";
import { sql } from "@/lib/audit/db";
import { tools, type ToolSlug } from "@/content/tools";

/**
 * Free-tool usage log. One row per visitor session per tool: repeated edits in the same
 * session update that row (latest inputs, action list, event count) instead of adding rows.
 * The visitor's IP address is stored here in full and is shown only in the admin panel.
 * Rows older than RETENTION_DAYS are deleted automatically.
 */
export const RETENTION_DAYS = 365;
export const LOGGED_TOOLS = tools.filter((t) => t.slug !== "seo-audit").map((t) => t.slug) as Exclude<ToolSlug, "seo-audit">[];
export type LoggedTool = (typeof LOGGED_TOOLS)[number];

let ready: Promise<void> | null = null;
export function ensureToolSchema() {
  if (!ready) {
    ready = (async () => {
      const q = sql();
      await q`CREATE TABLE IF NOT EXISTS tool_usage (
        id BIGSERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        tool TEXT NOT NULL,
        ip TEXT,
        country TEXT,
        city TEXT,
        user_agent TEXT,
        referrer TEXT,
        summary TEXT,
        data JSONB NOT NULL DEFAULT '{}'::jsonb,
        actions TEXT[] NOT NULL DEFAULT '{}',
        events INT NOT NULL DEFAULT 1,
        is_admin BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (session_id, tool)
      )`;
      await q`CREATE INDEX IF NOT EXISTS tool_usage_updated ON tool_usage (updated_at DESC)`;
      await q`CREATE INDEX IF NOT EXISTS tool_usage_tool ON tool_usage (tool, updated_at DESC)`;
      await q`CREATE INDEX IF NOT EXISTS tool_usage_ip ON tool_usage (ip)`;
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

export type UsageInput = {
  sessionId: string;
  tool: LoggedTool;
  summary: string;
  data: Record<string, unknown>;
  action?: string;
  ip: string;
  country?: string | null;
  city?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
  isAdmin: boolean;
};

export async function recordUsage(u: UsageInput) {
  await ensureToolSchema();
  const q = sql();
  const actions = u.action ? [u.action] : [];
  await q`INSERT INTO tool_usage (session_id, tool, ip, country, city, user_agent, referrer, summary, data, actions, is_admin)
    VALUES (${u.sessionId}, ${u.tool}, ${u.ip}, ${u.country ?? null}, ${u.city ?? null}, ${u.userAgent ?? null}, ${u.referrer ?? null}, ${u.summary}, ${JSON.stringify(u.data)}::jsonb, ${actions}, ${u.isAdmin})
    ON CONFLICT (session_id, tool) DO UPDATE SET
      ip = EXCLUDED.ip,
      country = COALESCE(EXCLUDED.country, tool_usage.country),
      city = COALESCE(EXCLUDED.city, tool_usage.city),
      summary = CASE WHEN EXCLUDED.summary <> '' THEN EXCLUDED.summary ELSE tool_usage.summary END,
      data = tool_usage.data || EXCLUDED.data,
      actions = ARRAY(SELECT DISTINCT a FROM unnest(tool_usage.actions || EXCLUDED.actions) AS a),
      events = tool_usage.events + 1,
      is_admin = tool_usage.is_admin OR EXCLUDED.is_admin,
      updated_at = now()`;
  if (Math.random() < 0.01) await q`DELETE FROM tool_usage WHERE updated_at < now() - make_interval(days => ${RETENTION_DAYS})`;
}

export type UsageRow = {
  id: number;
  tool: LoggedTool;
  ip: string | null;
  country: string | null;
  city: string | null;
  user_agent: string | null;
  referrer: string | null;
  summary: string | null;
  data: Record<string, unknown>;
  actions: string[];
  events: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type UsageFilter = { tool: string; q: string; from: string; to: string; mine: "hide" | "show" };

export async function listUsage(f: UsageFilter, limit = 300): Promise<UsageRow[]> {
  await ensureToolSchema();
  const tool = LOGGED_TOOLS.includes(f.tool as LoggedTool) ? f.tool : null;
  const q = f.q.trim() ? `%${f.q.trim().replace(/[%_\\]/g, (c) => `\\${c}`)}%` : null;
  const from = /^\d{4}-\d{2}-\d{2}$/.test(f.from) ? f.from : null;
  const to = /^\d{4}-\d{2}-\d{2}$/.test(f.to) ? f.to : null;
  const hideMine = f.mine !== "show";
  return (await sql()`SELECT id, tool, ip, country, city, user_agent, referrer, summary, data, actions, events, is_admin, created_at, updated_at
    FROM tool_usage
    WHERE (${tool}::text IS NULL OR tool = ${tool})
      AND (${q}::text IS NULL OR ip ILIKE ${q} OR summary ILIKE ${q} OR data::text ILIKE ${q})
      AND (${from}::date IS NULL OR updated_at >= ${from}::date)
      AND (${to}::date IS NULL OR updated_at < ${to}::date + 1)
      AND (NOT ${hideMine} OR is_admin = false)
    ORDER BY updated_at DESC
    LIMIT ${Math.min(limit, 10_000)}`) as UsageRow[];
}

export async function usageStats(hideMine: boolean) {
  await ensureToolSchema();
  const [totals] = (await sql()`SELECT
      count(*)::int AS sessions,
      COALESCE(sum(events), 0)::int AS events,
      count(DISTINCT ip)::int AS visitors,
      count(*) FILTER (WHERE updated_at > now() - interval '7 days')::int AS week
    FROM tool_usage WHERE (NOT ${hideMine} OR is_admin = false)`) as { sessions: number; events: number; visitors: number; week: number }[];
  const byTool = (await sql()`SELECT tool, count(*)::int AS n FROM tool_usage WHERE (NOT ${hideMine} OR is_admin = false) GROUP BY tool`) as { tool: string; n: number }[];
  return { ...totals, byTool: Object.fromEntries(byTool.map((r) => [r.tool, r.n])) as Record<string, number> };
}

export async function deleteUsage(id: number) {
  await ensureToolSchema();
  await sql()`DELETE FROM tool_usage WHERE id = ${id}`;
}
