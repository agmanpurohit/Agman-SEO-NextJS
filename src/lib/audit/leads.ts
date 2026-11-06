import "server-only";
import { sql, ensureSchema } from "./db";

export type LeadRow = {
  id: number;
  audit_id: string;
  name: string;
  email: string;
  marketing_consent: boolean;
  created_at: string;
  url: string;
  domain: string;
  audit_status: string;
  score: number | null;
  issues: number | null;
  critical: number | null;
  owner_email_status: string | null;
  visitor_email_status: string | null;
};

export type LeadFilter = { q?: string; consent?: "yes" | "no" | ""; score?: "low" | "mid" | "high" | ""; from?: string; to?: string };

/** Leads joined with their audit. All filters are parameterised. */
export async function listLeads(f: LeadFilter, limit = 500): Promise<LeadRow[]> {
  await ensureSchema();
  const like = f.q ? `%${f.q.replace(/[%_\\]/g, (m) => "\\" + m).slice(0, 100)}%` : null;
  const consent = f.consent === "yes" ? true : f.consent === "no" ? false : null;
  const [min, max] = f.score === "low" ? [0, 49] : f.score === "mid" ? [50, 79] : f.score === "high" ? [80, 100] : [null, null];
  const from = f.from && /^\d{4}-\d{2}-\d{2}$/.test(f.from) ? f.from : null;
  const to = f.to && /^\d{4}-\d{2}-\d{2}$/.test(f.to) ? f.to : null;
  return (await sql()`
    SELECT l.id, l.audit_id, l.name, l.email, l.marketing_consent, l.created_at,
      a.url, a.domain, a.status AS audit_status,
      (a.scores->>'overall')::int AS score,
      (a.stats->>'issues')::int AS issues,
      (a.scores->'counts'->>'critical')::int AS critical,
      r.owner_email_status, r.visitor_email_status
    FROM leads l
    JOIN audits a ON a.id = l.audit_id
    LEFT JOIN reports r ON r.audit_id = l.audit_id
    WHERE (${like}::text IS NULL OR l.name ILIKE ${like} OR l.email ILIKE ${like} OR a.domain ILIKE ${like} OR a.url ILIKE ${like})
      AND (${consent}::boolean IS NULL OR l.marketing_consent = ${consent})
      AND (${min}::int IS NULL OR (a.scores->>'overall')::int BETWEEN ${min} AND ${max})
      AND (${from}::date IS NULL OR l.created_at >= ${from}::date)
      AND (${to}::date IS NULL OR l.created_at < (${to}::date + 1))
    ORDER BY l.created_at DESC
    LIMIT ${limit}`) as LeadRow[];
}

export async function leadTotals() {
  await ensureSchema();
  const r = (await sql()`SELECT
    (SELECT count(*)::int FROM leads) AS leads,
    (SELECT count(*)::int FROM audits) AS audits,
    (SELECT count(*)::int FROM audits WHERE status = 'complete') AS completed,
    (SELECT count(*)::int FROM leads WHERE marketing_consent) AS consented`) as { leads: number; audits: number; completed: number; consented: number }[];
  return r[0];
}
