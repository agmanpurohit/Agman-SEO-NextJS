"use client";

import type Lenis from "lenis";

/** Holds the single Lenis instance so any component can scroll programmatically. */
let instance: Lenis | null = null;

export const setLenis = (l: Lenis | null) => {
  instance = l;
};
export const getLenis = () => instance;

export function scrollToTop(immediate = false) {
  if (instance) instance.scrollTo(0, { immediate, force: true });
  else window.scrollTo({ top: 0, behavior: immediate ? "auto" : "smooth" });
}

export function lockScroll(lock: boolean) {
  if (instance) {
    if (lock) instance.stop();
    else instance.start();
  }
  document.documentElement.style.overflow = lock ? "hidden" : "";
}
