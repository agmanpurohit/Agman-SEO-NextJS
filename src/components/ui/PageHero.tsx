"use client";

import { useRef, type ReactNode } from "react";
import { gsap, SplitText } from "@/lib/gsap";
import { useStage } from "@/components/ui/motion";
import { nav } from "@/content/site";

/**
 * Shared opening for Experience, Work and Contact: page index, an oversized title that
 * sets character by character, a short display line and an introduction.
 */
export function PageHero({
  index,
  title,
  display,
  children,
  aside,
}: {
  index: string;
  title: string;
  display: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  const root = useRef<HTMLElement>(null);
  useStage(root, (reduced) => {
    if (reduced) return;
    const split = SplitText.create("[data-ph-title]", { type: "chars", charsClass: "inline-block", aria: "none" });
    const tl = gsap.timeline();
    tl.from(split.chars, { yPercent: 105, duration: 1.3, stagger: 0.035 }, 0)
      .from("[data-ph-fade]", { autoAlpha: 0, y: 24, duration: 1, stagger: 0.08 }, 0.4)
      .from("[data-ph-rule]", { scaleX: 0, transformOrigin: "left", duration: 1.4 }, 0.3);
    gsap.to("[data-ph-title]", { fontStretch: "70%", ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
    return () => split.revert();
  });

  return (
    <section ref={root} className="relative pt-[calc(var(--header-h)+3rem)] pb-16 md:pt-[calc(var(--header-h)+5rem)] md:pb-24">
      <div className="wrap">
        <div className="flex items-center justify-between" data-ph-fade>
          <span className="t-label">
            <span className="ember">{index}</span> / {String(nav.length).padStart(2, "0")}
          </span>
          <span className="t-label hidden sm:inline">Agman Rajpurohit — Index</span>
        </div>
        <h1 className="mt-10 md:mt-14">
          <span data-ph-title className="block overflow-hidden whitespace-nowrap text-[min(12.2vw,15rem)] leading-[0.82] font-extrabold tracking-[-0.045em] uppercase" style={{ fontStretch: "100%" }}>
            {title}
          </span>
          <span className="sr-only"> — </span>
          <span data-ph-fade className="mt-6 block max-w-[24ch] text-[clamp(1.6rem,3.4vw,3.2rem)] leading-[1.05] font-medium tracking-[-0.025em] text-bone md:mt-8">
            {display}
          </span>
        </h1>
        <div data-ph-rule className="hairline mt-12 md:mt-16" />
        <div className="grid-12 mt-8 gap-y-6">
          <div className="t-lead col-span-4 text-bone-dim md:col-span-7" data-ph-fade>
            {children}
          </div>
          {aside && (
            <div className="col-span-4 md:col-span-4 md:col-start-9" data-ph-fade>
              {aside}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
