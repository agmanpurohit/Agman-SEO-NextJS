import Image from "next/image";
import type { CaseStudy } from "@/content/work";
import { ClientLogo } from "./ClientLogo";

/** Deterministic pseudo-random numbers from a string, so covers are stable between renders. */
function seeded(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/**
 * Designed cover for a case study. Client screenshots can't be shown, so each cover is
 * an abstract "index": rows of result lines with one lifted into first place in ember,
 * the project's key word set large, and its headline metric. It is clearly an
 * illustration — never a fake dashboard or chart.
 */
export function CaseCover({ c, className = "", size = "lg" }: { c: CaseStudy; className?: string; size?: "lg" | "sm" }) {
  const rnd = seeded(c.slug);
  const rows = 8;
  const lifted = 2 + Math.floor(rnd() * 3);
  const bars = Array.from({ length: rows }, (_, i) => ({
    y: 78 + i * 21,
    w: 120 + rnd() * 220,
    x: 30 + rnd() * 20,
    hi: i === lifted,
  }));

  // Prefer a Search Console report as the cover; otherwise the first screenshot.
  const allShots = c.evidence?.flatMap((e) => e.shots) ?? [];
  const shot = allShots.find((s) => s.label.startsWith("Search Console")) ?? allShots[0];

  return (
    <div className={`relative isolate h-full w-full overflow-hidden bg-ink-3 ${className}`}>
      {shot ? (
        <div data-cover-bg className="absolute -inset-x-[4%] inset-y-0">
          <Image src={shot.src} alt="" fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover object-[50%_75%] opacity-80 grayscale-[30%]" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/90 via-ink/30 to-ink/60" />
        </div>
      ) : (
      <div data-cover-bg className="absolute -inset-x-[8%] inset-y-0">
        <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
          {bars.map((b, i) => (
            <g key={i}>
              <rect x={b.x} y={b.y} width={b.w} height={b.hi ? 6 : 3} rx={1} fill={b.hi ? "#ff5a1f" : "#ece8e1"} fillOpacity={b.hi ? 0.9 : 0.07} />
              {b.hi && <circle cx={b.x - 12} cy={b.y + 3} r={3} fill="#ff5a1f" />}
              <rect x={b.x} y={b.y + (b.hi ? 11 : 8)} width={b.w * 0.55} height={2} fill="#ece8e1" fillOpacity={b.hi ? 0.18 : 0.035} />
            </g>
          ))}
        </svg>
        {!c.client && (
        <span
          aria-hidden="true"
          className={`absolute -bottom-[0.18em] left-[6%] leading-none font-extrabold tracking-[-0.05em] text-transparent uppercase select-none ${size === "lg" ? "text-[clamp(5rem,13vw,12rem)]" : "text-[clamp(3.6rem,9vw,6.5rem)]"}`}
          style={{ WebkitTextStroke: "1px rgba(236,232,225,0.2)", fontStretch: "125%" }}
        >
          {c.coverWord}
        </span>
        )}
      </div>
      )}

      {c.client && (
        <div className="absolute bottom-5 left-5">
          <ClientLogo client={c.client} size={size === "lg" ? "lg" : "md"} className="shadow-[0_10px_40px_rgba(0,0,0,0.45)]" />
        </div>
      )}

      <div className="absolute top-5 right-5 left-5 flex items-start justify-between gap-4">
        <span className="t-label !text-bone">{c.type}</span>
        <span className="text-right">
          <span className={`block leading-none font-light tracking-[-0.04em] text-bone ${size === "lg" ? "text-[clamp(2.4rem,4.6vw,4.25rem)]" : "text-4xl"}`}>{c.metric.value}</span>
          <span className="t-label mt-1.5 block !text-[0.6rem]">{c.metric.label}</span>
        </span>
      </div>
    </div>
  );
}
