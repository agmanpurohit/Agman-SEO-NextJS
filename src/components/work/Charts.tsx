"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import type { Chart } from "@/content/work";

const fmt = (n: number) => (n >= 10000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, "")}K` : n.toLocaleString("en-US"));

/**
 * Original charts redrawn from verified figures (no screenshots of client dashboards).
 * Accessible: each chart is a real table, visually styled as bars.
 */
export function ChartView({ chart }: { chart: Chart }) {
  const ref = useRef<HTMLTableElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-bar]", { scaleX: 0, transformOrigin: "left", duration: 1.4, stagger: 0.06, ease: "cine", delay: 0.2 });
    }, el);
    return () => ctx.revert();
  }, [chart]);

  if (chart.kind === "markets") {
    const max = Math.max(...chart.rows.map((r) => r.after));
    return (
      <figure className="border border-line p-5 md:p-7">
        <figcaption className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-lg font-medium">{chart.title}</span>
          <span className="flex items-center gap-4 text-xs text-bone-dim">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 bg-bone/30" aria-hidden="true" /> Before
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 bg-ember" aria-hidden="true" /> After
            </span>
          </span>
        </figcaption>
        <table ref={ref} className="w-full border-collapse text-sm">
          <thead className="sr-only">
            <tr>
              <th scope="col">Market</th>
              <th scope="col">Before</th>
              <th scope="col">After</th>
              <th scope="col">Change</th>
            </tr>
          </thead>
          <tbody>
            {chart.rows.map((r) => {
              const change = Math.round(((r.after - r.before) / r.before) * 100);
              return (
                <tr key={r.market} className="grid grid-cols-[5.5rem_1fr_4.5rem] items-center gap-x-3 py-2.5 md:grid-cols-[7rem_1fr_5rem]">
                  <th scope="row" className="text-left font-normal text-bone">
                    {r.market}
                  </th>
                  <td className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-2">
                      <span data-bar className="block h-1.5 bg-bone/30" style={{ width: `${Math.max(1.5, (r.before / max) * 100)}%` }} />
                      <span className="t-mono text-[0.7rem] text-bone-dim">{fmt(r.before)}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span data-bar className="block h-1.5 bg-ember" style={{ width: `${(r.after / max) * 100}%` }} />
                      <span className="t-mono text-[0.7rem] text-bone">{fmt(r.after)}</span>
                    </span>
                  </td>
                  <td className="t-mono text-right text-bone">+{change}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="t-body mt-5 text-xs">{chart.caption}</p>
      </figure>
    );
  }

  const max = Math.max(...chart.rows.map((r) => r.value));
  return (
    <figure className="border border-line p-5 md:p-7">
      <figcaption className="mb-6 text-lg font-medium">{chart.title}</figcaption>
      <table ref={ref} className="w-full border-collapse text-sm">
        <thead className="sr-only">
          <tr>
            <th scope="col">Channel</th>
            <th scope="col">Sessions</th>
          </tr>
        </thead>
        <tbody>
          {chart.rows.map((r) => (
            <tr key={r.label} className="grid grid-cols-[5.5rem_1fr] items-center gap-x-3 py-2.5 md:grid-cols-[7rem_1fr]">
              <th scope="row" className="text-left font-normal text-bone">
                {r.label}
              </th>
              <td className="flex items-center gap-3">
                <span data-bar className={`block h-2 ${r.highlight ? "bg-ember" : "bg-bone/30"}`} style={{ width: `${(r.value / max) * 85}%` }} />
                <span className="t-mono text-xs text-bone">{r.display}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="t-body mt-5 text-xs">{chart.caption}</p>
    </figure>
  );
}
