"use client";

import { useState } from "react";

/** Share via LinkedIn, X, WhatsApp, email, or copy the link. No third-party scripts. */
export function ShareLinks({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    ["LinkedIn", `https://www.linkedin.com/sharing/share-offsite/?url=${u}`],
    ["X", `https://twitter.com/intent/tweet?url=${u}&text=${t}`],
    ["WhatsApp", `https://wa.me/?text=${t}%20${u}`],
    ["Email", `mailto:?subject=${t}&body=${u}`],
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="t-label mr-1">Share</span>
      {links.map(([name, href]) => (
        <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line-2 px-3.5 py-1.5 text-xs text-bone-dim transition-colors hover:border-bone hover:text-bone">
          {name}
        </a>
      ))}
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {}
        }}
        className="rounded-full border border-line-2 px-3.5 py-1.5 text-xs text-bone-dim transition-colors hover:border-bone hover:text-bone"
      >
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}
