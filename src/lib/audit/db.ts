import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let client: NeonQueryFunction<false, false> | null = null;

/** Tagged-template SQL client (parameterised queries only — never string-built SQL). */
export function sql() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not configured");
    client = neon(url);
  }
  return client;
}

let schemaReady: Promise<void> | null = null;

/**
 * Creates tables on first use (idempotent). Keeps setup to "add DATABASE_URL" —
 * no separate migration step needed.
 */
export function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const q = sql();
      await q`CREATE TABLE IF NOT EXISTS audits (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        start_url TEXT,
        domain TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'queued',
        stage INT NOT NULL DEFAULT 0,
        stage_cursor INT NOT NULL DEFAULT 0,
        error TEXT,
        settings JSONB NOT NULL DEFAULT '{}'::jsonb,
        site JSONB NOT NULL DEFAULT '{}'::jsonb,
        stats JSONB NOT NULL DEFAULT '{}'::jsonb,
        scores JSONB,
        modules_done TEXT[] NOT NULL DEFAULT '{}',
        ip_hash TEXT,
        locked_until TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        completed_at TIMESTAMPTZ
      )`;
      await q`CREATE INDEX IF NOT EXISTS audits_domain_created ON audits (domain, created_at DESC)`;
      await q`CREATE TABLE IF NOT EXISTS audit_queue (
        audit_id TEXT NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        depth INT NOT NULL,
        source TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        attempts INT NOT NULL DEFAULT 0,
        reason TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (audit_id, url)
      )`;
      await q`CREATE INDEX IF NOT EXISTS audit_queue_pending ON audit_queue (audit_id, status, depth)`;
      await q`CREATE TABLE IF NOT EXISTS audit_pages (
        audit_id TEXT NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        final_url TEXT,
        status_code INT,
        depth INT NOT NULL,
        ok BOOLEAN NOT NULL DEFAULT false,
        data JSONB NOT NULL DEFAULT '{}'::jsonb,
        crawled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (audit_id, url)
      )`;
      await q`CREATE TABLE IF NOT EXISTS audit_findings (
        audit_id TEXT NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
        check_id TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL,
        severity TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        affected JSONB NOT NULL DEFAULT '[]'::jsonb,
        details JSONB,
        PRIMARY KEY (audit_id, check_id)
      )`;
      await q`CREATE TABLE IF NOT EXISTS leads (
        id BIGSERIAL PRIMARY KEY,
        audit_id TEXT NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        marketing_consent BOOLEAN NOT NULL DEFAULT false,
        consent_at TIMESTAMPTZ,
        download_token TEXT NOT NULL,
        ip_hash TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (audit_id, email)
      )`;
      await q`CREATE TABLE IF NOT EXISTS reports (
        audit_id TEXT PRIMARY KEY REFERENCES audits(id) ON DELETE CASCADE,
        generated_at TIMESTAMPTZ,
        bytes INT,
        owner_email_status TEXT,
        visitor_email_status TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await q`CREATE TABLE IF NOT EXISTS rate_limits (
        key TEXT NOT NULL,
        window_start TIMESTAMPTZ NOT NULL,
        count INT NOT NULL DEFAULT 0,
        PRIMARY KEY (key, window_start)
      )`;
    })().catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  return schemaReady;
}
