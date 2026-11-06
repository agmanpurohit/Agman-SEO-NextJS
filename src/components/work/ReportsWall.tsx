"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Reveal, SplitReveal } from "@/components/ui/motion";
import { cases } from "@/content/work";

/**
 * Every original report screenshot on the Work page itself, grouped by report type
 * (Search Console, AI features, GA4) with one tile per market.
 */
const evidenceCases = cases.filter((c) => c.reportsWall && c.evidence?.length);

const GROUPS = [
  { key: "Search Console · Performance", title: "Search Console", note: "Clicks and impressions, last 3 months against the previous 3." },
  { key: "Search Console · Generative AI features", title: "AI search features", note: "Impressions inside AI-generated results, same periods." },
  { key: "GA4 · Reports snapshot", title: "GA4", note: "What visitors did after they arrived." },
];

export function ReportsWall() {
  const [group, setGroup] = useState(0);
  const grid = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!grid.current || prefersReducedMotion()) return;
    gsap.fromTo(grid.current.querySelectorAll("[data-tile]"), { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.07, duration: 1, ease: "cine" });
  }, [group]);

  if (!evidenceCases.length) return null;
  const g = GROUPS[group];

  return (
    <section aria-labelledby="reports-title" className="section border-t border-line">
      {evidenceCases.map((c) => (
        <div key={c.slug}>
          <div className="wrap grid-12 gap-y-8">
            <p className="t-label col-span-4 md:col-span-3">
              <span className="ember">R</span> — Straight from the reports
            </p>
            <div className="col-span-4 md:col-span-9">
              <SplitReveal as="h2" id="reports-title" className="t-h2 max-w-[20ch]">
                {`${c.client?.name ?? "Financial services"}, market by market.`}
              </SplitReveal>
              <Reveal as="p" className="t-body mt-5 max-w-[40rem]">
                Unedited screenshots from Search Console and GA4 for the four markets on one domain. Select a report type; open any screenshot at full
                size.
              </Reveal>
            </div>
          </div>

          <div className="wrap mt-12">
            <div role="tablist" aria-label="Report type" className="flex flex-wrap gap-2">
              {GROUPS.map((x, i) => (
                <button
                  key={x.key}
                  role="tab"
                  type="button"
                  id={`rw-tab-${i}`}
                  aria-selected={group === i}
                  aria-controls="rw-panel"
                  onClick={() => setGroup(i)}
                  className={`rounded-full border px-5 py-2.5 text-sm transition-colors duration-300 ${
                    group === i ? "border-bone bg-bone text-ink" : "border-line-2 text-bone-dim hover:border-bone hover:text-bone"
                  }`}
                >
                  {x.title}
                </button>
              ))}
            </div>
            <p className="t-body mt-4 text-sm">{g.note}</p>

            <div ref={grid} id="rw-panel" role="tabpanel" aria-labelledby={`rw-tab-${group}`} className="mt-8 grid gap-6 md:grid-cols-2">
              {c.evidence!.map((ev) => {
                const shot = ev.shots.find((s) => s.label === g.key);
                if (!shot) return null;
                return (
                  <figure key={ev.market + g.key} data-tile>
                    <a
                      href={shot.src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block overflow-hidden border border-line bg-white transition-colors duration-500 hover:border-ember"
                      data-cursor="Enlarge"
                      aria-label={`Open full-size screenshot: ${ev.market}, ${shot.label}`}
                    >
                      <Image
                        src={shot.src}
                        alt={`${shot.label} report, ${ev.market} market. ${shot.caption}`}
                        width={shot.w}
                        height={shot.h}
                        sizes="(min-width: 768px) 45vw, 100vw"
                        className="h-auto w-full transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-[1.02]"
                      />
                    </a>
                    <figcaption className="mt-3 flex items-baseline justify-between gap-4">
                      <span className="text-lg font-medium text-bone">{ev.market}</span>
                      <span className="t-label text-right">{shot.caption}</span>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
