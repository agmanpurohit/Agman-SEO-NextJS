"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { setStageReady } from "@/lib/stage";
import { lockScroll } from "@/lib/scroll";
import { Logo } from "@/components/brand/Logo";

const KEY = "ar-seen";
const PHASES = ["Crawling", "Indexing", "Ranking"];

/**
 * First-visit loader: crawl → index → rank. Progress follows real readiness (fonts,
 * hero image, window load) with a short minimum so the reveal reads as intentional.
 * Shown once per browser session; skipped entirely for reduced motion.
 */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const html = document.documentElement;
    if (!el || html.hasAttribute("data-seen")) {
      setStageReady(true);
      return;
    }

    lockScroll(true);
    const counter = el.querySelector<HTMLElement>("[data-count]")!;
    const phase = el.querySelector<HTMLElement>("[data-phase]")!;
    const bar = el.querySelector<HTMLElement>("[data-bar]")!;
    const state = { p: 0 };
    let target = 0.15;
    let done = false;

    const ready = Promise.all([
      document.fonts?.ready ?? Promise.resolve(),
      new Promise<void>((r) => (document.readyState === "complete" ? r() : window.addEventListener("load", () => r(), { once: true }))),
    ]);
    const minTime = new Promise((r) => setTimeout(r, 1300));
    const maxTime = new Promise((r) => setTimeout(r, 2600));
    ready.then(() => (target = 0.7));
    Promise.race([Promise.all([ready, minTime]), maxTime]).then(() => (target = 1));

    // A context so cleanup (incl. React StrictMode's double effect) restores initial styles.
    const ctx = gsap.context(() => {
      gsap
        .timeline()
        .fromTo("[data-pl-mark]", { clipPath: "polygon(0 100%, 0 100%, 0 100%)" }, { clipPath: "polygon(0 100%, 0 -60%, 160% 100%)", duration: 1.2, ease: "wipe" }, 0)
        .from("[data-pl-name] > span", { yPercent: 110, stagger: 0.04, duration: 0.9 }, 0.25)
        .from("[data-pl-meta]", { autoAlpha: 0, duration: 0.6 }, 0.3);
    }, el);

    const tick = () => {
      state.p += (target - state.p) * 0.08;
      if (target === 1 && state.p > 0.995) state.p = 1;
      const pct = Math.round(state.p * 100);
      counter.textContent = String(pct).padStart(3, "0");
      bar.style.transform = `scaleX(${state.p})`;
      phase.textContent = PHASES[Math.min(2, Math.floor(state.p * 3))];
      if (state.p === 1 && !done) {
        done = true;
        gsap.ticker.remove(tick);
        exit();
      }
    };
    gsap.ticker.add(tick);

    function exit() {
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {}
      gsap
        .timeline({
          onComplete: () => {
            html.setAttribute("data-seen", "");
            lockScroll(false);
          },
        })
        .to("[data-pl-notch] [data-logo='accent']", { fill: "#ff5a1f", duration: 0.3 }, 0)
        .to("[data-pl-inner]", { yPercent: -8, autoAlpha: 0, duration: 0.7, ease: "wipe" }, 0.25)
        .add(() => setStageReady(true), 0.55)
        .to(el, { clipPath: "inset(0% 0% 100% 0%)", duration: 1, ease: "wipe" }, 0.45);
    }

    return () => {
      gsap.ticker.remove(tick);
      ctx.revert();
    };
  }, []);

  return (
    <div ref={root} className="preloader" aria-hidden="true" style={{ clipPath: "inset(0% 0% 0% 0%)" }}>
      <div data-pl-inner className="absolute inset-0 flex flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-7">
          <div data-pl-mark data-pl-notch className="w-24 text-bone md:w-32">
            <Logo variant="mark" title={null} accent={false} className="w-full" />
          </div>
          <div data-pl-name className="t-label flex overflow-hidden !text-bone" style={{ letterSpacing: "0.32em" }}>
            {"AGMAN RAJPUROHIT".split("").map((c, i) => (
              <span key={i} className="inline-block">
                {c === " " ? " " : c}
              </span>
            ))}
          </div>
        </div>
        <div data-pl-meta className="wrap flex items-end justify-between pb-8 md:pb-10">
          <div className="flex flex-col gap-1">
            <span className="t-label">Status</span>
            <span data-phase className="t-mono text-sm text-bone">
              Crawling
            </span>
          </div>
          <div className="t-mono text-[clamp(3rem,10vw,8rem)] leading-none font-light tabular-nums text-bone">
            <span data-count>000</span>
            <span className="ember text-[0.35em] align-top">%</span>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-line">
          <div data-bar className="h-full origin-left bg-ember" style={{ transform: "scaleX(0)" }} />
        </div>
      </div>
    </div>
  );
}
