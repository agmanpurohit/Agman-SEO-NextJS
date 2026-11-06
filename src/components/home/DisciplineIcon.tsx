"use client";

import { useEffect, useRef } from "react";
import { gsap, isFinePointer, prefersReducedMotion } from "@/lib/gsap";
import type { Discipline } from "@/content/home";

/**
 * Animated line icons, one per discipline. Each has a resting state and an "active"
 * state that tells a tiny story (the lens scans results, the pin pings, bars climb...).
 * They also tilt toward the pointer on desktop.
 */
export function DisciplineIcon({ id, active, className = "" }: { id: Discipline["id"]; active: boolean; className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const q = gsap.utils.selector(el);
    const t = gsap.timeline({ paused: true, defaults: { ease: "cine", duration: 0.9 } });
    switch (id) {
      case "search":
        t.fromTo(q("[data-l]"), { scaleX: 0.25, transformOrigin: "left center" }, { scaleX: 1, stagger: 0.08 }, 0)
          .to(q("[data-lens]"), { x: 10, y: 8, duration: 1.2 }, 0)
          .fromTo(q("[data-hit]"), { scale: 0, transformOrigin: "center" }, { scale: 1, duration: 0.6, ease: "back.out(3)" }, 0.5);
        break;
      case "ai":
        t.to(q("[data-spark]"), { rotate: 90, scale: 1.15, transformOrigin: "50% 50%", duration: 1.2 }, 0)
          .fromTo(q("[data-link]"), { strokeDashoffset: 40 }, { strokeDashoffset: 0, stagger: 0.1 }, 0.1)
          .fromTo(q("[data-node]"), { scale: 0.4, transformOrigin: "center" }, { scale: 1, stagger: 0.08, ease: "back.out(3)" }, 0.2);
        break;
      case "local":
        t.to(q("[data-pin]"), { y: -6, duration: 0.6, ease: "power2.out" }, 0)
          .to(q("[data-pin]"), { y: 0, duration: 0.8, ease: "bounce.out" }, 0.6)
          .fromTo(q("[data-ring]"), { scale: 0.3, opacity: 1, transformOrigin: "center" }, { scale: 1.2, opacity: 0, stagger: 0.25, duration: 1.4, ease: "power2.out" }, 0.5);
        break;
      case "paid":
        t.fromTo(q("[data-bar]"), { scaleY: 0.3, transformOrigin: "bottom" }, { scaleY: 1, stagger: 0.1 }, 0)
          .fromTo(q("[data-trend]"), { strokeDashoffset: 60 }, { strokeDashoffset: 0, duration: 1.1 }, 0.2);
        break;
      case "build":
        t.to(q("[data-bl]"), { x: -5 }, 0)
          .to(q("[data-br]"), { x: 5 }, 0)
          .fromTo(q("[data-caret]"), { opacity: 0 }, { opacity: 1, repeat: 3, yoyo: true, duration: 0.3, ease: "steps(1)" }, 0.3);
        break;
    }
    tl.current = t;
    return () => {
      t.kill();
    };
  }, [id]);

  useEffect(() => {
    const t = tl.current;
    if (!t) return;
    if (prefersReducedMotion()) {
      t.progress(active ? 1 : 0);
      return;
    }
    if (active) t.timeScale(1).play();
    else t.timeScale(1.6).reverse();
  }, [active]);

  // Cursor-responsive tilt.
  useEffect(() => {
    const el = svg.current;
    if (!el || !isFinePointer() || prefersReducedMotion()) return;
    const host = el.parentElement!;
    const rx = gsap.quickTo(el, "rotationY", { duration: 0.6 });
    const ry = gsap.quickTo(el, "rotationX", { duration: 0.6 });
    const move = (e: PointerEvent) => {
      const b = host.getBoundingClientRect();
      rx(((e.clientX - b.left) / b.width - 0.5) * 30);
      ry(-((e.clientY - b.top) / b.height - 0.5) * 30);
    };
    const leave = () => {
      rx(0);
      ry(0);
    };
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    return () => {
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
    };
  }, []);

  const stroke = { stroke: "currentColor", strokeWidth: 1.4, fill: "none", vectorEffect: "non-scaling-stroke" as const, strokeLinecap: "round" as const };
  const ember = "var(--color-ember)";

  return (
    <svg ref={svg} viewBox="0 0 64 64" className={className} aria-hidden="true" style={{ transformStyle: "preserve-3d" }}>
      {id === "search" && (
        <>
          <line data-l x1="10" y1="18" x2="40" y2="18" {...stroke} opacity="0.5" />
          <line data-l x1="10" y1="26" x2="34" y2="26" {...stroke} opacity="0.5" />
          <line data-l x1="10" y1="34" x2="38" y2="34" {...stroke} opacity="0.5" />
          <g data-lens>
            <circle cx="28" cy="26" r="13" {...stroke} />
            <line x1="37.5" y1="35.5" x2="50" y2="48" {...stroke} strokeWidth={2.4} />
            <circle data-hit cx="28" cy="26" r="2.6" fill={ember} />
          </g>
        </>
      )}
      {id === "ai" && (
        <>
          <path data-link d="M32 32 L12 14" {...stroke} strokeDasharray="40" opacity="0.6" />
          <path data-link d="M32 32 L52 16" {...stroke} strokeDasharray="40" opacity="0.6" />
          <path data-link d="M32 32 L50 50" {...stroke} strokeDasharray="40" opacity="0.6" />
          <path data-link d="M32 32 L14 48" {...stroke} strokeDasharray="40" opacity="0.6" />
          <circle data-node cx="12" cy="14" r="2.4" {...stroke} />
          <circle data-node cx="52" cy="16" r="2.4" {...stroke} />
          <circle data-node cx="50" cy="50" r="2.4" {...stroke} />
          <circle data-node cx="14" cy="48" r="2.4" {...stroke} />
          <path data-spark d="M32 20 C33 28 36 31 44 32 C36 33 33 36 32 44 C31 36 28 33 20 32 C28 31 31 28 32 20 Z" fill={ember} />
        </>
      )}
      {id === "local" && (
        <>
          <ellipse data-ring cx="32" cy="50" rx="20" ry="6" {...stroke} opacity="0" />
          <ellipse data-ring cx="32" cy="50" rx="20" ry="6" {...stroke} opacity="0" />
          <ellipse cx="32" cy="50" rx="9" ry="2.6" {...stroke} opacity="0.5" />
          <g data-pin>
            <path d="M32 48 C24 38 20 32 20 25 a12 12 0 0 1 24 0 c0 7 -4 13 -12 23Z" {...stroke} />
            <circle cx="32" cy="25" r="4" fill={ember} />
          </g>
        </>
      )}
      {id === "paid" && (
        <>
          <line x1="10" y1="52" x2="54" y2="52" {...stroke} opacity="0.5" />
          <rect data-bar x="14" y="36" width="7" height="16" {...stroke} />
          <rect data-bar x="28" y="28" width="7" height="24" {...stroke} />
          <rect data-bar x="42" y="18" width="7" height="34" fill={ember} />
          <path data-trend d="M10 40 L24 30 L34 33 L52 12" {...stroke} strokeDasharray="60" />
          <path d="M46 12 H52 V18" {...stroke} />
        </>
      )}
      {id === "build" && (
        <>
          <path data-bl d="M22 18 L10 32 L22 46" {...stroke} strokeWidth={2} />
          <path data-br d="M42 18 L54 32 L42 46" {...stroke} strokeWidth={2} />
          <line x1="36" y1="16" x2="28" y2="48" {...stroke} opacity="0.5" />
          <rect data-caret x="30" y="30" width="5" height="9" fill={ember} />
        </>
      )}
    </svg>
  );
}
