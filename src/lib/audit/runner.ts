import "server-only";
import { randomBytes } from "node:crypto";
import { auditConfig } from "./config";
import { sql, ensureSchema } from "./db";
import { normaliseUrl, assertPublicHost, safeFetch, safeFetchWithRetry, UnsafeUrlError, type FetchResult } from "./net";
import { parseHtml } from "./parse";
import { fetchRobots, makeRobotsChecker, discoverSitemaps } from "./discover";
import { runPageSpeed } from "./pagespeed";
import { MODULES, type Ctx, type QueueRow } from "./checks";
import { computeScores } from "./scoring";
import { overLimit, hashIp } from "./ratelimit";
import { STAGES, type AuditStats, type Category, type Finding, type PageData, type Scores, type SiteInfo } from "./types";

export class AuditInputError extends Error {
  constructor(message: string, public code: "invalid" | "rate_limited" = "invalid") {
    super(message);
  }
}

type AuditRow = {
  id: string;
  url: string;
  start_url: string | null;
  domain: string;
  status: "running" | "complete" | "failed";
  stage: number;
  stage_cursor: number;
  error: string | null;
  settings: { maxPages: number; maxDepth: number; robotsText?: string };
  site: SiteInfo;
  stats: AuditStats;
  scores: Scores | null;
  modules_done: string[];
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

const ASSET = /\.(jpe?g|png|gif|webp|avif|svg|ico|bmp|tiff?|pdf|zip|rar|7z|gz|tar|mp3|mp4|m4a|wav|avi|mov|webm|woff2?|ttf|otf|eot|css|js|json|xml|txt|csv|xlsx?|docx?|pptx?|exe|dmg|apk)(\?|$)/i;
const MAX_QUEUE = 5000;

// ───────────────────────── create ─────────────────────────
export async function createAudit(input: string, ip: string): Promise<{ id: string }> {
  let u: URL;
  try {
    u = normaliseUrl(input);
    await assertPublicHost(u.hostname);
  } catch (e) {
    if (e instanceof UnsafeUrlError) throw new AuditInputError(e.message);
    throw e;
  }
  await ensureSchema();
  const ipKey = hashIp(ip);
  if (await overLimit(`ip:${ipKey}`, auditConfig.ipDailyLimit, 86_400)) {
    throw new AuditInputError(`You’ve reached today’s limit of ${auditConfig.ipDailyLimit} free audits. Please try again tomorrow.`, "rate_limited");
  }
  const domain = u.hostname.replace(/^www\./, "");
  if (await overLimit(`domain:${domain}`, auditConfig.domainHourlyLimit, 3600)) {
    throw new AuditInputError(`${domain} has been audited several times in the last hour. Please try again a little later.`, "rate_limited");
  }
  const id = randomBytes(9).toString("base64url");
  const stats: AuditStats = { discovered: 0, crawled: 0, analysed: 0, skipped: 0, failed: 0, limitReached: false };
  await sql()`INSERT INTO audits (id, url, domain, status, stage, settings, stats, ip_hash)
    VALUES (${id}, ${u.toString()}, ${domain}, 'running', 1,
      ${JSON.stringify({ maxPages: auditConfig.maxPages, maxDepth: auditConfig.maxDepth })}::jsonb,
      ${JSON.stringify(stats)}::jsonb, ${ipKey})`;
  return { id };
}

// ───────────────────────── status ─────────────────────────
const STAGE_WEIGHT = [0, 3, 5, 45, 4, 4, 4, 18, 3, 6, 4, 4]; // sums to 100

function progressOf(a: AuditRow) {
  if (a.status === "complete") return 100;
  let p = 0;
  for (let i = 0; i < a.stage && i < STAGE_WEIGHT.length; i++) p += STAGE_WEIGHT[i];
  if (a.stage === 3) {
    const target = Math.max(1, Math.min(a.settings.maxPages, a.stats.discovered || 1));
    p += STAGE_WEIGHT[3] * Math.min(1, a.stats.crawled / target);
  }
  if (a.stage === 7) p += STAGE_WEIGHT[7] * (a.stage_cursor / 2);
  return Math.min(99, Math.round(p));
}

export type AuditStatus = {
  id: string;
  url: string;
  startUrl: string | null;
  domain: string;
  status: AuditRow["status"];
  stage: number;
  stageLabel: string;
  progress: number;
  error: string | null;
  stats: AuditStats;
  modulesDone: string[];
  issuesSoFar: number;
  createdAt: string;
  completedAt: string | null;
  limits: { maxPages: number; maxDepth: number };
  scores?: Scores | null;
  findings?: Finding[];
  site?: Omit<SiteInfo, "robots"> & { robots?: Omit<NonNullable<SiteInfo["robots"]>, "text"> };
};

export async function getStatus(id: string, withResults = true): Promise<AuditStatus | null> {
  await ensureSchema();
  const q = sql();
  const rows = (await q`SELECT * FROM audits WHERE id = ${id}`) as AuditRow[];
  const a = rows[0];
  if (!a) return null;
  const issues = (await q`SELECT count(*)::int AS n FROM audit_findings WHERE audit_id = ${id} AND status IN ('warning','error')`) as { n: number }[];
  const out: AuditStatus = {
    id: a.id,
    url: a.url,
    startUrl: a.start_url,
    domain: a.domain,
    status: a.status,
    stage: a.stage,
    stageLabel: a.status === "complete" ? "Audit complete" : STAGES[Math.min(a.stage, STAGES.length - 1)],
    progress: progressOf(a),
    error: a.error,
    stats: a.stats,
    modulesDone: a.modules_done,
    issuesSoFar: issues[0]?.n ?? 0,
    createdAt: a.created_at,
    completedAt: a.completed_at,
    limits: { maxPages: a.settings.maxPages, maxDepth: a.settings.maxDepth },
  };
  if (withResults && a.status === "complete") {
    out.scores = a.scores;
    out.findings = await loadFindings(id);
    out.site = a.site;
  }
  return out;
}

export async function loadFindings(id: string): Promise<Finding[]> {
  const rows = (await sql()`SELECT check_id, category, status, severity, title, summary, affected, details FROM audit_findings WHERE audit_id = ${id}`) as {
    check_id: string;
    category: Category;
    status: Finding["status"];
    severity: Finding["severity"];
    title: string;
    summary: string;
    affected: Finding["affected"];
    details: Finding["details"];
  }[];
  return rows.map((r) => ({ checkId: r.check_id, category: r.category, status: r.status, severity: r.severity, title: r.title, summary: r.summary, affected: r.affected, details: r.details ?? undefined }));
}

// ───────────────────────── step ─────────────────────────
/**
 * Advances one audit by as much work as fits in the time budget, persisting every result.
 * A row lock (locked_until) guarantees only one step runs per audit at a time.
 */
export async function step(id: string): Promise<AuditStatus | null> {
  await ensureSchema();
  const q = sql();
  const locked = (await q`UPDATE audits SET locked_until = now() + interval '130 seconds'
    WHERE id = ${id} AND status = 'running' AND (locked_until IS NULL OR locked_until < now())
    RETURNING *`) as AuditRow[];
  if (!locked.length) return getStatus(id);
  const a = locked[0];
  const started = Date.now();
  const deadline = started + auditConfig.stepBudgetMs;

  try {
    while (a.status === "running" && Date.now() < deadline) {
      const before = a.stage;
      // PageSpeed calls are slow (10–50s): only start one at the beginning of a step.
      if (a.stage === 7 && Date.now() - started > 1500) break;
      await runStage(a, deadline);
      await save(a);
      if (a.stage === 3 && before === 3) break; // crawl batch done; report progress
      if (a.stage === 7 || before === 7) break;
    }
  } catch (e) {
    const msg = e instanceof UnsafeUrlError ? e.message : "Something went wrong while auditing this website. Please try again.";
    if (!(e instanceof UnsafeUrlError)) console.error("audit step failed", id, e);
    a.status = "failed";
    a.error = msg;
    await save(a);
  } finally {
    await q`UPDATE audits SET locked_until = NULL WHERE id = ${id}`;
  }
  return getStatus(id);
}

async function save(a: AuditRow) {
  await sql()`UPDATE audits SET status = ${a.status}, stage = ${a.stage}, stage_cursor = ${a.stage_cursor}, error = ${a.error},
    start_url = ${a.start_url}, site = ${JSON.stringify(a.site)}::jsonb, stats = ${JSON.stringify(a.stats)}::jsonb,
    settings = ${JSON.stringify(a.settings)}::jsonb, scores = ${a.scores ? JSON.stringify(a.scores) : null}::jsonb,
    modules_done = ${a.modules_done}, updated_at = now(),
    completed_at = ${a.status === "complete" ? new Date().toISOString() : null}
    WHERE id = ${a.id}`;
}

function fail(a: AuditRow, message: string) {
  a.status = "failed";
  a.error = message;
}

async function runStage(a: AuditRow, deadline: number) {
  switch (a.stage) {
    case 1:
      return stageAccess(a);
    case 2:
      return stageDiscover(a);
    case 3:
      return stageCrawl(a, deadline);
    case 4:
      return runModules(a, ["technical"], 5);
    case 5:
      return runModules(a, ["onpage"], 6);
    case 6:
      return runModules(a, ["content"], 7);
    case 7:
      return stagePerformance(a);
    case 8:
      return runModules(a, ["mobile"], 9);
    case 9:
      await sampleImages(a);
      return runModules(a, ["images", "links", "schema"], 10);
    case 10:
      return stageScore(a);
    case 11:
      a.status = "complete";
      return;
    default:
      a.status = "complete";
  }
}

// Stage 1 — accessibility, protocol and host checks
async function stageAccess(a: AuditRow) {
  const r = await safeFetchWithRetry(a.url);
  if (r.status === 0) return fail(a, `We couldn’t reach ${a.domain} (${r.error?.toLowerCase() ?? "no response"}). Check the address, or try again if the site is slow.`);
  if ([401, 403, 429, 503].includes(r.status)) return fail(a, `${a.domain} blocked our crawler (HTTP ${r.status}). Some firewalls and bot-protection services refuse automated audits.`);
  if (r.status >= 400) return fail(a, `The page returned HTTP ${r.status}, so it can’t be audited. Check the URL is correct.`);
  const ct = r.headers["content-type"] ?? "";
  if (!/html/i.test(ct) && !/<html/i.test(r.body.slice(0, 500))) return fail(a, "That address doesn’t return a web page (HTML), so it can’t be audited.");

  const start = new URL(r.finalUrl);
  a.start_url = start.toString();
  const origin = start.origin;
  const host = start.hostname;
  const site: SiteInfo = { origin, host, https: start.protocol === "https:", homeStatus: r.status, homeRedirects: r.redirects };

  // http → https
  try {
    const h = await safeFetch(`http://${host}/`, { readBody: false });
    site.httpRedirectsToHttps = h.status === 0 ? null : h.finalUrl.startsWith("https:");
  } catch {
    site.httpRedirectsToHttps = null;
  }
  // www consistency
  const alt = host.startsWith("www.") ? host.slice(4) : `www.${host}`;
  try {
    const w = await safeFetch(`${start.protocol}//${alt}/`, { readBody: false });
    site.wwwVariant = w.status === 0 ? null : { url: `${start.protocol}//${alt}/`, status: w.status, finalUrl: w.finalUrl, consistent: new URL(w.finalUrl).hostname === host };
  } catch {
    site.wwwVariant = null;
  }
  // soft-404 test
  try {
    const nf = `${origin}/seo-audit-check-${randomBytes(4).toString("hex")}-not-found`;
    const n = await safeFetch(nf, { readBody: false });
    site.notFoundTest = { url: nf, status: n.status };
  } catch {
    site.notFoundTest = null;
  }
  a.site = site;
  await enqueue(a, [a.start_url], 0, "start");
  // Store the start page right away (we already have it).
  await storePage(a, a.start_url, 0, r);
  await sql()`UPDATE audit_queue SET status = 'done' WHERE audit_id = ${a.id} AND url = ${a.start_url}`;
  await refreshStats(a);
  a.stage = 2;
}

// Stage 2 — robots.txt and sitemaps
async function stageDiscover(a: AuditRow) {
  const robots = await fetchRobots(a.site.origin);
  const { text, ...robotsInfo } = robots;
  a.site.robots = robotsInfo;
  a.settings.robotsText = text;
  const sm = await discoverSitemaps(a.site.origin, robots.sitemaps, a.site.host);
  a.site.sitemaps = sm.sitemaps;
  a.site.sitemapUrls = sm.urls.length;
  if (sm.urls.length) await enqueue(a, sm.urls, 99, "sitemap");
  if (robots.disallowAll) {
    await sql()`UPDATE audit_queue SET status = 'skipped', reason = 'robots' WHERE audit_id = ${a.id} AND status = 'pending'`;
    a.site.blockedByRobots = 1;
  }
  await refreshStats(a);
  a.stage = 3;
}

// Stage 3 — crawl in small concurrent batches until the budget, limit or queue runs out
async function stageCrawl(a: AuditRow, deadline: number) {
  const q = sql();
  const allowed = makeRobotsChecker(a.site.origin, a.settings.robotsText ?? "");
  while (Date.now() < deadline - 2500) {
    const crawled = ((await q`SELECT count(*)::int AS n FROM audit_pages WHERE audit_id = ${a.id}`) as { n: number }[])[0].n;
    const room = a.settings.maxPages - crawled;
    if (room <= 0) {
      const left = (await q`UPDATE audit_queue SET status = 'skipped', reason = 'limit' WHERE audit_id = ${a.id} AND status = 'pending' RETURNING 1`) as unknown[];
      a.stats.limitReached = left.length > 0;
      a.stage = 4;
      break;
    }
    const batch = (await q`SELECT url, depth FROM audit_queue WHERE audit_id = ${a.id} AND status = 'pending'
      ORDER BY depth, created_at LIMIT ${Math.min(auditConfig.concurrency, room)}`) as { url: string; depth: number }[];
    if (!batch.length) {
      a.stage = 4;
      break;
    }
    await Promise.all(
      batch.map(async ({ url, depth }) => {
        if (ASSET.test(new URL(url).pathname)) return setQueue(a.id, url, "skipped", "not a web page");
        if (!allowed(url)) return setQueue(a.id, url, "skipped", "blocked by robots.txt");
        let r: FetchResult;
        try {
          r = await safeFetchWithRetry(url);
        } catch (e) {
          return setQueue(a.id, url, "skipped", e instanceof UnsafeUrlError ? "unsafe destination" : "error");
        }
        const d = depth >= 99 ? 99 : depth;
        await storePage(a, url, d, r);
        await setQueue(a.id, url, r.status === 0 ? "failed" : "done", r.status === 0 ? (r.error ?? "failed") : null);
      }),
    );
    await refreshStats(a);
  }
}

async function setQueue(id: string, url: string, status: string, reason: string | null) {
  await sql()`UPDATE audit_queue SET status = ${status}, reason = ${reason}, attempts = attempts + 1 WHERE audit_id = ${id} AND url = ${url}`;
}

function emptyPage(): Omit<PageData, "url" | "finalUrl" | "status" | "depth" | "redirects" | "contentType" | "bytes" | "timeMs" | "isHtml"> {
  return { h1: [], h2: [], h3: [], headingOrder: [], wordCount: 0, textRatio: 0, paragraphs: 0, longParagraphs: 0, images: [], links: [], hreflang: [], og: {}, twitter: {}, jsonLd: [], microdataTypes: [], mixedContent: [], scriptCount: 0, jsAppShell: false, hasForms: false, hasContactInfo: false, smallFontHints: 0 };
}

async function storePage(a: AuditRow, url: string, depth: number, r: FetchResult) {
  const ct = r.headers["content-type"] ?? "";
  const isHtml = /html/i.test(ct) || (!ct && /<html/i.test(r.body.slice(0, 500)));
  const sameHost = (() => {
    try {
      return new URL(r.finalUrl).hostname.replace(/^www\./, "") === a.site.host.replace(/^www\./, "");
    } catch {
      return false;
    }
  })();
  const page: PageData = {
    url,
    finalUrl: r.finalUrl,
    status: r.status,
    depth,
    redirects: r.redirects,
    contentType: ct.slice(0, 80),
    bytes: r.bytes,
    timeMs: r.timeMs,
    isHtml,
    error: r.error,
    xRobots: r.headers["x-robots-tag"],
    ...emptyPage(),
    ...(isHtml && r.status === 200 && sameHost && r.body ? parseHtml(r.body, r.finalUrl, a.site.host) : {}),
  };
  await sql()`INSERT INTO audit_pages (audit_id, url, final_url, status_code, depth, ok, data)
    VALUES (${a.id}, ${url}, ${r.finalUrl}, ${r.status}, ${depth}, ${r.status === 200 && isHtml}, ${JSON.stringify(page)}::jsonb)
    ON CONFLICT (audit_id, url) DO NOTHING`;

  // Follow internal links one level deeper.
  if (page.isHtml && page.status === 200 && sameHost && !a.site.blockedByRobots) {
    const next = depth >= 99 ? null : depth + 1;
    const urls = [...new Set(page.links.filter((l) => l.internal && !l.nofollow).map((l) => l.href))];
    if (urls.length) {
      if (next !== null && next <= a.settings.maxDepth) await enqueue(a, urls, next, "link");
      else await enqueue(a, urls, next ?? 99, "link", "skipped", "beyond crawl depth");
    }
  }
}

async function enqueue(a: AuditRow, urls: string[], depth: number, source: string, status = "pending", reason: string | null = null) {
  if (!urls.length) return;
  const q = sql();
  const size = ((await q`SELECT count(*)::int AS n FROM audit_queue WHERE audit_id = ${a.id}`) as { n: number }[])[0].n;
  if (size >= MAX_QUEUE) return;
  const list = urls.slice(0, MAX_QUEUE - size);
  await q`INSERT INTO audit_queue (audit_id, url, depth, source, status, reason)
    SELECT ${a.id}, u, ${depth}, ${source}, ${status}, ${reason} FROM unnest(${list}::text[]) AS t(u)
    ON CONFLICT (audit_id, url) DO UPDATE SET
      depth = LEAST(audit_queue.depth, EXCLUDED.depth),
      status = CASE WHEN audit_queue.status = 'skipped' AND audit_queue.reason = 'beyond crawl depth' AND EXCLUDED.status = 'pending' THEN 'pending' ELSE audit_queue.status END,
      reason = CASE WHEN audit_queue.status = 'skipped' AND audit_queue.reason = 'beyond crawl depth' AND EXCLUDED.status = 'pending' THEN NULL ELSE audit_queue.reason END`;
}

async function refreshStats(a: AuditRow) {
  const q = sql();
  const r = ((await q`SELECT
      (SELECT count(*)::int FROM audit_queue WHERE audit_id = ${a.id}) AS discovered,
      (SELECT count(*)::int FROM audit_pages WHERE audit_id = ${a.id}) AS crawled,
      (SELECT count(*)::int FROM audit_pages WHERE audit_id = ${a.id} AND ok) AS analysed,
      (SELECT count(*)::int FROM audit_queue WHERE audit_id = ${a.id} AND status = 'skipped') AS skipped,
      (SELECT count(*)::int FROM audit_queue WHERE audit_id = ${a.id} AND status = 'failed') AS failed,
      (SELECT count(*)::int FROM audit_queue WHERE audit_id = ${a.id} AND reason = 'not a web page') AS "nonPages"`) as AuditStats[])[0];
  a.stats = { ...a.stats, ...r };
}

async function loadCtx(a: AuditRow): Promise<Ctx> {
  const q = sql();
  const pages = ((await q`SELECT data FROM audit_pages WHERE audit_id = ${a.id}`) as { data: PageData }[]).map((r) => r.data);
  const queue = (await q`SELECT url, depth, source, status, reason FROM audit_queue WHERE audit_id = ${a.id}`) as QueueRow[];
  return { pages, site: a.site, queue, startUrl: a.start_url ?? a.url };
}

async function storeFindings(a: AuditRow, findings: Finding[], categories: Category[]) {
  const q = sql();
  await q`DELETE FROM audit_findings WHERE audit_id = ${a.id} AND category = ANY(${categories}::text[])`;
  if (!findings.length) return;
  await q`INSERT INTO audit_findings (audit_id, check_id, category, status, severity, title, summary, affected, details)
    SELECT ${a.id}, x->>'checkId', x->>'category', x->>'status', x->>'severity', x->>'title', x->>'summary', x->'affected', x->'details'
    FROM jsonb_array_elements(${JSON.stringify(findings)}::jsonb) AS x
    ON CONFLICT (audit_id, check_id) DO NOTHING`;
}

async function runModules(a: AuditRow, cats: Category[], nextStage: number) {
  const ctx = await loadCtx(a);
  const findings = cats.flatMap((c) => MODULES[c](ctx));
  await storeFindings(a, findings, cats);
  a.modules_done = [...new Set([...a.modules_done, ...cats])];
  a.stage = nextStage;
}

// Stage 7 — PageSpeed Insights (mobile, then desktop), one per step
async function stagePerformance(a: AuditRow) {
  const target = a.start_url ?? a.url;
  a.site.pagespeed = a.site.pagespeed ?? {};
  const strategy = a.stage_cursor === 0 ? "mobile" : "desktop";
  const timedOut = { error: "PageSpeed Insights took too long to respond." };
  // If a previous attempt was cut off by the platform's time limit, the marker below is
  // already stored: move on rather than retrying forever.
  if (!a.site.pagespeed[strategy]) {
    a.site.pagespeed[strategy] = timedOut;
    await save(a);
    a.site.pagespeed[strategy] = await runPageSpeed(target, strategy);
  }
  if (strategy === "mobile") {
    a.stage_cursor = 1;
    return;
  }
  a.stage_cursor = 0;
  await runModules(a, ["performance"], 8);
}

// Part of stage 9 — sample image files for size and format
async function sampleImages(a: AuditRow) {
  const ctx = await loadCtx(a);
  const srcs = [...new Set(ctx.pages.flatMap((p) => p.images.map((i) => i.src)).filter((s) => /^https?:\/\//.test(s)))].slice(0, auditConfig.maxImageChecks);
  const out: NonNullable<SiteInfo["imageChecks"]> = [];
  await Promise.all(
    srcs.map(async (src) => {
      try {
        // Send a browser-like Accept header so image CDNs return the format real visitors get.
        const r = await safeFetch(src, { method: "HEAD", timeoutMs: 6000, accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8" });
        const len = Number(r.headers["content-length"] || 0);
        if (r.status === 200 && len > 0) out.push({ src, bytes: len, type: (r.headers["content-type"] ?? "").split(";")[0], status: r.status });
      } catch {
        /* unsafe or unreachable image hosts are skipped */
      }
    }),
  );
  a.site.imageChecks = out;
}

// Stage 10 — scores
async function stageScore(a: AuditRow) {
  const findings = await loadFindings(a.id);
  a.scores = computeScores(findings);
  a.stats.issues = findings.filter((f) => f.status === "warning" || f.status === "error").length;
  await refreshStats(a);
  a.stage = 11;
}
