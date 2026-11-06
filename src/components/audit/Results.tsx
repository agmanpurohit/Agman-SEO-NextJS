"use client";

import { useMemo, useState } from "react";
import type { AuditStatus } from "@/lib/audit/runner";
import { CHECK_BY_ID } from "@/lib/audit/checks-meta";
import { priorityOf } from "@/lib/audit/scoring";
import { CATEGORIES, CATEGORY_META, type Category, type Finding, type PageSpeedResult, type Severity, type Status } from "@/lib/audit/types";
import { ScoreRing, scoreTone, scoreWord } from "./ScoreRing";
import { LeadCapture } from "./LeadCapture";
import { ButtonLink } from "@/components/ui/Buttons";

const SEV_ORDER: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const STATUS_ORDER: Record<Status, number> = { error: 0, warning: 1, passed: 2, not_tested: 3, na: 4 };
const SEV_STYLE: Record<Severity, string> = {
  critical: "bg-ember text-ink",
  high: "bg-[#e2541d]/20 text-[#ff8a5c] border border-[#e2541d]/40",
  medium: "bg-[#f0b64a]/15 text-[#f0b64a] border border-[#f0b64a]/30",
  low: "bg-bone/10 text-bone-dim border border-line-2",
};
const STATUS_LABEL: Record<Status, string> = { passed: "Passed", warning: "Warning", error: "Error", na: "Not applicable", not_tested: "Not tested" };
const STATUS_DOT: Record<Status, string> = { passed: "bg-[#4fd18b]", warning: "bg-[#f0b64a]", error: "bg-ember", na: "bg-line-2", not_tested: "bg-line-2" };
const isPsi = (x: unknown): x is PageSpeedResult => !!x && typeof x === "object" && "metrics" in (x as object);

export function Results({ s }: { s: AuditStatus }) {
  const findings = useMemo(() => s.findings ?? [], [s.findings]);
  const sc = s.scores!;
  const st = s.stats;
  // Coverage measures web pages only; images, PDFs and other files found as links are excluded.
  const pageUrls = st.discovered - (st.nonPages ?? 0);
  const coverage = pageUrls > 0 ? Math.min(100, Math.round((st.crawled / pageUrls) * 100)) : 100;
  const issues = findings.filter((f) => f.status === "warning" || f.status === "error");
  const [catFilter, setCatFilter] = useState<Category | "all">("all");

  return (
    <div className="pt-[calc(var(--header-h)+2.5rem)] pb-10 md:pt-[calc(var(--header-h)+4rem)]">
      {/* A. Overview */}
      <section className="wrap" aria-labelledby="res-title">
        <p className="t-label">
          SEO audit · {new Date(s.completedAt ?? s.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h1 id="res-title" className="mt-3 text-[clamp(2rem,5.4vw,4.8rem)] leading-[0.95] font-bold tracking-[-0.035em] break-all">
          {s.domain}
        </h1>
        <a href={s.startUrl ?? s.url} target="_blank" rel="noopener noreferrer nofollow" className="link-u t-body mt-2 inline-block text-sm break-all">
          {s.startUrl ?? s.url} ↗
        </a>

        <div className="mt-10 grid gap-10 lg:grid-cols-[auto_1fr] lg:items-center">
          <div className="flex items-center gap-6">
            <ScoreRing value={sc.overall} size={190} stroke={12} label="Overall SEO score" />
            <div>
              <p className="t-label">Overall SEO health</p>
              <p className="mt-1 text-3xl font-semibold" style={{ color: scoreTone(sc.overall) }}>
                {scoreWord(sc.overall)}
              </p>
              <p className="t-body mt-2 max-w-[16rem] text-xs">This is an independent website SEO audit score, not a Google ranking score.</p>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3">
            {[
              ["Pages discovered", st.discovered],
              ["Pages crawled", st.crawled],
              ["Analysed (HTML 200)", st.analysed],
              ["Skipped / failed", `${st.skipped} / ${st.failed}`],
              ["Crawl coverage", `${coverage}%`],
              ["Issues found", issues.length],
            ].map(([k, v]) => (
              <div key={k as string} className="bg-ink p-4 md:p-5">
                <dt className="t-label">{k}</dt>
                <dd className="mt-1 text-2xl font-light tabular-nums md:text-3xl">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        {st.limitReached && (
          <p className="mt-5 border-l border-ember pl-4 text-sm text-bone">
            The free audit stopped at its {s.limits.maxPages}-page limit. {st.discovered - st.crawled} discovered URLs were not audited, so results describe the crawled pages only.
          </p>
        )}
        {s.site?.blockedByRobots ? <p className="mt-3 border-l border-ember pl-4 text-sm text-bone">robots.txt blocks crawlers from this site, so only the start page was audited.</p> : null}
      </section>

      {/* B. Category scores */}
      <section className="wrap mt-16" aria-labelledby="cat-title">
        <h2 id="cat-title" className="t-label mb-5">
          <span className="ember">B</span> — SEO health by category
        </h2>
        <ul className="grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
          {CATEGORIES.map((c) => {
            const cs = sc.categories[c];
            return (
              <li key={c} className="bg-ink">
                <button
                  type="button"
                  onClick={() => {
                    setCatFilter(c);
                    document.getElementById("findings")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="group flex w-full flex-col items-start gap-4 p-5 text-left transition-colors hover:bg-ink-2"
                  data-cursor="Details"
                >
                  <div className="flex w-full items-start justify-between">
                    <span className="text-sm font-medium text-bone">{CATEGORY_META[c].label}</span>
                    <span className="t-label">{CATEGORY_META[c].weight}%</span>
                  </div>
                  <ScoreRing value={cs.score} size={84} stroke={6} label={CATEGORY_META[c].label} />
                  <span className="t-label !normal-case !tracking-normal text-xs">
                    {cs.tested ? `${cs.passed} passed · ${cs.warnings} warn · ${cs.errors} err` : "Not tested"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* C. Issue summary */}
      <section className="wrap mt-16" aria-labelledby="sum-title">
        <h2 id="sum-title" className="t-label mb-5">
          <span className="ember">C</span> — Issue summary
        </h2>
        <dl className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
          {(
            [
              ["Critical", sc.counts.critical, "text-ember"],
              ["High", sc.counts.high, "text-[#ff8a5c]"],
              ["Medium", sc.counts.medium, "text-[#f0b64a]"],
              ["Low", sc.counts.low, "text-bone-dim"],
              ["Passed checks", sc.counts.passed, "text-[#4fd18b]"],
              ["Not tested", sc.counts.notTested, "text-mute"],
            ] as const
          ).map(([k, v, tone]) => (
            <div key={k} className="bg-ink p-5">
              <dt className="t-label">{k}</dt>
              <dd className={`mt-1 text-4xl font-light tabular-nums ${tone}`}>{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Lead capture */}
      <LeadCapture id={s.id} domain={s.domain} />

      {/* E. Priority plan */}
      <Priority issues={issues} />

      {/* Performance detail */}
      <Performance s={s} />

      {/* D. Findings */}
      <Findings findings={findings} catFilter={catFilter} setCatFilter={setCatFilter} />

      {/* Methodology */}
      <section className="wrap mt-20" aria-labelledby="method">
        <div className="border border-line p-6 md:p-8">
          <h2 id="method" className="t-h3">
            How this score was calculated
          </h2>
          <p className="t-body mt-3 max-w-[60rem] text-sm">
            Each check has a written rule and a severity (critical 10, high 6, medium 3, low 1). Passed checks earn full weight, warnings half, errors none. Checks marked Not tested or
            Not applicable are excluded. Category scores are weighted Technical 25%, On-page 20%, Content 20%, Performance 15%, Mobile 10%, Internal linking 5%, Images 3%, Structured data
            2%. Pages are read as server HTML (JavaScript isn’t executed); performance comes from Google PageSpeed Insights on the start page. This is an independent website SEO audit
            score, not a Google ranking score, and it can’t guarantee rankings.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/seo-audit" variant="ghost">
              Audit another site
            </ButtonLink>
            <ButtonLink href="/contact">Get help fixing these</ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}

function Priority({ issues }: { issues: Finding[] }) {
  const buckets = [
    { key: "now", label: "Fix immediately", tone: "border-ember", dot: "bg-ember" },
    { key: "week", label: "Fix within 7 days", tone: "border-[#f0b64a]/60", dot: "bg-[#f0b64a]" },
    { key: "month", label: "Improve within 30 days", tone: "border-line-2", dot: "bg-bone-dim" },
  ] as const;
  return (
    <section className="wrap mt-16" aria-labelledby="prio-title">
      <h2 id="prio-title" className="t-label mb-5">
        <span className="ember">E</span> — Priority recommendations
      </h2>
      <div className="grid gap-4 lg:grid-cols-3">
        {buckets.map((b) => {
          const list = issues.filter((f) => priorityOf(f) === b.key).sort((x, y) => SEV_ORDER[x.severity] - SEV_ORDER[y.severity]);
          return (
            <div key={b.key} className={`border-t-2 ${b.tone} bg-ink-2/60 p-5`}>
              <p className="flex items-center gap-2 font-medium">
                <span className={`h-2 w-2 rounded-full ${b.dot}`} aria-hidden="true" />
                {b.label}
                <span className="t-label ml-auto">{list.length}</span>
              </p>
              {list.length === 0 ? (
                <p className="t-body mt-4 text-sm">Nothing here — nice.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {list.slice(0, 6).map((f) => (
                    <li key={f.checkId} className="text-sm">
                      <a href={`#f-${f.checkId}`} className="link-u text-bone">
                        {f.title}
                      </a>
                      <span className="t-body block text-xs">
                        {CATEGORY_META[f.category].label} · {f.affected.length ? `${(f.details?.totalAffected as number) ?? f.affected.length} affected` : f.summary}
                      </span>
                    </li>
                  ))}
                  {list.length > 6 && (
                    <li>
                      <a href="#findings" className="t-label !text-bone hover:!text-ember">
                        +{list.length - 6} more in detailed findings ↓
                      </a>
                    </li>
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Performance({ s }: { s: AuditStatus }) {
  const ps = s.site?.pagespeed;
  const runs = [ps?.mobile, ps?.desktop];
  const any = runs.some(isPsi);
  return (
    <section className="wrap mt-16" aria-labelledby="perf-title">
      <h2 id="perf-title" className="t-label mb-5">
        <span className="ember">P</span> — Performance (Google PageSpeed Insights, start page)
      </h2>
      {!any ? (
        <p className="border-l border-line-2 pl-4 text-bone-dim">
          {(ps?.mobile as { error?: string } | undefined)?.error ?? "PageSpeed Insights didn’t return results for this site."} Performance checks are marked Not tested and excluded from the score.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {runs.map((r, i) => {
            const label = i === 0 ? "Mobile" : "Desktop";
            if (!isPsi(r))
              return (
                <div key={label} className="border border-line p-5">
                  <p className="font-medium">{label}</p>
                  <p className="t-body mt-2 text-sm">{(r as { error?: string } | undefined)?.error ?? "Not available."}</p>
                </div>
              );
            const score = r.score != null ? Math.round(r.score * 100) : null;
            const m = r.metrics;
            const metric = (k: string, name: string) => (
              <div key={k} className="flex items-baseline justify-between border-b border-line py-2">
                <dt className="text-sm text-bone-dim">{name}</dt>
                <dd className="t-mono text-sm text-bone">{m[k]?.display || "–"}</dd>
              </div>
            );
            const inp = r.field?.INTERACTION_TO_NEXT_PAINT;
            return (
              <div key={label} className="border border-line p-5">
                <div className="flex items-center gap-5">
                  <ScoreRing value={score} size={92} stroke={7} label={`${label} performance`} />
                  <div>
                    <p className="text-lg font-medium">{label}</p>
                    <p className="t-body text-xs">Lab data · Lighthouse</p>
                  </div>
                </div>
                <dl className="mt-4">
                  {metric("lcp", "Largest Contentful Paint")}
                  {metric("cls", "Cumulative Layout Shift")}
                  {metric("tbt", "Total Blocking Time")}
                  {metric("fcp", "First Contentful Paint")}
                  {metric("si", "Speed Index")}
                  <div className="flex items-baseline justify-between py-2">
                    <dt className="text-sm text-bone-dim">Interaction to Next Paint (field)</dt>
                    <dd className="t-mono text-sm text-bone">{inp ? `${inp.p75} ms` : "No field data"}</dd>
                  </div>
                </dl>
                {r.opportunities.length > 0 && (
                  <details className="mt-3">
                    <summary className="t-label cursor-pointer !text-bone">Top opportunities ({r.opportunities.length})</summary>
                    <ul className="mt-3 space-y-1.5 text-sm">
                      {r.opportunities.slice(0, 8).map((o) => (
                        <li key={o.id} className="flex justify-between gap-4">
                          <span className="text-bone-dim">{o.title}</span>
                          <span className="t-mono shrink-0 text-bone">{o.display}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Findings({ findings, catFilter, setCatFilter }: { findings: Finding[]; catFilter: Category | "all"; setCatFilter: (c: Category | "all") => void }) {
  const [sev, setSev] = useState<Severity | "all">("all");
  const [status, setStatus] = useState<"issues" | Status | "all">("issues");
  const [page, setPage] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const list = useMemo(() => {
    const q = page.trim().toLowerCase();
    return findings
      .filter((f) => catFilter === "all" || f.category === catFilter)
      .filter((f) => sev === "all" || f.severity === sev)
      .filter((f) => (status === "all" ? true : status === "issues" ? f.status === "warning" || f.status === "error" : f.status === status))
      .filter((f) => !q || f.affected.some((a) => a.url.toLowerCase().includes(q)))
      .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
  }, [findings, catFilter, sev, status, page]);

  const select = "h-11 rounded border border-line-2 bg-ink-2 px-3 text-sm text-bone";
  return (
    <section id="findings" className="wrap mt-16 scroll-mt-28" aria-labelledby="find-title">
      <h2 id="find-title" className="t-label mb-5">
        <span className="ember">D</span> — Detailed findings
      </h2>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="t-label">Category</span>
          <select className={select} value={catFilter} onChange={(e) => setCatFilter(e.target.value as Category | "all")}>
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_META[c].label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="t-label">Severity</span>
          <select className={select} value={sev} onChange={(e) => setSev(e.target.value as Severity | "all")}>
            <option value="all">All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="t-label">Status</span>
          <select className={select} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="issues">Issues only</option>
            <option value="all">All checks</option>
            <option value="error">Errors</option>
            <option value="warning">Warnings</option>
            <option value="passed">Passed</option>
            <option value="not_tested">Not tested</option>
            <option value="na">Not applicable</option>
          </select>
        </label>
        <label className="flex min-w-[14rem] flex-1 flex-col gap-1">
          <span className="t-label">Affected page</span>
          <input className={`${select} w-full`} placeholder="Filter by URL, e.g. /blog" value={page} onChange={(e) => setPage(e.target.value)} />
        </label>
      </div>
      <p className="t-body mt-4 text-sm" aria-live="polite">
        Showing {list.length} of {findings.length} checks.
      </p>

      <ul className="mt-4 border-t border-line">
        {list.map((f) => {
          const m = CHECK_BY_ID[f.checkId];
          const isOpen = !!open[f.checkId];
          const total = (f.details?.totalAffected as number) ?? f.affected.length;
          return (
            <li key={f.checkId} id={`f-${f.checkId}`} className="scroll-mt-28 border-b border-line">
              <h3>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`fp-${f.checkId}`}
                  onClick={() => setOpen((o) => ({ ...o, [f.checkId]: !o[f.checkId] }))}
                  className="flex w-full flex-wrap items-center gap-3 py-4 text-left md:flex-nowrap"
                >
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[f.status]}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-bone">{f.title}</span>
                    <span className="t-body block text-sm">{f.summary}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="t-label hidden md:inline">{CATEGORY_META[f.category].label}</span>
                    <span className={`rounded px-2 py-0.5 text-[0.65rem] font-semibold tracking-wider uppercase ${SEV_STYLE[f.severity]}`}>{f.severity}</span>
                    <span className="t-label w-20 text-right">{STATUS_LABEL[f.status]}</span>
                    <span aria-hidden="true" className={`transition-transform ${isOpen ? "rotate-45" : ""}`}>
                      +
                    </span>
                  </span>
                </button>
              </h3>
              {isOpen && (
                <div id={`fp-${f.checkId}`} className="grid gap-6 pb-6 pl-6 md:grid-cols-2">
                  <div className="space-y-4 text-sm">
                    {m && (
                      <>
                        <p>
                          <span className="t-label block">Why it matters</span>
                          <span className="text-bone">{m.why}</span>
                        </p>
                        <p>
                          <span className="t-label block">How to fix it</span>
                          <span className="text-bone">{m.fix}</span>
                        </p>
                        <p>
                          <span className="t-label block">Rule checked</span>
                          <span className="text-bone-dim">{m.rule}</span>
                        </p>
                      </>
                    )}
                  </div>
                  <div>
                    <span className="t-label block">Affected URLs {total ? `(${total})` : ""}</span>
                    {f.affected.length === 0 ? (
                      <p className="t-body mt-1 text-sm">None.</p>
                    ) : (
                      <AffectedList items={f.affected} total={total} />
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function AffectedList({ items, total }: { items: Finding["affected"]; total: number }) {
  const [n, setN] = useState(10);
  return (
    <>
      <ul className="mt-2 max-h-[22rem] space-y-1.5 overflow-auto pr-2 text-sm" data-lenis-prevent>
        {items.slice(0, n).map((a, i) => (
          <li key={i} className="break-all">
            {/^https?:\/\//.test(a.url) ? (
              <a href={a.url} target="_blank" rel="noopener noreferrer nofollow" className="link-u text-bone">
                {a.url}
              </a>
            ) : (
              <span className="text-bone">{a.url}</span>
            )}
            {a.note && <span className="t-body block text-xs">{a.note}</span>}
          </li>
        ))}
      </ul>
      {items.length > n && (
        <button type="button" onClick={() => setN((x) => x + 25)} className="t-label mt-3 !text-bone hover:!text-ember">
          Show more ({items.length - n} more)
        </button>
      )}
      {total > items.length && <p className="t-body mt-2 text-xs">Showing the first {items.length} of {total}.</p>}
    </>
  );
}
