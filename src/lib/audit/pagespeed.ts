import "server-only";
import { auditConfig } from "./config";
import type { PageSpeedResult } from "./types";

type LhAudit = { id: string; title: string; score: number | null; scoreDisplayMode?: string; displayValue?: string; numericValue?: number; details?: { overallSavingsMs?: number; overallSavingsBytes?: number } };

const METRICS: Record<string, string> = {
  lcp: "largest-contentful-paint",
  cls: "cumulative-layout-shift",
  fcp: "first-contentful-paint",
  si: "speed-index",
  tbt: "total-blocking-time",
  tti: "interactive",
};

const MOBILE_AUDITS = ["font-size", "tap-targets", "target-size", "content-width", "viewport"];

/** Runs Google PageSpeed Insights for one URL and strategy. Returns { error } instead of throwing; never invents data. */
export async function runPageSpeed(url: string, strategy: "mobile" | "desktop"): Promise<PageSpeedResult | { error: string }> {
  const qs = new URLSearchParams({ url, strategy });
  for (const c of ["performance", "seo", "accessibility"]) qs.append("category", c);
  if (auditConfig.pagespeedKey) qs.set("key", auditConfig.pagespeedKey);

  const ctrl = new AbortController();
  // Heavy pages can take Google 60s+. The step route allows 120s; if the platform cuts the
  // request earlier, the runner's "timed out" marker prevents an infinite retry.
  const t = setTimeout(() => ctrl.abort(), auditConfig.pagespeedTimeoutMs);
  let json: Record<string, unknown>;
  try {
    const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${qs}`, { signal: ctrl.signal, cache: "no-store" });
    json = await res.json();
    if (!res.ok) {
      const msg = (json?.error as { message?: string } | undefined)?.message ?? `HTTP ${res.status}`;
      return { error: `PageSpeed Insights couldn’t test this page: ${msg.slice(0, 160)}` };
    }
  } catch (e) {
    return { error: (e as Error).name === "AbortError" ? "PageSpeed Insights took too long to respond." : "PageSpeed Insights could not be reached." };
  } finally {
    clearTimeout(t);
  }

  const lh = json.lighthouseResult as { categories?: Record<string, { score: number | null }>; audits?: Record<string, LhAudit>; runtimeError?: { message?: string } } | undefined;
  if (!lh?.audits) return { error: "PageSpeed Insights returned no Lighthouse data." };
  if (lh.runtimeError?.message) return { error: `Lighthouse error: ${lh.runtimeError.message.slice(0, 160)}` };
  const audits = lh.audits;

  const metrics: PageSpeedResult["metrics"] = {};
  for (const [k, id] of Object.entries(METRICS)) {
    const a = audits[id];
    if (a) metrics[k] = { value: a.numericValue ?? null, display: a.displayValue ?? "", score: a.score };
  }

  const opportunities: PageSpeedResult["opportunities"] = [];
  const diagnostics: PageSpeedResult["diagnostics"] = [];
  const passedAudits: string[] = [];
  for (const a of Object.values(audits)) {
    if (a.scoreDisplayMode === "notApplicable" || a.scoreDisplayMode === "manual" || a.scoreDisplayMode === "informative") continue;
    if (a.score === null || a.score === undefined) continue;
    if (Object.values(METRICS).includes(a.id)) continue;
    if (a.score >= 0.9) {
      passedAudits.push(a.id);
      continue;
    }
    const savingsMs = a.details?.overallSavingsMs;
    const savingsBytes = a.details?.overallSavingsBytes;
    const item = { id: a.id, title: a.title, display: a.displayValue ?? "" };
    if ((savingsMs && savingsMs > 0) || (savingsBytes && savingsBytes > 0)) opportunities.push({ ...item, savingsMs, savingsBytes });
    else diagnostics.push(item);
  }
  opportunities.sort((a, b) => (b.savingsMs ?? 0) - (a.savingsMs ?? 0));
  // Keep mobile usability audits even if scored as diagnostics.
  for (const id of MOBILE_AUDITS) if (audits[id] && (audits[id].score ?? 1) < 0.9 && !diagnostics.some((d) => d.id === id) && !opportunities.some((o) => o.id === id)) diagnostics.push({ id, title: audits[id].title, display: audits[id].displayValue ?? "" });

  const le = json.loadingExperience as { metrics?: Record<string, { percentile: number; category: string }>; overall_category?: string } | undefined;
  const field: PageSpeedResult["field"] = {};
  if (le?.metrics) for (const [k, v] of Object.entries(le.metrics)) field[k] = { p75: v.percentile, category: v.category };
  if (le?.overall_category) field.OVERALL = { p75: 0, category: le.overall_category };

  return {
    url,
    strategy,
    score: lh.categories?.performance?.score ?? null,
    metrics,
    field: Object.keys(field).length ? field : undefined,
    opportunities: opportunities.slice(0, 15),
    diagnostics: diagnostics.slice(0, 25),
    passedAudits,
  };
}
