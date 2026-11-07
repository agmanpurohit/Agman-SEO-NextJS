"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Google result preview. Google truncates titles and descriptions by rendered pixel width,
 * not characters, so text is measured with canvas in the same fonts Google uses.
 */
export const LIMITS = {
  desktop: { title: 600, desc: 920 },
  mobile: { title: 540, desc: 680 },
} as const;
export type Device = keyof typeof LIMITS;

let ctx: CanvasRenderingContext2D | null = null;
export function textWidth(text: string, font: string) {
  if (typeof document === "undefined") return text.length * 8;
  ctx ??= document.createElement("canvas").getContext("2d");
  if (!ctx) return text.length * 8;
  ctx.font = font;
  return Math.round(ctx.measureText(text).width);
}
export const TITLE_FONT = { desktop: "20px Arial, sans-serif", mobile: "18px Arial, sans-serif" } as const;
export const DESC_FONT = "14px Arial, sans-serif";

/** Cuts text to fit maxPx, ending with an ellipsis (at a word boundary when possible). */
export function truncateToWidth(text: string, maxPx: number, font: string) {
  if (textWidth(text, font) <= maxPx) return { text, cut: false };
  const ell = " ...";
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (textWidth(text.slice(0, mid) + ell, font) <= maxPx) lo = mid;
    else hi = mid - 1;
  }
  let cut = text.slice(0, lo);
  const sp = cut.lastIndexOf(" ");
  if (sp > lo * 0.7) cut = cut.slice(0, sp);
  return { text: cut.replace(/[\s,;:–—-]+$/, "") + ell, cut: true };
}

/**
 * True once running in the browser (canvas measuring isn't possible on the server, so the
 * first render must match the server's). Re-renders again after web fonts settle.
 */
export function useMeasureReady() {
  const [ready, setReady] = useState(0);
  useEffect(() => {
    setReady(1);
    document.fonts?.ready.then(() => setReady(2));
  }, []);
  return ready > 0;
}

function boldKeyword(text: string, keyword: string) {
  const k = keyword.trim();
  if (!k) return text;
  const parts = text.split(new RegExp(`(${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
  return parts.map((p, i) => (i % 2 ? <b key={i} className="font-bold text-[#5f6368]">{p}</b> : <Fragment key={i}>{p}</Fragment>));
}

function crumbs(url: string) {
  try {
    const u = new URL(/^https?:\/\//.test(url) ? url : `https://${url}`);
    const segs = u.pathname.split("/").filter(Boolean).map((s) => decodeURIComponent(s));
    return { host: u.hostname, origin: `${u.protocol}//${u.hostname}`, path: segs };
  } catch {
    return { host: url || "example.com", origin: `https://${url || "example.com"}`, path: [] as string[] };
  }
}

export function SerpCard({
  title,
  description,
  url,
  siteName,
  date,
  keyword = "",
  device,
}: {
  title: string;
  description: string;
  url: string;
  siteName?: string;
  date?: string;
  keyword?: string;
  device: Device;
}) {
  const ready = useMeasureReady();
  const lim = LIMITS[device];
  const c = crumbs(url);
  const name = siteName?.trim() || c.host.replace(/^www\./, "");
  const rawTitle = title || "Your page title appears here";
  const t = ready ? truncateToWidth(rawTitle, lim.title, TITLE_FONT[device]) : { text: rawTitle };
  const prefix = date ? `${date} — ` : "";
  // Description: Google shows up to ~2 lines on desktop, ~3 on mobile; we cap by total pixel width.
  const rawDesc = prefix + (description || "Your meta description appears here. Google may rewrite it if it doesn't match what the searcher is looking for.");
  const d = ready ? truncateToWidth(rawDesc, lim.desc, DESC_FONT) : { text: rawDesc };
  const descText = d.text.slice(prefix.length);

  const card = (
    <div className={`rounded-lg bg-white p-5 text-left font-[Arial,sans-serif] shadow-sm ${device === "mobile" ? "mx-auto max-w-[400px]" : "w-[652px] max-w-none"}`}>
      <div className="flex items-center gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#dadce0] bg-[#f1f3f4] text-[11px] font-bold text-[#5f6368]" aria-hidden="true">
          {name.slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[14px] text-[#202124]">{name}</span>
          <span className="block truncate text-[12px] text-[#4d5156]">
            {c.origin}
            {c.path.length > 0 && <span className="text-[#5f6368]"> › {c.path.join(" › ")}</span>}
          </span>
        </span>
      </div>
      <p className={`mt-2 leading-[1.3] text-[#1a0dab] hover:underline ${device === "mobile" ? "text-[18px]" : "overflow-hidden text-[20px] whitespace-nowrap"}`}>{t.text}</p>
      <p className="mt-1 text-[14px] leading-[1.58] text-[#4d5156]">
        {date && <span className="text-[#70757a]">{date} — </span>}
        {boldKeyword(descText, keyword)}
      </p>
    </div>
  );
  // Desktop results are 652px wide in Google; on narrower screens shrink the whole card
  // proportionally so line breaks and truncation stay exactly as Google shows them.
  return device === "desktop" ? <FitWidth width={652}>{card}</FitWidth> : card;
}

/** Scales its content down (never up) to fit the available width, keeping proportions. */
export function FitWidth({ width, children }: { width: number; children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number>();
  useEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const update = () => {
      const s = Math.min(1, o.clientWidth / width);
      setScale(s);
      setHeight(i.offsetHeight * s);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, [width]);
  return (
    <div ref={outer} className="w-full overflow-hidden" style={{ height }}>
      <div ref={inner} style={{ width, transform: scale < 1 ? `scale(${scale})` : undefined, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}

/** Horizontal meter: used pixels vs Google's limit. */
export function PixelMeter({ label, px, max, min = 0 }: { label: string; px: number; max: number; min?: number }) {
  const pct = Math.min(100, (px / max) * 100);
  const tone = px === 0 ? "bg-line-2" : px > max ? "bg-ember" : px < min ? "bg-ember-soft" : "bg-[#7fd6a4]";
  const note = px === 0 ? "Empty" : px > max ? "Too long: Google will cut it off" : px < min ? "Quite short: room for more detail" : "Good length";
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-xs">
        <span className="whitespace-nowrap text-bone">{label}</span>
        <span className="t-mono text-mute">
          {px} / {max}px · {note}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line" role="meter" aria-label={`${label} width`} aria-valuemin={0} aria-valuemax={max} aria-valuenow={px}>
        <div className={`h-full rounded-full transition-[width] duration-300 ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
