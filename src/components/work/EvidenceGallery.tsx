"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import type { Evidence } from "@/content/work";

/**
 * Original Search Console / GA4 screenshots, grouped by market behind accessible tabs.
 * Each screenshot opens full size in a new tab.
 */
export function EvidenceGallery({ evidence }: { evidence: Evidence[] }) {
  const [active, setActive] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const ev = evidence[Math.min(active, evidence.length - 1)];

  useEffect(() => {
    if (!panel.current || prefersReducedMotion()) return;
    gsap.fromTo(panel.current.querySelectorAll("[data-shot]"), { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.9, ease: "cine" });
  }, [active]);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const n = evidence.length;
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % n;
    if (e.key === "ArrowLeft") next = (i - 1 + n) % n;
    if (next < 0) return;
    e.preventDefault();
    e.stopPropagation(); // don't page the case overlay
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label="Report group" className={`flex flex-wrap gap-2 ${evidence.length < 2 ? "hidden" : ""}`}>
        {evidence.map((e, i) => (
          <button
            key={e.market}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            role="tab"
            type="button"
            id={`ev-tab-${i}`}
            aria-selected={active === i}
            aria-controls="ev-panel"
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(k) => onKey(k, i)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors duration-300 ${
              active === i ? "border-bone bg-bone text-ink" : "border-line-2 text-bone-dim hover:border-bone hover:text-bone"
            }`}
          >
            {e.market}
          </button>
        ))}
      </div>

      <div ref={panel} id="ev-panel" role="tabpanel" aria-labelledby={`ev-tab-${active}`} className="mt-6">
        <p className="t-mono text-sm text-bone">{ev.summary}</p>
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          {ev.shots.map((s, i) => (
            <figure key={s.src} data-shot className={s.w / s.h > 1.7 || (i === 0 && ev.shots.length % 2 === 1) ? "xl:col-span-2" : ""}>
              <a
                href={s.src}
                target="_blank"
                rel="noopener noreferrer"
                className="group block overflow-hidden border border-line bg-white transition-colors duration-500 hover:border-ember"
                data-cursor="Enlarge"
                aria-label={`Open full-size screenshot: ${s.label}`}
              >
                <Image
                  src={s.src}
                  alt={`${s.label} screenshot (${ev.market}). ${s.caption}`}
                  width={s.w}
                  height={s.h}
                  sizes="(min-width: 1280px) 60vw, 100vw"
                  className="h-auto w-full transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-[1.02]"
                />
              </a>
              <figcaption className="mt-3">
                <span className="t-label !text-bone">{s.label}</span>
                <span className="t-body mt-1 block text-xs">{s.caption}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
