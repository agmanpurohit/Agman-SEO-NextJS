"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useStage, SplitReveal } from "@/components/ui/motion";
import { SectionLabel, ButtonLink } from "@/components/ui/Buttons";
import { TLink } from "@/components/ui/TLink";
import { CaseCover } from "@/components/work/CaseCover";
import { cases } from "@/content/work";

const featured = cases.filter((c) => c.featured);

/**
 * Selected work. On large screens the section pins and the cases travel horizontally
 * with scroll; below that it becomes a simple vertical list (no hijacked scrolling).
 */
export function SelectedWork() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useStage(root, (reduced) => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      if (reduced) return;
      const t = track.current!;
      const distance = () => t.scrollWidth - window.innerWidth;
      const tween = gsap.to(t, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          anticipatePin: 1,
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });
      // Each cover parallaxes inside its frame as it travels.
      gsap.utils.toArray<HTMLElement>("[data-cover-bg]").forEach((c) => {
        gsap.fromTo(c, { xPercent: -6 }, { xPercent: 6, ease: "none", scrollTrigger: { trigger: c.closest("article"), containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
      });
    });
    mm.add("(max-width: 1023px)", () => {
      if (reduced) return;
      gsap.utils.toArray<HTMLElement>("[data-card]").forEach((card) => {
        gsap.from(card, { y: 60, autoAlpha: 0, duration: 1.2, scrollTrigger: { trigger: card, start: "top 90%", once: true } });
      });
    });
    return () => mm.revert();
  });

  // The outer div belongs to React; GSAP's pin-spacer is inserted inside it, so React can
  // always remove this block cleanly on route changes.
  return (
    <div>
    <section ref={root} aria-labelledby="work-title" className="relative overflow-hidden py-16 lg:flex lg:h-[100svh] lg:flex-col lg:justify-center lg:py-0">
      <div className="wrap mb-12 flex flex-col gap-6 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <SectionLabel index="04" className="mb-6">Selected work</SectionLabel>
          <SplitReveal as="h2" id="work-title" className="t-h2 max-w-[18ch]">
            Proof, not promises.
          </SplitReveal>
        </div>
        <div className="hidden lg:block">
          <ButtonLink href="/work" variant="ghost">
            All case studies
          </ButtonLink>
        </div>
      </div>

      <div ref={track} className="flex flex-col gap-14 px-[var(--gutter)] lg:w-max lg:flex-row lg:gap-8">
        {featured.map((c, i) => (
          <article key={c.slug} data-card className="group lg:w-[min(62vw,58rem)]">
            <TLink href={`/work?case=${c.slug}`} className="block" data-cursor="View case" aria-label={`${c.client ? `${c.client.name}: ` : ""}${c.title} — ${c.industry}. View case study`}>
              <div className="relative aspect-[16/10] overflow-hidden lg:aspect-auto lg:h-[52svh]">
                <div className="absolute inset-0 transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-[1.03]">
                  <CaseCover c={c} />
                </div>
                <span className="absolute inset-0 border border-line transition-colors duration-500 group-hover:border-ember/60" />
              </div>
              <div className="mt-5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2">
                <span className="t-label pt-1.5 ember">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="t-h3">{c.title}</h3>
                <span />
                <p className="t-label !normal-case !tracking-normal text-sm">
                  {c.client ? `${c.client.name} · ` : ""}
                  {c.industry}
                </p>
              </div>
            </TLink>
          </article>
        ))}
        <div className="flex items-center lg:w-[28vw] lg:justify-center">
          <TLink href="/work" className="group flex flex-col gap-4" data-cursor="Open">
            <span className="t-label">{cases.length} case studies</span>
            <span className="text-[clamp(2.2rem,4vw,4rem)] leading-none font-semibold tracking-tight transition-[font-stretch] duration-700 group-hover:[font-stretch:120%]">
              See all
              <br />
              the work <span className="ember">→</span>
            </span>
          </TLink>
        </div>
      </div>
    </section>
    </div>
  );
}
