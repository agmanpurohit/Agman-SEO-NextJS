"use client";

import { useEffect } from "react";
import { BUILD_ID } from "@/lib/asset";

const CHECK_EVERY = 5 * 60_000;
const MIN_GAP = 60_000;

/**
 * Notices when a new version of the site has been deployed while this tab was open.
 * The next internal link click then does a full page load, so the visitor gets the new
 * version instead of pages and scripts left over from the old one. Nothing reloads by itself.
 */
export function VersionWatch() {
  useEffect(() => {
    if (BUILD_ID === "dev" || process.env.NODE_ENV !== "production") return;
    let stale = false;
    let last = 0;

    const check = async () => {
      if (stale || Date.now() - last < MIN_GAP) return;
      last = Date.now();
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        const { v } = (await res.json()) as { v?: string };
        if (v && v !== BUILD_ID) stale = true;
      } catch {
        /* offline or blocked: try again later */
      }
    };

    // Runs before the page's own link handlers (page transitions), so they never start.
    const onClick = (e: MouseEvent) => {
      if (!stale || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
      if (url.pathname === location.pathname && url.hash) return; // same-page anchor
      e.preventDefault();
      e.stopImmediatePropagation();
      location.assign(url.href);
    };

    const onVisible = () => document.visibilityState === "visible" && check();
    const timer = setInterval(check, CHECK_EVERY);
    document.addEventListener("click", onClick, true);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);
    return () => {
      clearInterval(timer);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
    };
  }, []);
  return null;
}
