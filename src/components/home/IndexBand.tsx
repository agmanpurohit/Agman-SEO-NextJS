"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useStage } from "@/components/ui/motion";

const TERMS = ["Technical SEO", "GEO", "AEO", "Local SEO", "International SEO", "Google Ads", "Meta Ads", "WordPress", "Schema", "Core Web Vitals"];

/** A slow ticker of disciplines that speeds up and reverses with scroll velocity. */
export function IndexBand() {
  const root = useRef<HTMLDivElement>(null);
  useStage(root, (reduced) => {
    if (reduced) return;
    const track = root.current!.querySelector<HTMLElement>("[data-track]")!;
    const loop = gsap.to(track, { xPercent: -50, duration: 40, ease: "none", repeat: -1 });
    const st = ScrollTrigger.create({
      onUpdate: (self) => {
        const dir = self.direction < 0 ? -1 : 1;
        const boost = 1 + Math.min(4, Math.abs(self.getVelocity()) / 500);
        gsap.to(loop, {
          timeScale: dir * boost,
          duration: 0.2,
          overwrite: true,
          onComplete: () => void gsap.to(loop, { timeScale: dir, duration: 1.2 }),
        });
      },
    });
    return () => {
      st.kill();
      loop.kill();
    };
  });

  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {TERMS.map((t) => (
        <li key={t} className="flex items-center">
          <span className="px-6 text-[clamp(1.4rem,3vw,2.6rem)] font-medium tracking-tight whitespace-nowrap text-bone-dim md:px-10" style={{ fontStretch: "118%" }}>
            {t}
          </span>
          <span className="h-1.5 w-1.5 rotate-45 bg-ember" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );

  return (
    <div ref={root} className="relative overflow-hidden border-y border-line py-6 md:py-8">
      <h2 className="sr-only">Specialisms</h2>
      <div data-track className="flex w-max">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
