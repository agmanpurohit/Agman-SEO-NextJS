"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/blog/types";

/** Sticky "On this page" list that highlights the section in view, plus a reading progress bar. */
export function TableOfContents({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const heads = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    heads.forEach((h) => io.observe(h));
    const article = document.getElementById("article-body");
    const onScroll = () => {
      if (!article) return;
      const r = article.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.6;
      setProgress(Math.max(0, Math.min(1, -r.top / (total || 1))));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [items]);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[81] h-[2px] origin-left bg-ember" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
      {items.length > 1 && (
        <nav aria-label="On this page" className="text-sm">
          <p className="t-label mb-4">On this page</p>
          <ol className="space-y-2.5 border-l border-line">
            {items.map((i) => (
              <li key={i.id}>
                <a
                  href={`#${i.id}`}
                  aria-current={active === i.id ? "location" : undefined}
                  className={`-ml-px block border-l py-0.5 leading-snug transition-colors ${i.level === 3 ? "pl-8 text-[0.85rem]" : "pl-4"} ${active === i.id ? "border-ember text-bone" : "border-transparent text-bone-dim hover:text-bone"}`}
                >
                  {i.text}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
    </>
  );
}
