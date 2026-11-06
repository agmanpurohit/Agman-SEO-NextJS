import { CATEGORIES, CATEGORY_META, type Category, type Finding, type Scores, type Severity } from "./types";

/**
 * Transparent scoring.
 * - Each check carries a weight from its severity: critical 10, high 6, medium 3, low 1.
 * - Passed earns full weight, warning half, error none.
 * - "Not applicable" and "Not tested" are excluded from both sides — never scored.
 * - Category score = earned ÷ possible × 100.
 * - Overall = category scores weighted 25/20/20/15/10/5/3/2, renormalised over categories
 *   that had at least one tested check.
 * Related issues are scored once: e.g. broken links count under Technical only.
 */
export const SEVERITY_WEIGHT: Record<Severity, number> = { critical: 10, high: 6, medium: 3, low: 1 };
const EARN = { passed: 1, warning: 0.5, error: 0 } as const;

export function computeScores(findings: Finding[]): Scores {
  const categories = {} as Scores["categories"];
  for (const cat of CATEGORIES) categories[cat] = { score: null, tested: 0, passed: 0, warnings: 0, errors: 0 };
  const sums = {} as Record<Category, { got: number; max: number }>;
  for (const cat of CATEGORIES) sums[cat] = { got: 0, max: 0 };
  const counts = { critical: 0, high: 0, medium: 0, low: 0, passed: 0, notTested: 0 };

  for (const f of findings) {
    const c = categories[f.category];
    if (f.status === "na") continue;
    if (f.status === "not_tested") {
      counts.notTested++;
      continue;
    }
    const w = SEVERITY_WEIGHT[f.severity];
    sums[f.category].max += w;
    sums[f.category].got += w * EARN[f.status];
    c.tested++;
    if (f.status === "passed") {
      c.passed++;
      counts.passed++;
    } else {
      if (f.status === "warning") c.warnings++;
      else c.errors++;
      counts[f.severity]++;
    }
  }

  let wsum = 0;
  let total = 0;
  for (const cat of CATEGORIES) {
    const s = sums[cat];
    if (s.max > 0) {
      categories[cat].score = Math.round((s.got / s.max) * 100);
      wsum += CATEGORY_META[cat].weight;
      total += categories[cat].score! * CATEGORY_META[cat].weight;
    }
  }
  return { overall: wsum ? Math.round(total / wsum) : null, categories, counts };
}

/** Action-plan bucket for a failing finding, from its severity and status. */
export function priorityOf(f: Pick<Finding, "severity" | "status">): "now" | "week" | "month" | null {
  if (f.status !== "warning" && f.status !== "error") return null;
  // Fix immediately: any critical issue, or a high-severity check that failed outright.
  if (f.severity === "critical" || (f.severity === "high" && f.status === "error")) return "now";
  // Within 7 days: high-severity warnings and medium-severity errors.
  if (f.severity === "high" || (f.severity === "medium" && f.status === "error")) return "week";
  // Within 30 days: medium warnings and all low-severity items.
  return "month";
}
