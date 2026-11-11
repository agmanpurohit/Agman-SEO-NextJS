"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap, SplitText, isFinePointer } from "@/lib/gsap";
import { useStage } from "@/components/ui/motion";
import { ButtonA, ButtonLink } from "@/components/ui/Buttons";
import { hero } from "@/content/home";
import { site } from "@/content/site";
import { asset } from "@/lib/asset";
import { useSite } from "@/components/shell/SiteSettingsProvider";

/**
 * The opening shot. A low-key portrait lit by a movable "studio light" (the pointer on
 * desktop, a slow scripted sweep on touch). The photograph itself is never altered:
 * the effect is a brighter copy of the same image revealed through a soft mask.
 */
export function Hero() {
  const liveSite = useSite();
  const root = useRef<HTMLElement>(null);
  const portrait = useRef<HTMLDivElement>(null);

  // Pointer-driven light on desktop.
  useEffect(() => {
    const el = portrait.current;
    const section = root.current;
    if (!el || !section || !isFinePointer()) return;
    const state = { x: 52, y: 38 };
    const apply = () => {
      el.style.setProperty("--lx", `${state.x}%`);
      el.style.setProperty("--ly", `${state.y}%`);
    };
    const onMove = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      const x = ((e.clientX - b.left) / b.width) * 100;
      const y = ((e.clientY - b.top) / b.height) * 100;
      gsap.to(state, { x: gsap.utils.clamp(-10, 110, x), y: gsap.utils.clamp(-10, 110, y), duration: 1.2, ease: "power3.out", onUpdate: apply, overwrite: true });
    };
    section.addEventListener("pointermove", onMove);
    return () => section.removeEventListener("pointermove", onMove);
  }, []);

  useStage(root, (reduced) => {
    const el = portrait.current!;
    if (reduced) return;

    const lines = gsap.utils.toArray<HTMLElement>("[data-hero-line]");
    const splits = lines.map((l) => SplitText.create(l, { type: "chars", charsClass: "inline-block", aria: "none" }));
    const chars = splits.flatMap((s) => s.chars);

    const tl = gsap.timeline({ defaults: { ease: "cine" } });
    tl.fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "wipe" }, 0)
      .from(el.querySelectorAll("img"), { scale: 1.18, duration: 2.2 }, 0)
      .from(chars, { yPercent: 105, duration: 1.3, stagger: 0.028 }, 0.2)
      .from("[data-hero-fade]", { autoAlpha: 0, y: 24, duration: 1, stagger: 0.08 }, 0.7)
      .from("[data-hero-rule]", { scaleX: 0, transformOrigin: "left", duration: 1.4 }, 0.5);

    // Touch devices: one slow sweep of light across the face, then rest.
    if (!isFinePointer()) {
      const s = { x: 10, y: 20 };
      tl.to(
        s,
        {
          x: 52,
          y: 36,
          duration: 2.4,
          ease: "power2.inOut",
          onUpdate: () => {
            el.style.setProperty("--lx", `${s.x}%`);
            el.style.setProperty("--ly", `${s.y}%`);
          },
        },
        0.6,
      );
    }

    // Scroll: lines drift apart, portrait sinks and dims slightly.
    gsap.to("[data-hero-line='1']", { xPercent: -6, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
    gsap.to("[data-hero-line='2']", { xPercent: 8, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
    gsap.to(el, { yPercent: 12, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
    gsap.to("[data-hero-dim]", { opacity: 0.6, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });

    return () => splits.forEach((s) => s.revert());
  });

  return (
    <section ref={root} aria-labelledby="hero-title" className="relative isolate min-h-[100svh] overflow-hidden pt-[var(--header-h)]">
      {/* Portrait */}
      <div
        ref={portrait}
        className="absolute inset-x-0 top-[var(--header-h)] -z-10 mx-auto aspect-[4/5] w-full max-w-[34rem] sm:max-w-[30rem] md:right-[6vw] md:left-auto md:top-[calc(var(--header-h)+2vh)] md:h-[calc(100svh-var(--header-h)-6vh)] md:w-auto md:max-w-none lg:right-[12vw]"
        style={{ ["--lx" as string]: "52%", ["--ly" as string]: "38%" }}
      >
        <Image
          src={asset(site.photo)}
          alt="Portrait of Agman Rajpurohit"
          fill
          priority
          sizes="(min-width: 768px) 40vw, 100vw"
          className="object-cover object-[50%_30%]"
          style={{ filter: "brightness(0.62) contrast(1.05)" }}
        />
        <Image
          src={asset(site.photo)}
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="(min-width: 768px) 40vw, 100vw"
          className="object-cover object-[50%_30%]"
          style={{
            filter: "brightness(1.12) contrast(1.04)",
            WebkitMaskImage: "radial-gradient(circle 32vmax at var(--lx) var(--ly), #000 0%, rgba(0,0,0,0.55) 35%, transparent 70%)",
            maskImage: "radial-gradient(circle 32vmax at var(--lx) var(--ly), #000 0%, rgba(0,0,0,0.55) 35%, transparent 70%)",
          }}
        />
        {/* Blend the frame into the page */}
        <div data-hero-dim className="pointer-events-none absolute inset-0 bg-ink opacity-0" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink via-ink/70 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/3 bg-gradient-to-r from-ink to-transparent md:block" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-ink to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/5 bg-gradient-to-b from-ink to-transparent" />
        <span className="t-label absolute top-3 right-3 hidden !text-[0.6rem] md:block" data-hero-fade>
          Fig. 01 — Dubai, {new Date().getFullYear()}
        </span>
      </div>

      <div className="wrap flex min-h-[calc(100svh-var(--header-h))] flex-col">
        <div className="flex items-start justify-between pt-6 md:pt-10" data-hero-fade>
          <p className="t-label">{hero.eyebrow}</p>
          <p className="t-label hidden text-right sm:block">
            Index Nº 001
            <br />
            <span className="text-bone">{liveSite.availability}</span>
          </p>
        </div>

        <div className="mt-[52vw] flex flex-1 flex-col justify-end pb-8 sm:mt-[60vw] md:mt-0 md:pb-12">
          <p aria-hidden="true" className="t-display select-none">
            <span data-hero-line="1" className="block overflow-hidden whitespace-nowrap">
              Visibility,
            </span>
            <span data-hero-line="2" className="block overflow-hidden whitespace-nowrap pl-[4vw] md:pl-[6vw]">
              engineered<span className="ember">.</span>
            </span>
          </p>

          <div data-hero-rule className="hairline mt-8 md:mt-12" />

          <div className="grid-12 mt-6 gap-y-6 md:mt-8">
            <h1 id="hero-title" className="col-span-4 md:col-span-4" data-hero-fade>
              <span className="block text-xl font-semibold tracking-tight md:text-2xl">{site.name}</span>{" "}
              <span className="t-label mt-1 block">{site.role}</span>
              <span className="sr-only"> — {site.tagline}</span>
            </h1>
            <p className="t-body col-span-4 max-w-[38rem] text-[1.02rem] md:col-span-5 md:col-start-5" data-hero-fade>
              {hero.intro}
            </p>
            <div className="col-span-4 flex flex-wrap items-start gap-3 md:col-span-3 md:col-start-10 md:justify-end" data-hero-fade>
              <ButtonLink href={hero.primaryCta.href} cursor="Explore">
                {hero.primaryCta.label}
              </ButtonLink>
              <ButtonA href={site.cv} download arrow="down" cursor="PDF">
                {hero.secondaryCta.label}
              </ButtonA>
            </div>
          </div>
        </div>

        <a href="#approach" className="t-label absolute top-1/2 right-[calc(var(--gutter)/3)] hidden -translate-y-1/2 flex-col items-center gap-3 xl:flex" data-hero-fade aria-label="Scroll to the next section">
          <span className="[writing-mode:vertical-rl]">Scroll</span>
          <span className="relative block h-10 w-px overflow-hidden bg-line-2">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_2.2s_cubic-bezier(.76,0,.24,1)_infinite] bg-ember" />
          </span>
        </a>
      </div>
      <style>{`@keyframes scrollcue{0%{transform:translateY(-100%)}100%{transform:translateY(200%)}}`}</style>
    </section>
  );
}
