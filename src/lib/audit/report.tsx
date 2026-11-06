import "server-only";
import { Document, Page, Text, View, StyleSheet, Svg, Circle, Rect, Link, Font, renderToBuffer } from "@react-pdf/renderer";
import { CHECK_BY_ID } from "./checks-meta";
import { priorityOf } from "./scoring";
import { CATEGORIES, CATEGORY_META, type Finding, type PageSpeedResult } from "./types";
import type { AuditStatus } from "./runner";
import { site as owner } from "@/content/site";

/**
 * PDF report built only from stored audit findings. Uses built-in Helvetica so it renders
 * reliably on serverless without font files.
 */
// No automatic hyphenation: it splits emails, URLs and domain names mid-word.
Font.registerHyphenationCallback((word) => [word]);

const C = { ink: "#0A0A0B", ink2: "#17171A", line: "#E2DED6", mute: "#6E6A63", bone: "#F6F3EE", ember: "#FF5A1F", red: "#D93A1A", amber: "#C98A00", green: "#1F8A4C", text: "#1D1C1A" };

const s = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 60, paddingHorizontal: 44, fontFamily: "Helvetica", fontSize: 9.5, color: C.text, lineHeight: 1.45 },
  cover: { backgroundColor: C.ink, color: C.bone, padding: 56, fontFamily: "Helvetica", flexDirection: "column", justifyContent: "space-between" },
  h1: { fontSize: 30, fontFamily: "Helvetica-Bold", letterSpacing: -0.5, lineHeight: 1.1 },
  h2: { fontSize: 17, fontFamily: "Helvetica-Bold", marginBottom: 10, color: C.ink },
  h3: { fontSize: 11.5, fontFamily: "Helvetica-Bold", marginBottom: 4, color: C.ink },
  label: { fontSize: 7.5, letterSpacing: 1.2, textTransform: "uppercase", color: C.mute },
  muted: { color: C.mute },
  row: { flexDirection: "row" },
  rule: { height: 1, backgroundColor: C.line, marginVertical: 12 },
  card: { borderWidth: 1, borderColor: C.line, borderRadius: 4, padding: 10, marginBottom: 8 },
  pill: { fontSize: 7, fontFamily: "Helvetica-Bold", paddingVertical: 2, paddingHorizontal: 5, borderRadius: 3, color: "#fff", textTransform: "uppercase" },
  footer: { position: "absolute", bottom: 26, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: C.mute, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8 },
  td: { paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: C.line },
});

const sevColor = { critical: C.red, high: "#E2541D", medium: C.amber, low: "#6B7A8C" } as const;
const scoreColor = (v: number | null) => (v == null ? C.mute : v >= 80 ? C.green : v >= 50 ? C.amber : C.red);
const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
const isPsi = (x: unknown): x is PageSpeedResult => !!x && typeof x === "object" && "metrics" in (x as object);

function Ring({ value, size = 120, stroke = 10, light = false }: { value: number | null; size?: number; stroke?: number; light?: boolean }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value ?? 0)) / 100;
  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={light ? "#2A2A2F" : C.line} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={value == null ? C.mute : light ? C.ember : scoreColor(value)}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circ * pct} ${circ}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ position: "absolute", top: 0, left: 0, width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: size / 3.2, fontFamily: "Helvetica-Bold", color: light ? C.bone : C.ink }}>{value ?? "–"}</Text>
        <Text style={{ fontSize: 7, color: light ? "#9C978E" : C.mute }}>/ 100</Text>
      </View>
    </View>
  );
}

function Bar({ value }: { value: number | null }) {
  return (
    <Svg width={150} height={8}>
      <Rect x={0} y={0} width={150} height={8} rx={4} fill={C.line} />
      {value != null && <Rect x={0} y={0} width={(150 * value) / 100} height={8} rx={4} fill={scoreColor(value)} />}
    </Svg>
  );
}

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text>SEO Audit Report | Agman Rajpurohit</Text>
      <Text>{owner.url.replace(/^https?:\/\//, "")} · {owner.email}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function FindingBlock({ f }: { f: Finding }) {
  const m = CHECK_BY_ID[f.checkId];
  const failing = f.status === "warning" || f.status === "error";
  return (
    <View style={s.card} wrap={false}>
      <View style={[s.row, { justifyContent: "space-between", marginBottom: 4 }]}>
        <Text style={[s.h3, { flex: 1, marginRight: 8 }]}>{f.title}</Text>
        <View style={s.row}>
          <Text style={[s.pill, { backgroundColor: sevColor[f.severity], marginRight: 4 }]}>{f.severity}</Text>
          <Text style={[s.pill, { backgroundColor: f.status === "error" ? C.red : f.status === "warning" ? C.amber : f.status === "passed" ? C.green : C.mute }]}>
            {f.status === "not_tested" ? "not tested" : f.status === "na" ? "n/a" : f.status}
          </Text>
        </View>
      </View>
      <Text>{f.summary}</Text>
      {failing && m && (
        <>
          <Text style={{ marginTop: 5 }}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Why it matters: </Text>
            {m.why}
          </Text>
          <Text style={{ marginTop: 3 }}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>How to fix: </Text>
            {m.fix}
          </Text>
        </>
      )}
      {failing && f.affected.length > 0 && (
        <View style={{ marginTop: 6 }}>
          <Text style={s.label}>Affected ({(f.details?.totalAffected as number) ?? f.affected.length})</Text>
          {f.affected.slice(0, 8).map((a, i) => (
            <Text key={i} style={{ fontSize: 8, color: C.mute }}>
              • {a.url.length > 95 ? a.url.slice(0, 95) + "…" : a.url}
              {a.note ? ` — ${a.note.slice(0, 110)}` : ""}
            </Text>
          ))}
          {f.affected.length > 8 && <Text style={{ fontSize: 8, color: C.mute }}>…and {((f.details?.totalAffected as number) ?? f.affected.length) - 8} more (full list in the online report).</Text>}
        </View>
      )}
    </View>
  );
}

function ReportDoc({ a, recipient }: { a: AuditStatus; recipient: string }) {
  const findings = a.findings ?? [];
  const sc = a.scores!;
  const failing = findings.filter((f) => f.status === "warning" || f.status === "error");
  const sevRank = { critical: 0, high: 1, medium: 2, low: 3 };
  failing.sort((x, y) => sevRank[x.severity] - sevRank[y.severity]);
  const plan = { now: failing.filter((f) => priorityOf(f) === "now"), week: failing.filter((f) => priorityOf(f) === "week"), month: failing.filter((f) => priorityOf(f) === "month") };
  const st = a.stats;
  const pageUrls = st.discovered - (st.nonPages ?? 0);
  const coverage = pageUrls > 0 ? Math.min(100, Math.round((st.crawled / pageUrls) * 100)) : 100;
  const mob = isPsi(a.site?.pagespeed?.mobile) ? (a.site!.pagespeed!.mobile as PageSpeedResult) : null;
  const desk = isPsi(a.site?.pagespeed?.desktop) ? (a.site!.pagespeed!.desktop as PageSpeedResult) : null;
  const weakest = CATEGORIES.filter((c) => sc.categories[c].score != null).sort((x, y) => (sc.categories[x].score ?? 0) - (sc.categories[y].score ?? 0)).slice(0, 2);

  return (
    <Document title={`SEO Audit — ${a.domain}`} author="Agman Rajpurohit" subject="Website SEO audit report">
      {/* 1–4 Cover */}
      <Page size="A4" style={s.cover}>
        <View>
          <Text style={[s.label, { color: C.ember }]}>Website SEO Audit</Text>
          <Text style={[s.h1, { color: C.bone, marginTop: 14 }]}>{a.domain}</Text>
          <Text style={{ color: "#9C978E", marginTop: 8, fontSize: 10 }}>{a.startUrl ?? a.url}</Text>
        </View>
        <View style={[s.row, { alignItems: "center" }]}>
          <Ring value={sc.overall} size={150} stroke={12} light />
          <View style={{ marginLeft: 28 }}>
            <Text style={[s.label, { color: "#9C978E" }]}>Overall SEO health score</Text>
            <Text style={{ color: C.bone, fontSize: 12, marginTop: 6, maxWidth: 260 }}>An independent website SEO audit score, not a Google ranking score.</Text>
          </View>
        </View>
        <View>
          <Text style={[s.label, { color: "#9C978E" }]}>Audit date</Text>
          <Text style={{ color: C.bone, marginTop: 3 }}>{fmtDate(a.completedAt ?? a.createdAt)}</Text>
          <Text style={[s.label, { color: "#9C978E", marginTop: 12 }]}>Prepared for</Text>
          <Text style={{ color: C.bone, marginTop: 3 }}>{recipient}</Text>
          <Text style={[s.label, { color: "#9C978E", marginTop: 12 }]}>Prepared by</Text>
          <Text style={{ color: C.bone, marginTop: 3 }}>Agman Rajpurohit · SEO & Digital Marketing Specialist · {owner.email}</Text>
        </View>
      </Page>

      {/* 5–6 Executive summary & crawl statistics */}
      <Page size="A4" style={s.page}>
        <Text style={s.h2}>Executive summary</Text>
        <Text>
          We crawled {st.crawled} page{st.crawled === 1 ? "" : "s"} of {a.domain} and ran {sc.counts.passed + failing.length} checks across eight areas. The site scores{" "}
          <Text style={{ fontFamily: "Helvetica-Bold" }}>{sc.overall ?? "–"}/100</Text>, with {sc.counts.critical} critical, {sc.counts.high} high, {sc.counts.medium} medium and {sc.counts.low} low-priority issues, and{" "}
          {sc.counts.passed} checks passed.
          {weakest.length ? ` The weakest areas are ${weakest.map((c) => `${CATEGORY_META[c].label} (${sc.categories[c].score})`).join(" and ")}.` : ""}
          {sc.counts.notTested ? ` ${sc.counts.notTested} check(s) could not be tested and are excluded from the score.` : ""}
        </Text>
        {plan.now.length > 0 && (
          <Text style={{ marginTop: 6 }}>
            Start with: {plan.now.slice(0, 3).map((f) => f.title.toLowerCase()).join("; ")}.
          </Text>
        )}

        <View style={s.rule} />
        <Text style={s.h3}>Category scores</Text>
        {CATEGORIES.map((c) => (
          <View key={c} style={[s.row, { alignItems: "center", marginVertical: 3 }]}>
            <Text style={{ width: 120 }}>{CATEGORY_META[c].label}</Text>
            <Bar value={sc.categories[c].score} />
            <Text style={{ width: 40, textAlign: "right", fontFamily: "Helvetica-Bold" }}>{sc.categories[c].score ?? "–"}</Text>
            <Text style={[s.muted, { marginLeft: 10, fontSize: 8 }]}>
              weight {CATEGORY_META[c].weight}% · {sc.categories[c].passed} passed · {sc.categories[c].warnings} warnings · {sc.categories[c].errors} errors
            </Text>
          </View>
        ))}

        <View style={s.rule} />
        <Text style={s.h3}>Crawl statistics</Text>
        <View style={[s.row, { flexWrap: "wrap" }]}>
          {[
            ["URLs discovered", st.discovered],
            ["URLs crawled", st.crawled],
            ["Pages analysed", st.analysed],
            ["Skipped", st.skipped],
            ["Failed", st.failed],
            ["Crawl coverage", `${coverage}%`],
          ].map(([k, v]) => (
            <View key={k as string} style={{ width: "33%", marginBottom: 8 }}>
              <Text style={s.label}>{k}</Text>
              <Text style={{ fontSize: 16, fontFamily: "Helvetica-Bold" }}>{v}</Text>
            </View>
          ))}
        </View>
        {st.limitReached && <Text style={s.muted}>The free audit stopped at its {a.limits.maxPages}-page limit, so not every discovered URL was audited.</Text>}

        {(mob || desk) && (
          <>
            <View style={s.rule} />
            <Text style={s.h3}>Performance snapshot (Google PageSpeed Insights, start page)</Text>
            {[mob, desk].filter(Boolean).map((p) => (
              <View key={p!.strategy} style={[s.row, { marginVertical: 3 }]}>
                <Text style={{ width: 70, textTransform: "capitalize" }}>{p!.strategy}</Text>
                <Text style={{ width: 70, fontFamily: "Helvetica-Bold" }}>{p!.score != null ? Math.round(p!.score * 100) : "–"}/100</Text>
                <Text style={s.muted}>
                  LCP {p!.metrics.lcp?.display ?? "–"} · CLS {p!.metrics.cls?.display ?? "–"} · TBT {p!.metrics.tbt?.display ?? "–"} · FCP {p!.metrics.fcp?.display ?? "–"}
                </Text>
              </View>
            ))}
          </>
        )}
        <Footer />
      </Page>

      {/* 7–14 Category sections */}
      {CATEGORIES.map((c) => {
        const list = findings.filter((f) => f.category === c);
        const order = { error: 0, warning: 1, passed: 2, not_tested: 3, na: 4 };
        list.sort((x, y) => order[x.status] - order[y.status] || sevRank[x.severity] - sevRank[y.severity]);
        return (
          <Page key={c} size="A4" style={s.page}>
            <View style={[s.row, { justifyContent: "space-between", alignItems: "center", marginBottom: 12 }]}>
              <View>
                <Text style={s.label}>Section</Text>
                <Text style={s.h2}>{CATEGORY_META[c].label}</Text>
              </View>
              <Ring value={sc.categories[c].score} size={64} stroke={6} />
            </View>
            {c === "performance" && !mob && !desk && <Text style={[s.muted, { marginBottom: 8 }]}>PageSpeed Insights did not return results, so performance checks are marked “not tested”.</Text>}
            {c === "schema" && <Text style={[s.muted, { marginBottom: 8 }]}>Structured data is validated for syntax only. Rich-result eligibility is decided separately by Google.</Text>}
            {list.map((f) => (
              <FindingBlock key={f.checkId} f={f} />
            ))}
            <Footer />
          </Page>
        );
      })}

      {/* 15–20 Action plan */}
      <Page size="A4" style={s.page}>
        <Text style={s.h2}>Priority action plan</Text>
        <Text style={[s.muted, { marginBottom: 10 }]}>Based only on issues found in this audit, ordered by severity and impact.</Text>
        {(
          [
            ["Fix immediately", plan.now, C.red],
            ["Fix within 7 days", plan.week, C.amber],
            ["Improve within 30 days", plan.month, "#6B7A8C"],
          ] as const
        ).map(([label, list, color]) => (
          <View key={label} style={{ marginBottom: 12 }}>
            <View style={[s.row, { alignItems: "center", marginBottom: 6 }]}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 6 }} />
              <Text style={s.h3}>
                {label} ({list.length})
              </Text>
            </View>
            {list.length === 0 && <Text style={s.muted}>Nothing in this bucket.</Text>}
            {list.map((f) => (
              <View key={f.checkId} style={[s.row, { marginBottom: 4 }]} wrap={false}>
                <Text style={{ width: 14 }}>•</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>
                    {f.title} <Text style={[s.muted, { fontFamily: "Helvetica" }]}>— {CATEGORY_META[f.category].label} · {f.affected.length ? `${(f.details?.totalAffected as number) ?? f.affected.length} affected` : f.summary}</Text>
                  </Text>
                  <Text style={{ fontSize: 8.5 }}>{CHECK_BY_ID[f.checkId]?.fix}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}
        <View style={s.rule} />
        <Text style={s.h3}>Final recommendations</Text>
        <Text>
          Work through the “fix immediately” list first, then re-run the audit to confirm the fixes. Pair technical fixes with content improvements on your most important service or
          product pages, since that is where higher rankings translate into enquiries. Track progress in Google Search Console and GA4.
        </Text>
        <View style={[s.card, { marginTop: 14, backgroundColor: "#FFF4EE", borderColor: "#FFD3C0" }]} wrap={false}>
          <Text style={s.h3}>Want help implementing this?</Text>
          <Text>
            I’m Agman Rajpurohit, an SEO & digital marketing specialist based in Dubai. Reply to this email or reach me at {owner.email} / {owner.locations[0].phone}.
          </Text>
          <Link src={`${owner.url}/contact`} style={{ color: C.ember, marginTop: 4 }}>
            {owner.url.replace(/^https?:\/\//, "")}/contact
          </Link>
        </View>
        <Text style={[s.muted, { marginTop: 14, fontSize: 7.5 }]}>
          Methodology: checks are scored passed (full credit), warning (half) or error (none), weighted by severity; checks not tested or not applicable are excluded. Category
          weights: Technical 25%, On-page 20%, Content 20%, Performance 15%, Mobile 10%, Internal linking 5%, Images 3%, Structured data 2%. This is an independent website SEO audit
          score, not a Google ranking score, and does not guarantee rankings.
        </Text>
        <Footer />
      </Page>
    </Document>
  );
}

export async function renderReport(a: AuditStatus, recipient: string): Promise<Buffer> {
  return renderToBuffer(<ReportDoc a={a} recipient={recipient} />);
}
