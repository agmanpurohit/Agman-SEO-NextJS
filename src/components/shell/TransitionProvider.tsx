"use client";

import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { setStageReady } from "@/lib/stage";
import { scrollToTop } from "@/lib/scroll";
import { nav } from "@/content/site";

type Ctx = { go: (href: string) => void };
const TransitionContext = createContext<Ctx>({ go: () => {} });
export const useTransition = () => useContext(TransitionContext);

const labelFor = (href: string) => {
  const path = href.split(/[?#]/)[0] || "/";
  const item = nav.find((n) => n.href === path);
  return item ? { label: item.label, index: item.index } : { label: "", index: "" };
};

/**
 * Cinematic route changes: an ink curtain with a scan line sweeps up, the destination
 * name passes through, the route changes underneath, then the curtain lifts.
 */
export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const overlay = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const index = useRef<HTMLSpanElement>(null);
  const busy = useRef(false);
  const pending = useRef<null | (() => void)>(null);
  const firstPath = useRef(pathname);

  const reveal = useCallback(() => {
    const el = overlay.current;
    scrollToTop(true);
    // New page content has mounted; let triggers measure it before the curtain lifts.
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      setStageReady(true);
      if (!el || prefersReducedMotion()) {
        if (el) gsap.set(el, { autoAlpha: 0 });
        busy.current = false;
        return;
      }
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(el, { autoAlpha: 0 });
          busy.current = false;
        },
      });
      tl.to(el.querySelector("[data-pt-text]"), { yPercent: -60, autoAlpha: 0, duration: 0.5, ease: "wipe" }, 0)
        .to(el.querySelector("[data-pt-panel]"), { clipPath: "inset(0% 0% 100% 0%)", duration: 0.9, ease: "wipe" }, 0.05)
        .to(el.querySelector("[data-pt-line]"), { top: "0%", autoAlpha: 0, duration: 0.9, ease: "wipe" }, 0.05);
    });
  }, []);

  // Route actually changed → lift the curtain (or, for back/forward, just reset scroll).
  useEffect(() => {
    if (pathname === firstPath.current) return;
    firstPath.current = pathname;
    if (pending.current) {
      pending.current = null;
      reveal();
    } else {
      scrollToTop(true);
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }
  }, [pathname, reveal]);

  const go = useCallback(
    (href: string) => {
      const target = href.split(/[?#]/)[0] || "/";
      if (target === pathname) {
        if (href.includes("?") || href.includes("#")) router.push(href, { scroll: false });
        else scrollToTop();
        return;
      }
      if (busy.current) return;
      busy.current = true;
      const el = overlay.current;
      const { label: l, index: i } = labelFor(href);
      if (label.current) label.current.textContent = l;
      if (index.current) index.current.textContent = i;

      if (!el || prefersReducedMotion()) {
        setStageReady(false);
        pending.current = () => {};
        router.push(href, { scroll: false });
        return;
      }

      gsap.set(el, { autoAlpha: 1 });
      const panel = el.querySelector("[data-pt-panel]");
      const line = el.querySelector("[data-pt-line]");
      const text = el.querySelector("[data-pt-text]");
      gsap
        .timeline({
          onComplete: () => {
            setStageReady(false);
            pending.current = () => {};
            router.push(href, { scroll: false });
          },
        })
        .fromTo(panel, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.75, ease: "wipe" }, 0)
        .fromTo(line, { top: "100%", autoAlpha: 1 }, { top: "0%", duration: 0.75, ease: "wipe" }, 0)
        .fromTo(text, { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.6 }, 0.3);
    },
    [pathname, router],
  );

  // Prefetch every primary route so the curtain never waits on the network.
  useEffect(() => {
    nav.forEach((n) => router.prefetch(n.href));
  }, [router]);

  return (
    <TransitionContext.Provider value={{ go }}>
      {children}
      <div ref={overlay} className="pt" aria-hidden="true">
        <div data-pt-panel className="absolute inset-0 bg-ink-2" style={{ clipPath: "inset(100% 0% 0% 0%)" }} />
        <div data-pt-line className="absolute inset-x-0 h-px bg-ember" style={{ top: "100%" }} />
        <div data-pt-text className="absolute inset-0 grid place-items-center">
          <div className="flex items-baseline gap-4">
            <span ref={index} className="t-label ember" />
            <span ref={label} className="t-h2 uppercase" style={{ fontStretch: "120%" }} />
          </div>
        </div>
      </div>
    </TransitionContext.Provider>
  );
}
