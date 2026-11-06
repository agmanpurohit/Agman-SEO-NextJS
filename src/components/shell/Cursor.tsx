"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap, isFinePointer } from "@/lib/gsap";

/**
 * Desktop-only cursor: a precise dot plus a lagging reticle ring.
 * - `data-cursor="Label"` on any element grows the ring and shows the label.
 * - Links and buttons get a lighter "hover" state.
 * - Text fields hand control back to the native caret.
 * Never intercepts clicks (pointer-events: none) and is not rendered on touch devices.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!isFinePointer() || !dot.current || !ring.current) return;
    const html = document.documentElement;
    html.classList.add("has-cursor");

    const d = dot.current;
    const r = ring.current;
    gsap.set([d, r], { xPercent: -50, yPercent: -50, autoAlpha: 0 });
    const dx = gsap.quickTo(d, "x", { duration: 0.12, ease: "power3" });
    const dy = gsap.quickTo(d, "y", { duration: 0.12, ease: "power3" });
    const rx = gsap.quickTo(r, "x", { duration: 0.5, ease: "power3" });
    const ry = gsap.quickTo(r, "y", { duration: 0.5, ease: "power3" });

    let visible = false;
    let mode = "";

    const setMode = (next: string, label = "") => {
      if (next === mode && (next !== "label" || text.current?.textContent === label)) return;
      mode = next;
      if (text.current) text.current.textContent = label;
      const cfg: Record<string, gsap.TweenVars> = {
        "": { width: 36, height: 36, backgroundColor: "rgba(236,232,225,0)", borderColor: "rgba(236,232,225,0.35)" },
        hover: { width: 64, height: 64, backgroundColor: "rgba(236,232,225,0.06)", borderColor: "rgba(236,232,225,0.6)" },
        label: { width: 108, height: 108, backgroundColor: "rgba(255,90,31,1)", borderColor: "rgba(255,90,31,1)" },
        text: { width: 4, height: 28, backgroundColor: "rgba(236,232,225,0.8)", borderColor: "rgba(236,232,225,0)" },
        hide: { width: 0, height: 0, backgroundColor: "rgba(236,232,225,0)", borderColor: "rgba(236,232,225,0)" },
      };
      gsap.to(r, { ...cfg[next], duration: 0.45, ease: "cine", overwrite: "auto" });
      gsap.to(text.current, { autoAlpha: next === "label" ? 1 : 0, duration: 0.25 });
      gsap.to(d, { scale: next === "label" || next === "text" || next === "hide" ? 0 : 1, duration: 0.3 });
    };

    const resolve = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el?.closest) return setMode("");
      const labelled = el.closest<HTMLElement>("[data-cursor]");
      if (labelled) {
        const v = labelled.dataset.cursor!;
        return v === "hide" ? setMode("hide") : setMode("label", v);
      }
      if (el.closest("input, textarea, [contenteditable='true']")) return setMode("text");
      if (el.closest("a, button, select, label, [role='button'], summary")) return setMode("hover");
      setMode("");
    };

    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
      if (!visible) {
        visible = true;
        gsap.set([d, r], { x: e.clientX, y: e.clientY });
        gsap.to([d, r], { autoAlpha: 1, duration: 0.3 });
      }
    };
    const over = (e: PointerEvent) => resolve(e.target);
    const leave = () => {
      visible = false;
      gsap.to([d, r], { autoAlpha: 0, duration: 0.3 });
    };
    const down = () => gsap.to(r, { scale: 0.85, duration: 0.2 });
    const up = () => gsap.to(r, { scale: 1, duration: 0.4 });

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    setMode("");

    return () => {
      html.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  // A route change swaps the element under the pointer without a pointerover event.
  useEffect(() => {
    const r = ring.current;
    if (!r || !text.current) return;
    text.current.textContent = "";
    gsap.to(r, { width: 36, height: 36, backgroundColor: "rgba(236,232,225,0)", borderColor: "rgba(236,232,225,0.35)", duration: 0.3 });
    gsap.to(text.current, { autoAlpha: 0, duration: 0.2 });
  }, [pathname]);

  return (
    <div className="cursor" aria-hidden="true">
      <div
        ref={ring}
        className="pointer-events-none fixed top-0 left-0 z-[95] grid place-items-center rounded-full border"
        style={{ width: 36, height: 36, borderColor: "rgba(236,232,225,0.35)" }}
      >
        <span ref={text} className="t-label text-center !text-[0.62rem] !tracking-[0.16em] text-ink opacity-0" />
      </div>
      <div ref={dot} className="pointer-events-none fixed top-0 left-0 z-[96] h-1.5 w-1.5 rounded-full bg-bone mix-blend-difference" />
    </div>
  );
}
