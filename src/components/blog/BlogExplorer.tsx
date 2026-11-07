"use client";

import { useMemo, useState } from "react";
import { PostCard } from "./PostCard";
import type { PostSummary } from "@/lib/blog/types";

const PAGE = 9;

/**
 * Category filter, search and "load more" for the blog grid. Every post link is already in the
 * server-rendered HTML, so crawlers see the full list regardless of what's filtered on screen.
 */
export function BlogExplorer({ posts }: { posts: PostSummary[] }) {
  const categories = useMemo(() => [...new Set(posts.map((p) => p.category).filter(Boolean))].sort(), [posts]);
  const [cat, setCat] = useState<string>("All");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(PAGE);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return posts.filter((p) => (cat === "All" || p.category === cat) && (!term || `${p.title} ${p.excerpt} ${p.tags.join(" ")} ${p.category}`.toLowerCase().includes(term)));
  }, [posts, cat, q]);

  return (
    <div>
      <div className="flex flex-col gap-4 border-y border-line py-4 md:flex-row md:items-center md:justify-between">
        <div role="group" aria-label="Filter by category" className="no-scrollbar -mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)] md:mx-0 md:flex-wrap md:px-0">
          {["All", ...categories].map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={cat === c}
              onClick={() => {
                setCat(c);
                setShown(PAGE);
              }}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors duration-300 ${cat === c ? "border-bone bg-bone text-ink" : "border-line-2 text-bone-dim hover:border-bone hover:text-bone"}`}
            >
              {c}
              <span className={`t-mono ml-2 text-[0.65rem] ${cat === c ? "text-ink/60" : "text-mute"}`}>{c === "All" ? posts.length : posts.filter((p) => p.category === c).length}</span>
            </button>
          ))}
        </div>
        <label className="relative block md:w-72">
          <span className="sr-only">Search articles</span>
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setShown(PAGE);
            }}
            placeholder="Search articles"
            className="h-11 w-full rounded-full border border-line-2 bg-ink-2 px-4 pl-10 text-sm text-bone outline-none focus:border-bone"
          />
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-mute" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="m15 15 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </label>
      </div>

      <p className="sr-only" aria-live="polite">
        {list.length} article{list.length === 1 ? "" : "s"} shown.
      </p>

      {list.length === 0 ? (
        <p className="t-body py-16 text-center">No articles match that search yet.</p>
      ) : (
        <div className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p, i) => (
            <div key={p.id} className={i >= shown ? "hidden" : undefined}>
              <PostCard post={p} priority={i < 3} />
            </div>
          ))}
        </div>
      )}

      {list.length > shown && (
        <div className="mt-14 text-center">
          <button type="button" onClick={() => setShown((n) => n + PAGE)} className="btn btn-ghost">
            Load more articles
          </button>
        </div>
      )}
    </div>
  );
}
