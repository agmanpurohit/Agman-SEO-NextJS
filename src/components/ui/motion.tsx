"use client";

import { useEffect, useRef, type ElementType, type ReactNode, type ComponentPropsWithoutRef } from "react";
import { gsap, ScrollTrigger, SplitText, prefersReducedMotion } from "@/lib/gsap";
import { onStageReady } from "@/lib/stage";

/**
 * Runs `build` inside a GSAP context once the stage is ready (after the preloader or
 * page transition). Everything it creates is reverted on unmount.
 */
export function useStage(
  scope: React.RefObject<HTMLElement | null>,
  build: (reduced: boolean) => void | (() => void),
  deps: unknown[] = [],
) {
  useEffect(() => {
    let ctx: gsap.Context | null = null;
    const off = onStageReady(() => {
      ctx = gsap.context(() => build(prefersReducedMotion()), scope.current ?? undefined);
    });
    return () => {
      off();
      ctx?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

type RevealProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  y?: number;
  delay?: number;
  stagger?: number;
  /** Animate direct children one after another instead of the wrapper. */
  childrenStagger?: boolean;
  start?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children">;

/** Fades and lifts content into view on scroll. Content is visible without JS. */
export function Reveal<T extends ElementType = "div">({
  as,
  children,
  y = 40,
  delay = 0,
  stagger = 0.08,
  childrenStagger,
  start = "top 88%",
  ...rest
}: RevealProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement>(null);
  useStage(ref, (reduced) => {
    const el = ref.current!;
    const targets = childrenStagger ? Array.from(el.children) : el;
    if (reduced) {
      gsap.set(el, { opacity: 1 });
      return;
    }
    gsap.set(el, { opacity: 1 });
    gsap.from(targets, {
      y,
      autoAlpha: 0,
      duration: 1.2,
      delay,
      stagger,
      scrollTrigger: { trigger: el, start, once: true },
    });
  });
  return (
    <Tag ref={ref} data-reveal="" {...rest}>
      {children}
    </Tag>
  );
}

type SplitProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  /** "intro" plays as soon as the stage is ready; "scroll" waits until in view. */
  trigger?: "intro" | "scroll";
  delay?: number;
  type?: "lines" | "words" | "chars";
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

/** Masked line/word/character reveal built on GSAP SplitText (keeps an accessible label). */
export function SplitReveal<T extends ElementType = "h2">({
  as,
  children,
  trigger = "scroll",
  delay = 0,
  type = "lines",
  className,
  ...rest
}: SplitProps<T>) {
  const Tag = (as ?? "h2") as ElementType;
  const ref = useRef<HTMLElement>(null);
  useStage(ref, (reduced) => {
    const el = ref.current!;
    gsap.set(el, { opacity: 1 });
    if (reduced) return;
    const split = SplitText.create(el, {
      type: type === "lines" ? "lines" : type === "words" ? "lines,words" : "lines,words,chars",
      mask: "lines",
      linesClass: "split-line",
      autoSplit: true,
      onSplit(self) {
        const targets = type === "lines" ? self.lines : type === "words" ? self.words : self.chars;
        return gsap.from(targets, {
          yPercent: 110,
          duration: type === "chars" ? 1 : 1.25,
          stagger: type === "chars" ? 0.025 : type === "words" ? 0.04 : 0.1,
          delay,
          scrollTrigger: trigger === "scroll" ? { trigger: el, start: "top 88%", once: true } : undefined,
        });
      },
    });
    return () => split.revert();
  });
  return (
    <Tag ref={ref} data-reveal="" className={className} {...rest}>
      {children}
    </Tag>
  );
}

/**
 * Scroll-linked width: the headline condenses / stretches as it travels through the
 * viewport, using Archivo's variable width axis.
 */
export function Stretch({ children, from = 125, to = 75, className, as }: { children: ReactNode; from?: number; to?: number; className?: string; as?: ElementType }) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement>(null);
  useStage(ref, (reduced) => {
    if (reduced) return;
    gsap.fromTo(
      ref.current,
      { fontStretch: `${from}%` },
      {
        fontStretch: `${to}%`,
        ease: "none",
        scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: 0.6 },
      },
    );
  });
  return (
    <Tag ref={ref} className={className} style={{ fontStretch: `${(from + to) / 2}%` }}>
      {children}
    </Tag>
  );
}

/** Counts up to a number when scrolled into view. Renders the final value server-side. */
export function Counter({ value, prefix = "", suffix = "", className }: { value: number; prefix?: string; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useStage(ref, (reduced) => {
    if (reduced) return;
    const el = ref.current!;
    const state = { v: 0 };
    el.textContent = `${prefix}0${suffix}`;
    gsap.to(state, {
      v: value,
      duration: 2,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
      onUpdate: () => {
        el.textContent = `${prefix}${Math.round(state.v)}${suffix}`;
      },
    });
  });
  return (
    <span ref={ref} className={className}>
      {prefix}
      {value}
      {suffix}
    </span>
  );
}

/** Refresh ScrollTrigger after images/fonts settle so pinned sections measure correctly. */
export function useRefreshOnLoad() {
  useEffect(() => {
    const r = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(r);
    window.addEventListener("load", r);
    return () => window.removeEventListener("load", r);
  }, []);
}
