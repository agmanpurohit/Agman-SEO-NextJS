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

export { gsap, ScrollTrigger, SplitText, useGSAP };
