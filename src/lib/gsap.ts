"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, useGSAP);
  // Two curves for the whole site: a long, cinematic settle and a tighter UI ease.
  CustomEase.create("cine", "0.16, 1, 0.3, 1");
  CustomEase.create("wipe", "0.76, 0, 0.24, 1");
  gsap.defaults({ ease: "cine", duration: 1.1 });
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const isFinePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/** True while the page is shown in Hindi (set before paint by the boot script in layout.tsx). */
export const isTranslated = () => typeof document !== "undefined" && document.documentElement.classList.contains("lang-hi");

/**
 * SplitText, but translation-safe. Splitting a heading into single letters or words would make
 * Google Translate translate each piece on its own (gibberish). In Hindi mode nothing is split:
 * the whole element stands in for its lines/words/chars, so every animation still plays, as one block.
 */
type SplitVars = Parameters<typeof SplitText.create>[1];
const SafeSplitText = {
  create(target: Parameters<typeof SplitText.create>[0], vars?: SplitVars): SplitText {
    if (!isTranslated()) return SplitText.create(target, vars);
    const els = gsap.utils.toArray<HTMLElement>(target);
    const self = { chars: els, words: els, lines: els, masks: [], elements: els, isSplit: true, revert() {}, split() { return self; }, kill() {} };
    (vars?.onSplit as ((s: unknown) => unknown) | undefined)?.(self);
    return self as unknown as SplitText;
  },
};

export { gsap, ScrollTrigger, SafeSplitText as SplitText, useGSAP };
