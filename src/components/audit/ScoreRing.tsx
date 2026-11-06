"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

export const scoreTone = (v: number | null) => (v == null ? "var(--color-mute)" : v >= 80 ? "#4fd18b" : v >= 50 ? "#f0b64a" : "var(--color-ember)");
export const scoreWord = (v: number | null) => (v == null ? "Not scored" : v >= 80 ? "Good" : v >= 50 ? "Needs work" : "Poor");

/** Animated circular score. The number counts up once when it enters the viewport. */
export function ScoreRing({ value, size = 160, stroke = 10, label }: { value: number | null; size?: number; stroke?: number; label?: string }) {
  const arc = useRef<SVGCircleElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const target = value ?? 0;

  useEffect(() => {
    const a = arc.current;
    const n = num.current;
    if (!a || !n) return;
    if (prefersReducedMotion() || value == null) {
      a.style.strokeDashoffset = String(circ * (1 - target / 100));
      return;
    }
    const st = { v: 0 };
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      gsap.to(st, {
        v: target,
        duration: 1.6,
        ease: "power3.out",
        onUpdate: () => {
          n.textContent = String(Math.round(st.v));
          a.style.strokeDashoffset = String(circ * (1 - st.v / 100));
        },
      });
    });
    io.observe(a);
    return () => io.disconnect();
  }, [target, circ, value]);

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${label ?? "Score"}: ${value ?? "not scored"} out of 100`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
        <circle
          ref={arc}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={scoreTone(value)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={value == null ? circ : prefersReducedMotionSafe() ? circ * (1 - target / 100) : circ}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
        <span ref={num} className="leading-none font-light tracking-[-0.04em] tabular-nums" style={{ fontSize: size * 0.32 }}>
          {value == null ? "–" : prefersReducedMotionSafe() ? value : 0}
        </span>
        <span className="t-label mt-1 !text-[0.6rem]">/ 100</span>
      </span>
    </div>
  );
}

// SSR-safe check (server renders the "animate from 0" state).
function prefersReducedMotionSafe() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
