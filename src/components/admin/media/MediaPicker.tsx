"use client";

import { useEffect, useRef } from "react";
import { MediaBrowser, type Picked } from "./MediaBrowser";

/** "Choose from library" dialog used by the blog and SEO editors. */
export function MediaPicker({ open, onClose, onPick, title = "Choose an image" }: { open: boolean; onClose: () => void; onPick: (p: Picked) => void; title?: string }) {
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      prev?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/70 p-3 backdrop-blur-sm md:p-8" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialog} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className="flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-line-2 bg-ink outline-none">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="t-label !text-bone">{title}</h2>
          <button type="button" onClick={onClose} className="text-sm text-bone-dim hover:text-bone">
            Close ✕
          </button>
        </div>
        <div data-lenis-prevent className="overflow-y-auto p-5">
          <MediaBrowser
            mode="pick"
            onPick={(p) => {
              onPick(p);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
