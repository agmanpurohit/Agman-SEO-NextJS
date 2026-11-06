import "server-only";

const int = (v: string | undefined, fallback: number, min: number, max: number) => {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

/** All audit limits in one place. Override with environment variables (see .env.example). */
export const auditConfig = {
  maxPages: int(process.env.AUDIT_MAX_PAGES, 100, 1, 500),
  maxDepth: int(process.env.AUDIT_MAX_DEPTH, 4, 1, 10),
  concurrency: int(process.env.AUDIT_CONCURRENCY, 4, 1, 8),
  requestTimeoutMs: int(process.env.AUDIT_REQUEST_TIMEOUT_MS, 10_000, 2_000, 30_000),
  maxResponseBytes: int(process.env.AUDIT_MAX_RESPONSE_BYTES, 2_000_000, 100_000, 10_000_000),
  maxRedirects: 5,
  maxRetries: 1,
  /** Time one step request may spend working before it saves and returns. */
  stepBudgetMs: int(process.env.AUDIT_STEP_BUDGET_MS, 18_000, 5_000, 50_000),
  /** Max sitemap URLs read, and how many images are size-checked. */
  maxSitemapUrls: 2_000,
  maxImageChecks: 25,
  userAgent:
    process.env.AUDIT_USER_AGENT ||
    `AgmanSEOAuditBot/1.0 (+${(process.env.NEXT_PUBLIC_SITE_URL || "https://agmanrajpurohit.com").replace(/\/$/, "")}/seo-audit)`,
  /** Audits per IP per 24h and per audited domain per hour. */
  ipDailyLimit: int(process.env.AUDIT_IP_DAILY_LIMIT, 10, 1, 1000),
  domainHourlyLimit: int(process.env.AUDIT_DOMAIN_HOURLY_LIMIT, 3, 1, 100),
  pagespeedKey: process.env.PAGESPEED_API_KEY || "",
  pagespeedTimeoutMs: int(process.env.PAGESPEED_TIMEOUT_MS, 90_000, 20_000, 110_000),
};

export const reportConfig = {
  ownerEmail: process.env.CONTACT_TO_EMAIL || "",
  from: process.env.CONTACT_FROM_EMAIL || "SEO Audit <onboarding@resend.dev>",
  resendKey: process.env.RESEND_API_KEY || "",
  /**
   * Resend can only email arbitrary visitors from a verified domain. Until then reports go
   * to the owner (with the lead's details) and visitors download theirs directly.
   * Set to "true" once agmanrajpurohit.com is verified in Resend.
   */
  sendToVisitor: process.env.REPORT_SEND_TO_VISITOR === "true",
};
