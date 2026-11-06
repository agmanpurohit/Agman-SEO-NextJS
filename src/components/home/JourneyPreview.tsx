"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useStage, SplitReveal } from "@/components/ui/motion";
import { SectionLabel, ButtonLink } from "@/components/ui/Buttons";
import { roles } from "@/content/experience";

/** Condensed career timeline; the ember line draws as you scroll through it. */
export function JourneyPreview() {
  const root = useRef<HTMLElement>(null);
  useStage(root, (reduced) => {
    if (reduced) return;
    gsap.fromTo("[data-line]", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: "[data-list]", start: "top 70%", end: "bottom 60%", scrub: true } });
    gsap.utils.toArray<HTMLElement>("[data-item]").forEach((it) => {
      gsap.from(it, { x: 40, autoAlpha: 0, duration: 1.1, scrollTrigger: { trigger: it, start: "top 85%", once: true } });
      gsap.fromTo(it.querySelector("[data-dot]"), { backgroundColor: "#3a3a40" }, { backgroundColor: "#ff5a1f", scrollTrigger: { trigger: it, start: "top 65%", toggleActions: "play none none reverse" } });
    });
  });

  return (
    <section ref={root} aria-labelledby="journey-title" className="section">
      <div className="wrap grid-12 gap-y-12">
        <div className="col-span-4 md:col-span-5">
          <SectionLabel index="05" className="mb-6">Journey</SectionLabel>
          <SplitReveal as="h2" id="journey-title" className="t-h2">
            Three companies. One direction: search.
          </SplitReveal>
          <p className="t-body mt-6 max-w-[30rem]">
            From process operations into SEO, then into agency work at scale and international search for a financial-services brand. Now based in Dubai.
          </p>
          <div className="mt-10">
            <ButtonLink href="/experience" variant="ghost">
              Full experience
            </ButtonLink>
          </div>
        </div>

        <ol data-list className="relative col-span-4 md:col-span-6 md:col-start-7">
          <span aria-hidden="true" className="absolute top-2 bottom-2 left-[5px] w-px bg-line" />
          <span data-line aria-hidden="true" className="absolute top-2 bottom-2 left-[5px] w-px origin-top bg-ember" />
          {roles.map((r) => (
            <li key={r.slug} data-item className="relative pb-12 pl-10 last:pb-0">
              <span data-dot aria-hidden="true" className="absolute top-2 left-0 h-[11px] w-[11px] rounded-full border-2 border-ink bg-line-2" />
              <p className="t-label">
                {r.positions[r.positions.length - 1].start} — {r.positions[0].end}
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{r.company}</h3>
              <p className="mt-1 text-bone-dim">
                {[...r.positions].reverse().map((p) => p.title).join(" → ")}
                {r.descriptor ? ` · ${r.descriptor}` : ""}
              </p>
              {r.highlights.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                  {r.highlights.map((h) => (
                    <li key={h.label} className="text-sm">
                      <span className="font-semibold text-bone">{h.value}</span> <span className="text-bone-dim">{h.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
