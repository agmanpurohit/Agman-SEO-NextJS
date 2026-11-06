"use client";

import { useRef } from "react";
import { gsap, SplitText } from "@/lib/gsap";
import { useStage, Reveal } from "@/components/ui/motion";
import { SectionLabel } from "@/components/ui/Buttons";
import { approach } from "@/content/home";

/** Manifesto paragraph that "gets read" word by word as you scroll, like a crawler. */
export function Approach() {
  const root = useRef<HTMLElement>(null);
  useStage(root, (reduced) => {
    if (reduced) return;
    const p = root.current!.querySelector<HTMLElement>("[data-scrub]")!;
    const split = SplitText.create(p, { type: "words" });
    gsap.fromTo(
      split.words,
      { opacity: 0.14 },
      {
        opacity: 1,
        stagger: 0.1,
        ease: "none",
        scrollTrigger: { trigger: p, start: "top 78%", end: "bottom 45%", scrub: 0.5 },
      },
    );
    return () => split.revert();
  });

  return (
    <section ref={root} id="approach" aria-labelledby="approach-title" className="section">
      <div className="wrap grid-12 gap-y-10">
        <div className="col-span-4 md:col-span-3">
          <SectionLabel index="01">{approach.label}</SectionLabel>
          <h2 id="approach-title" className="sr-only">
            My approach to SEO and digital marketing
          </h2>
        </div>
        <p data-scrub className="col-span-4 text-[clamp(1.5rem,3.1vw,3.1rem)] leading-[1.18] font-medium tracking-[-0.02em] md:col-span-9">
          {approach.statement}
        </p>
      </div>

      <Reveal as="ol" childrenStagger className="wrap grid-12 mt-12 gap-y-10 md:mt-20">
        {approach.principles.map((p, i) => (
          <li key={p.title} className="col-span-4 border-t border-line pt-6 md:col-span-4">
            <span className="t-label ember">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="t-h3 mt-4">{p.title}</h3>
            <p className="t-body mt-3 max-w-[26rem]">{p.body}</p>
          </li>
        ))}
      </Reveal>
    </section>
  );
}
