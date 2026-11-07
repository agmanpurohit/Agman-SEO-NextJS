"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useStage } from "@/components/ui/motion";
import { ButtonLink, ButtonA } from "@/components/ui/Buttons";
import { closing } from "@/content/home";
import { site } from "@/content/site";
import { Logo } from "@/components/brand/Logo";

/** Closing composition: the question, the answer, and a door to the contact page. */
export function Closing({ label = closing.label, headline = closing.headline, body = closing.body }: { label?: string; headline?: readonly string[]; body?: string }) {
  const root = useRef<HTMLElement>(null);
  useStage(root, (reduced) => {
    if (reduced) return;
    gsap.from("[data-cl]", { yPercent: 110, duration: 1.3, stagger: 0.12, scrollTrigger: { trigger: root.current, start: "top 70%", once: true } });
    gsap.from("[data-cl-fade]", { autoAlpha: 0, y: 30, duration: 1, stagger: 0.1, scrollTrigger: { trigger: root.current, start: "top 60%", once: true } });
    gsap.fromTo("[data-cl-mark]", { rotate: -12, scale: 0.8 }, { rotate: 0, scale: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom bottom", scrub: true } });
  });

  return (
    <section ref={root} aria-labelledby="closing-title" className="relative overflow-hidden border-t border-line py-20 md:py-28">
      <div aria-hidden="true" data-cl-mark className="pointer-events-none absolute -right-[10vw] top-1/2 w-[55vw] -translate-y-1/2 text-bone/[0.035] md:w-[40vw]">
        <Logo variant="mark" title={null} accent={false} className="w-full" />
      </div>
      <div className="wrap relative">
        <p className="t-label mb-8" data-cl-fade>
          <span className="ember">●</span> {label}
        </p>
        <h2 id="closing-title" className="text-[clamp(2.3rem,6.4vw,7.5rem)] leading-[0.95] font-bold tracking-[-0.035em]" style={{ fontStretch: "105%" }}>
          {headline.map((l, i) => (
            <span key={i} className="block overflow-hidden pb-[0.06em]">
              <span data-cl className="block">
                {i === headline.length - 1 ? (
                  <>
                    {l.replace(/\?$/, "")}
                    <span className="ember">{l.endsWith("?") ? "?" : ""}</span>
                  </>
                ) : (
                  l
                )}
              </span>
              {/* Lines are separate blocks visually; the space keeps words apart for screen readers and AI agents. */}
              {i < headline.length - 1 && " "}
            </span>
          ))}
        </h2>
        <div className="grid-12 mt-12 gap-y-8 md:mt-16">
          <p className="t-lead col-span-4 max-w-[36rem] md:col-span-6" data-cl-fade>
            {body}
          </p>
          <div className="col-span-4 flex flex-wrap items-end gap-3 md:col-span-5 md:col-start-8 md:justify-end" data-cl-fade>
            <ButtonLink href={closing.primary.href} cursor="Say hello">
              {closing.primary.label}
            </ButtonLink>
            <ButtonA href={site.cv} download arrow="down">
              Download CV
            </ButtonA>
          </div>
        </div>
      </div>
    </section>
  );
}
