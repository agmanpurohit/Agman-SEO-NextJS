"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Flip } from "gsap/Flip";
import { useStage } from "@/components/ui/motion";
import { cases, filters, type Tag } from "@/content/work";
import { CaseCover } from "./CaseCover";
import { CaseModal } from "./CaseModal";

if (typeof window !== "undefined") gsap.registerPlugin(Flip);

/** Rhythm for the asymmetric editorial grid (12 columns on desktop). */
const LAYOUT = [
  "md:col-span-7",
  "md:col-span-5 md:mt-32",
  "md:col-span-5",
  "md:col-span-6 md:col-start-7 md:-mt-16",
  "md:col-span-8 md:col-start-3",
  "md:col-span-6",
  "md:col-span-6 md:mt-24",
];

/** Filterable case-study index with smooth Flip re-layout and a case overlay. */
export function WorkExplorer() {
  const [filter, setFilter] = useState<"All" | Tag>("All");
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const grid = useRef<HTMLUListElement>(null);
  const root = useRef<HTMLElement>(null);

  const visible = useMemo(() => (filter === "All" ? cases : cases.filter((c) => c.tags.includes(filter))), [filter]);
  const counts = useMemo(() => Object.fromEntries(filters.map((f) => [f, f === "All" ? cases.length : cases.filter((c) => c.tags.includes(f as Tag)).length])), []);

  // Deep link: /work?case=slug opens that case. Read from the URL directly (no
  // useSearchParams) so the grid renders and hydrates without a Suspense bailout.
  useEffect(() => {
    const read = () => {
      const slug = new URLSearchParams(window.location.search).get("case");
      setOpenSlug(slug && cases.some((c) => c.slug === slug) ? slug : null);
    };
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);

  const syncUrl = (slug: string | null) => {
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set("case", slug);
    else url.searchParams.delete("case");
    window.history.replaceState(window.history.state, "", url);
  };

  const open = (slug: string) => {
    setOpenSlug(slug);
    syncUrl(slug);
  };
  const close = useCallback(() => {
    setOpenSlug(null);
    syncUrl(null);
  }, []);

  const pool = openSlug && visible.some((c) => c.slug === openSlug) ? visible : cases;
  const idx = openSlug ? pool.findIndex((c) => c.slug === openSlug) : -1;
  const step = useCallback(
    (d: number) => {
      if (idx < 0) return;
      const next = pool[(idx + d + pool.length) % pool.length];
      setOpenSlug(next.slug);
      syncUrl(next.slug);
    },
    [idx, pool],
  );

  // Flip-animated filtering.
  const applyFilter = (f: "All" | Tag) => {
    if (f === filter) return;
    const el = grid.current;
    if (!el || prefersReducedMotion()) return setFilter(f);
    const state = Flip.getState(el.querySelectorAll("[data-case]"));
    setFilter(f);
    requestAnimationFrame(() => {
      Flip.from(state, {
        duration: 0.9,
        ease: "cine",
        absolute: true,
        stagger: 0.03,
        onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.05 }),
        onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.94, duration: 0.4 }),
      });
    });
  };

  useStage(root, (reduced) => {
    if (reduced) return;
    gsap.from("[data-filter]", { y: 20, autoAlpha: 0, stagger: 0.04, duration: 0.8 });
    gsap.utils.toArray<HTMLElement>("[data-case]").forEach((el) => {
      const frame = el.querySelector("[data-frame]");
      gsap.fromTo(frame, { clipPath: "inset(18% 8% 18% 8%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "cine", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
      gsap.from(el.querySelectorAll("[data-meta]"), { y: 24, autoAlpha: 0, stagger: 0.06, duration: 1, scrollTrigger: { trigger: el, start: "top 85%", once: true } });
    });
  });

  const current = idx >= 0 ? pool[idx] : null;

  return (
    <section ref={root} aria-label="Case studies" className="pb-16 md:pb-24">
      {/* Static (not sticky) so it never floats over the case-study images while scrolling. */}
      <div className="wrap relative z-10 py-4">
        <div className="flex items-center gap-4">
          <span className="t-label hidden shrink-0 md:inline">Filter</span>
          <div role="group" aria-label="Filter case studies by category" className="no-scrollbar -mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)] md:mx-0 md:flex-wrap md:px-0">
            {filters.map((f) => (
              <button
                key={f}
                data-filter
                type="button"
                aria-pressed={filter === f}
                onClick={() => applyFilter(f)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors duration-300 ${
                  filter === f ? "border-bone bg-bone text-ink" : "border-line-2 text-bone-dim hover:border-bone hover:text-bone"
                }`}
              >
                {f}
                <span className={`t-mono text-[0.65rem] ${filter === f ? "text-ink/60" : "text-mute"}`}>{counts[f]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        Showing {visible.length} case {visible.length === 1 ? "study" : "studies"}
        {filter !== "All" ? ` in ${filter}` : ""}.
      </p>

      <ul ref={grid} className="wrap grid-12 mt-10 gap-y-16 md:mt-16 md:gap-y-24">
        {visible.map((c, i) => (
          <li key={c.slug} data-case data-flip-id={c.slug} className={`col-span-4 ${LAYOUT[i % LAYOUT.length]}`}>
            <button
              type="button"
              onClick={() => open(c.slug)}
              className="group block w-full text-left"
              data-cursor="View case"
              aria-haspopup="dialog"
              aria-label={`${c.client ? `${c.client.name}: ` : ""}${c.title}. View case study`}
            >
              <div data-frame className="relative aspect-[4/3] overflow-hidden border border-line transition-colors duration-500 group-hover:border-ember/60">
                <div className="absolute inset-0 transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]">
                  <CaseCover c={c} size="sm" />
                </div>
              </div>
              <div className="mt-5 grid grid-cols-[auto_1fr] gap-x-4">
                <span data-meta className="t-label pt-2 ember">
                  {String(cases.indexOf(c) + 1).padStart(2, "0")}
                </span>
                <div>
                  {c.client && (
                    <p data-meta className="t-label mb-1.5 !text-bone">
                      {c.client.name}
                    </p>
                  )}
                  <h2 data-meta className="text-[clamp(1.4rem,2.2vw,2rem)] leading-tight font-semibold tracking-tight transition-colors group-hover:text-bone">
                    {c.title}
                  </h2>
                  <p data-meta className="mt-1 text-bone-dim">
                    {c.industry}
                  </p>
                  <p data-meta className="t-label mt-3">
                    {c.tags.join(" · ")}
                  </p>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {current && (
        <CaseModal key="modal" c={current} index={idx} total={pool.length} onClose={close} onPrev={() => step(-1)} onNext={() => step(1)} />
      )}
    </section>
  );
}
