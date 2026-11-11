"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Reloads the preview whenever the editor sends a new version. */
export function PreviewRefresh() {
  const router = useRouter();
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel("page-builder-preview");
    ch.onmessage = () => router.refresh();
    return () => ch.close();
  }, [router]);
  return (
    <div className="pointer-events-none fixed top-[calc(var(--header-h)+0.5rem)] left-1/2 z-50 -translate-x-1/2 rounded-full border border-[#f0b64a]/60 bg-ink/90 px-4 py-1.5 text-xs text-[#f0b64a] backdrop-blur">
      Preview · not live · updates as you edit
    </div>
  );
}
