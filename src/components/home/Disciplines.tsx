"use client";

import { useEffect, useId, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Reveal, SplitReveal } from "@/components/ui/motion";
import { SectionLabel } from "@/components/ui/Buttons";
import { DisciplineIcon } from "./DisciplineIcon";
import { disciplines, type Discipline } from "@/content/home";
import { TLink } from "@/components/ui/TLink";
import { serviceBySlug, servicePath, type ServiceSlug } from "@/content/services";

/** India service pages that go deeper on each discipline. */
const SERVICE_LINKS: Record<Discipline["id"], ServiceSlug[]> = {
  search: ["seo-specialist", "technical-seo"],
  ai: ["geo-specialist", "answer-engine-optimization"],
  local: ["local-seo"],
  paid: ["google-ads", "meta-ads"],
  build: ["web-development", "digital-marketing"],
};

/**
 * Five disciplines as an editorial index. Each row opens to show what it covers and one
 * line of proof. The large stage icon on the left follows whichever row is in focus.
 * Fully keyboard- and touch-operable: rows are real buttons with aria-expanded.
 */
export function Disciplines() {
  const [open, setOpen] = useState(0);
  const [focus, setFocus] = useState(0);
  const uid = useId();

  return (
    <section aria-labelledby="disciplines-title" className="section relative">
      <div className="wrap grid-12 gap-y-10">
        <div className="col-span-4 md:col-span-12">
          <SectionLabel index="02">Disciplines</SectionLabel>
        </div>
        <SplitReveal as="h2" id="disciplines-title" className="t-h2 col-span-4 max-w-[22ch] md:col-span-10">
          Five ways I help a business get found, chosen and contacted.
        </SplitReveal>
      </div>

      <div className="wrap grid-12 mt-10 md:mt-14">
        {/* Sticky stage icon (desktop) */}
        <div className="col-span-4 hidden md:col-span-4 md:block">
          <div className="sticky top-[calc(var(--header-h)+3rem)]">
            <div className="relative grid aspect-square w-full max-w-[22rem] place-items-center border border-line [perspective:600px]">
              {disciplines.map((d, i) => (
                <div key={d.id} className="absolute inset-0 grid place-items-center transition-opacity duration-500" style={{ opacity: focus === i ? 1 : 0 }}>
                  <DisciplineIcon id={d.id} active={focus === i} className="w-1/2 text-bone" />
                </div>
              ))}
              <span className="t-label absolute top-4 left-4">{disciplines[focus].index} / 05</span>
              <span className="t-label absolute right-4 bottom-4 max-w-[70%] text-right">{disciplines[focus].kicker}</span>
              {/* Corner ticks */}
              {["top-0 left-0", "top-0 right-0 rotate-90", "bottom-0 right-0 rotate-180", "bottom-0 left-0 -rotate-90"].map((c) => (
                <span key={c} aria-hidden="true" className={`absolute h-3 w-3 border-t border-l border-ember ${c}`} />
              ))}
            </div>
          </div>
        </div>

        <Reveal as="ul" childrenStagger y={30} className="col-span-4 border-t border-line md:col-span-8">
          {disciplines.map((d, i) => (
            <Row
              key={d.id}
              d={d}
              open={open === i}
              id={`${uid}-${d.id}`}
              onToggle={() => {
                setOpen(open === i ? -1 : i);
                setFocus(i);
              }}
              onFocus={() => setFocus(i)}
            />
          ))}
        </Reveal>
      </div>
    </section>
  );
}

function Row({
  d,
  open,
  id,
  onToggle,
  onFocus,
}: {
  d: (typeof disciplines)[number];
  open: boolean;
  id: string;
  onToggle: () => void;
  onFocus: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const instant = first.current || prefersReducedMotion();
    first.current = false;
    gsap.to(el, { height: open ? "auto" : 0, duration: instant ? 0 : 0.8, ease: "cine" });
    if (open && !instant) gsap.fromTo(el.querySelectorAll("[data-in]"), { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.05, duration: 0.8, delay: 0.1 });
  }, [open]);

  return (
    <li className="border-b border-line" onPointerEnter={onFocus}>
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          id={`${id}-btn`}
          onClick={onToggle}
          onFocus={onFocus}
          className="group flex w-full items-center gap-4 py-6 text-left md:gap-8 md:py-8"
        >
          <span aria-hidden="true" className="t-label w-8 shrink-0 ember">{d.index}</span>
          <span className="grid h-10 w-10 shrink-0 place-items-center md:hidden">
            <DisciplineIcon id={d.id} active={open} className="w-full text-bone" />
          </span>
          <span
            className={`flex-1 text-[clamp(1.6rem,3.6vw,3.4rem)] leading-none font-semibold tracking-[-0.025em] transition-[color,font-stretch] duration-500 ${open ? "text-bone" : "text-bone-dim group-hover:text-bone"}`}
            style={{ fontStretch: open ? "115%" : "100%" }}
          >
            {d.title}
          </span>
          <span aria-hidden="true" className="relative h-4 w-4 shrink-0">
            <span className="absolute top-1/2 left-0 h-px w-full bg-bone" />
            <span className={`absolute top-0 left-1/2 h-full w-px bg-bone transition-transform duration-500 ${open ? "scale-y-0" : ""}`} />
          </span>
        </button>
      </h3>
      <div ref={panel} id={`${id}-panel`} role="region" aria-labelledby={`${id}-btn`} className="overflow-hidden" style={{ height: 0 }}>
        <div className="grid gap-8 pb-10 pl-12 md:grid-cols-2 md:pl-16">
          <div>
            <p data-in className="t-label mb-3">{d.kicker}</p>
            <p data-in className="t-body text-[1.02rem]">{d.body}</p>
            <p data-in className="mt-6 border-l border-ember pl-4 text-sm text-bone">{d.proof}</p>
            <p data-in className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <span className="t-label">Services in India</span>
              {SERVICE_LINKS[d.id].map((slug) => (
                <TLink key={slug} href={servicePath("india", slug)} className="link-u text-bone hover:text-ember" tabIndex={open ? 0 : -1}>
                  {serviceBySlug(slug)!.name} →
                </TLink>
              ))}
            </p>
          </div>
          <ul className="flex flex-wrap content-start gap-2">
            {d.items.map((it) => (
              <li data-in key={it} className="rounded-full border border-line-2 px-3.5 py-1.5 text-sm text-bone-dim">
                {it}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}
