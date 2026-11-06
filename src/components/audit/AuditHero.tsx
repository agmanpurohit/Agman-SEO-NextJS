"use client";

import { useRef } from "react";
import { gsap, SplitText } from "@/lib/gsap";
import { useStage } from "@/components/ui/motion";
import { AuditForm, AuditBadges } from "./AuditForm";
import { nav } from "@/content/site";

/** Landing hero for the audit tool, with an animated "index scan" of result lines behind the form. */
export function AuditHero() {
  const root = useRef<HTMLElement>(null);
  useStage(root, (reduced) => {
    if (reduced) return;
    const split = SplitText.create("[data-ah-title]", { type: "words", mask: "words" });
    gsap
      .timeline()
      .from(split.words, { yPercent: 110, duration: 1.2, stagger: 0.06 }, 0)
      .from("[data-ah-fade]", { autoAlpha: 0, y: 24, duration: 1, stagger: 0.08 }, 0.35)
      .from("[data-ah-row]", { scaleX: 0, transformOrigin: "left", duration: 1.2, stagger: 0.05 }, 0.2);
    // A scan line that sweeps the result rows: a visual cue for "crawling".
    gsap.fromTo("[data-ah-scan]", { yPercent: -100 }, { yPercent: 1100, duration: 4, ease: "none", repeat: -1, delay: 1 });
    return () => split.revert();
  });

  return (
    <section ref={root} className="relative isolate overflow-hidden pt-[calc(var(--header-h)+3rem)] pb-14 md:pt-[calc(var(--header-h)+5rem)] md:pb-20">
      {/* Decorative index of result rows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-[36vw] max-w-[36rem] overflow-hidden opacity-60 2xl:block">
        <div className="relative mt-[22vh] mr-[var(--gutter)] space-y-5">
          {[78, 54, 92, 61, 70, 44, 85, 58, 66, 50].map((w, i) => (
            <div key={i} data-ah-row className="space-y-1.5">
              <div className={`h-[5px] rounded-full ${i === 2 ? "bg-ember" : "bg-bone/10"}`} style={{ width: `${w}%` }} />
              <div className="h-[3px] rounded-full bg-bone/[0.05]" style={{ width: `${w * 0.6}%` }} />
            </div>
          ))}
          <div data-ah-scan className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-transparent via-ember/15 to-transparent" />
        </div>
      </div>

      <div className="wrap">
        <div className="flex items-center justify-between" data-ah-fade>
          <span className="t-label">
            <span className="ember">05</span> / {String(nav.length).padStart(2, "0")}
          </span>
          <span className="t-label hidden sm:inline">Free tool · No sign-up</span>
        </div>
        <div className="mt-10 max-w-[56rem] md:mt-14">
          <h1 data-ah-title className="text-[clamp(2.4rem,6vw,6.25rem)] leading-[0.95] font-extrabold tracking-[-0.04em]">
            Free Website SEO Audit Tool
          </h1>
          <p data-ah-fade className="mt-6 text-[clamp(1.4rem,2.8vw,2.4rem)] leading-[1.1] font-medium tracking-[-0.02em]">
            Discover What&apos;s Holding Your Website <span className="ember">Back.</span>
          </p>
          <p data-ah-fade className="t-lead mt-6 max-w-[40rem] text-bone-dim">
            Analyse your website&apos;s technical SEO, on-page optimisation, content quality, performance, and search visibility. Get actionable insights to improve your website&apos;s SEO
            health.
          </p>
          <div data-ah-fade className="mt-10">
            <AuditForm size="lg" />
            <AuditBadges className="mt-1" />
          </div>
        </div>
      </div>
    </section>
  );
}
