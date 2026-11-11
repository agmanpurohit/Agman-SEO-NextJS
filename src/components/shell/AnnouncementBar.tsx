"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { TLink } from "@/components/ui/TLink";
import { useSiteSettings } from "./SiteSettingsProvider";

/**
 * Optional site-wide notice (Admin → Settings). Floats at the bottom so it never shifts the
 * page layout. Visitors can dismiss it; a new message shows again.
 */
export function AnnouncementBar() {
  const { announcement: a } = useSiteSettings();
  const pathname = usePathname();
  const key = `ar-announce-${a.text.length}-${[...a.text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)}`;
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      setHidden(localStorage.getItem(key) === "1");
    } catch {
      setHidden(false);
    }
  }, [key]);

  if (!a.enabled || !a.text || hidden || pathname.startsWith("/admin")) return null;
  const external = /^https?:\/\//.test(a.href);
  return (
    <div role="region" aria-label="Announcement" className="fixed bottom-4 left-1/2 z-[70] flex w-[min(92vw,44rem)] -translate-x-1/2 items-center gap-3 rounded-full border border-line-2 bg-ink-2/95 py-2 pr-2 pl-5 text-sm shadow-2xl shadow-black/50 backdrop-blur-md">
      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
      <p className="min-w-0 flex-1 text-bone">{a.text}</p>
      {a.href && a.linkLabel && (
        external ? (
          <a href={a.href} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-full bg-bone px-3.5 py-1.5 text-xs font-medium text-ink hover:bg-ember">
            {a.linkLabel}
          </a>
        ) : (
          <TLink href={a.href} className="shrink-0 rounded-full bg-bone px-3.5 py-1.5 text-xs font-medium text-ink hover:bg-ember">
            {a.linkLabel}
          </TLink>
        )
      )}
      <button
        type="button"
        aria-label="Dismiss announcement"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-bone-dim hover:bg-ink-3 hover:text-bone"
        onClick={() => {
          setHidden(true);
          try {
            localStorage.setItem(key, "1");
          } catch {
            /* private mode */
          }
        }}
      >
        ✕
      </button>
    </div>
  );
}
