"use client";

/**
 * "Stage ready" signal. Page intros wait for it so they play after the preloader
 * (first visit) or as the page-transition curtain lifts (navigation).
 */
let ready = false;
const listeners = new Set<() => void>();

export function setStageReady(value: boolean) {
  ready = value;
  if (value) {
    const queued = [...listeners];
    listeners.clear();
    queued.forEach((fn) => fn());
  }
}

export function onStageReady(fn: () => void): () => void {
  if (ready) {
    fn();
    return () => {};
  }
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const isStageReady = () => ready;
