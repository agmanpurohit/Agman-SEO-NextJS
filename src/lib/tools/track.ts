"use client";

import { useEffect, useRef } from "react";

/**
 * Client side of the free-tool usage log. Each browser tab gets a random session id, so
 * one visitor's work on a tool becomes a single row in the admin panel that updates as
 * they go. Reports are sent when the visitor pauses (not on every keystroke) and right
 * away for explicit actions such as copy or download.
 */
const SID_KEY = "ar-tool-sid";
const IDLE_MS = 3500;

export function sessionId() {
  try {
    let s = sessionStorage.getItem(SID_KEY);
    if (!s) {
      s = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 22);
      sessionStorage.setItem(SID_KEY, s);
    }
    return s;
  } catch {
    return "nosession-" + Math.random().toString(36).slice(2, 12);
  }
}

type Report = { tool: string; summary: string; data: Record<string, unknown>; action?: string };

function send(r: Report) {
  try {
    const body = JSON.stringify({ ...r, sid: sessionId() });
    if (body.length > 62_000) return; // keepalive requests are limited to 64 KB
    void fetch("/api/tools/log", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch {
    /* never let logging affect the tool */
  }
}

/** Report an explicit action (copy, download, fetch-url, crawl…) immediately. */
export function logAction(tool: string, action: string, summary: string, data: Record<string, unknown> = {}) {
  send({ tool, action, summary, data });
}

/**
 * Report the tool's current state after the visitor pauses. `active` should be false while
 * the form is still empty or untouched, so page views alone aren't logged.
 */
export function useToolLog(tool: string, state: { summary: string; data: Record<string, unknown> }, active: boolean) {
  const last = useRef("");
  const pending = useRef<Report | null>(null);
  const json = JSON.stringify(state);

  useEffect(() => {
    if (!active || json === last.current) return;
    pending.current = { tool, ...(JSON.parse(json) as typeof state), action: "use" };
    const t = setTimeout(() => {
      if (pending.current) send(pending.current);
      last.current = json;
      pending.current = null;
    }, IDLE_MS);
    return () => clearTimeout(t);
  }, [tool, json, active]);

  // Leaving the page or switching tabs: send whatever hasn't been reported yet.
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === "hidden" && pending.current) {
        send(pending.current);
        pending.current = null;
      }
    };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, []);
}
