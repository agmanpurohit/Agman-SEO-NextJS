"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AuditStatus } from "@/lib/audit/runner";
import { STAGES } from "@/lib/audit/types";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { ButtonLink } from "@/components/ui/Buttons";
import { Results } from "./Results";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Drives an audit to completion. Each request asks the server to do the next real piece of
 * work and returns the stored state — the progress shown is the backend's, never simulated.
 */
export function AuditRun({ id }: { id: string }) {
  const [s, setS] = useState<AuditStatus | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [stalled, setStalled] = useState(false);
  const running = useRef(false);
  const alive = useRef(true);

  const drive = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setStalled(false);
    let failures = 0;
    while (alive.current) {
      try {
        const res = await fetch(`/api/audits/${id}/step`, { method: "POST", cache: "no-store" });
        if (res.status === 404) {
          setNotFound(true);
          break;
        }
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as AuditStatus;
        failures = 0;
        if (!alive.current) break;
        setS(data);
        if (data.status !== "running") break;
        await sleep(250);
      } catch {
        failures++;
        if (failures >= 4) {
          setStalled(true);
          break;
        }
        await sleep(1500 * failures);
      }
    }
    running.current = false;
  }, [id]);

  useEffect(() => {
    alive.current = true;
    (async () => {
      const res = await fetch(`/api/audits/${id}`, { cache: "no-store" });
      if (res.status === 404) return setNotFound(true);
      const data = (await res.json()) as AuditStatus;
      if (!alive.current) return;
      setS(data);
      if (data.status === "running") drive();
    })().catch(() => setStalled(true));
    return () => {
      alive.current = false;
    };
  }, [id, drive]);

  if (notFound) {
    return (
      <Shell>
        <p className="t-label ember">Audit not found</p>
        <h1 className="t-h2 mt-4">This audit link doesn’t exist.</h1>
        <div className="mt-8">
          <ButtonLink href="/seo-audit">Start a new audit</ButtonLink>
        </div>
      </Shell>
    );
  }
  if (!s) {
    return (
      <Shell>
        <p className="t-label">Loading audit…</p>
      </Shell>
    );
  }
  if (s.status === "failed") {
    return (
      <Shell>
        <p className="t-label ember">Audit stopped</p>
        <h1 className="t-h2 mt-4 max-w-[22ch]">We couldn’t complete the audit for {s.domain}.</h1>
        <p className="t-lead mt-6 max-w-[40rem] text-bone-dim">{s.error ?? "Something went wrong."}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/seo-audit">Try another URL</ButtonLink>
          <ButtonLink href="/contact" variant="ghost">
            Ask me to look manually
          </ButtonLink>
        </div>
      </Shell>
    );
  }
  if (s.status === "complete") return <Results s={s} />;
  return <Progress s={s} stalled={stalled} onResume={drive} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return <section className="wrap min-h-[70svh] pt-[calc(var(--header-h)+4rem)] pb-20">{children}</section>;
}

function Progress({ s, stalled, onResume }: { s: AuditStatus; stalled: boolean; onResume: () => void }) {
  const bar = useRef<HTMLDivElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const shown = useRef({ v: 0 });

  // Ease the displayed number/bar toward the server's value (never beyond it).
  useEffect(() => {
    const target = s.progress;
    if (prefersReducedMotion()) {
      shown.current.v = target;
      if (pct.current) pct.current.textContent = String(target);
      if (bar.current) bar.current.style.transform = `scaleX(${target / 100})`;
      return;
    }
    const t = gsap.to(shown.current, {
      v: target,
      duration: 0.8,
      ease: "power2.out",
      onUpdate: () => {
        if (pct.current) pct.current.textContent = String(Math.round(shown.current.v));
        if (bar.current) bar.current.style.transform = `scaleX(${shown.current.v / 100})`;
      },
    });
    return () => {
      t.kill();
    };
  }, [s.progress]);

  const stats = [
    ["Pages discovered", s.stats.discovered],
    ["Pages crawled", s.stats.crawled],
    ["Issues detected", s.issuesSoFar],
    ["Modules complete", `${s.modulesDone.length} / 8`],
  ];

  return (
    <section className="wrap pt-[calc(var(--header-h)+3rem)] pb-20 md:pt-[calc(var(--header-h)+4.5rem)]" aria-busy="true">
      <p className="t-label">Auditing</p>
      <h1 className="mt-3 text-[clamp(1.8rem,4.6vw,4rem)] leading-[1] font-bold tracking-[-0.03em] break-all">{s.domain}</h1>
      <p className="t-body mt-2 break-all text-sm">{s.url}</p>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="flex items-end justify-between gap-6">
            <div aria-live="polite">
              <p className="t-label">Current stage</p>
              <p className="mt-2 text-2xl font-medium md:text-3xl">{s.stageLabel}…</p>
            </div>
            <p className="t-mono text-[clamp(3rem,8vw,6rem)] leading-none font-light tabular-nums" aria-label={`${s.progress} percent complete`}>
              <span ref={pct}>0</span>
              <span className="ember text-[0.4em]">%</span>
            </p>
          </div>
          <div className="mt-6 h-px w-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={s.progress} aria-label="Audit progress">
            <div ref={bar} className="h-[3px] -translate-y-px origin-left bg-ember" style={{ transform: "scaleX(0)" }} />
          </div>
          <dl className="mt-10 grid grid-cols-2 gap-px border border-line bg-line">
            {stats.map(([k, v]) => (
              <div key={k as string} className="bg-ink p-5">
                <dt className="t-label">{k}</dt>
                <dd className="mt-1 text-3xl font-light tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="t-body mt-6 text-sm">
            Progress reflects work completed on our server. Keep this tab open: if you close it, the audit pauses and continues when you reopen this link. Crawl limit:{" "}
            {s.limits.maxPages} pages.
          </p>
          {stalled && (
            <div className="mt-6 flex flex-wrap items-center gap-4 border-l border-ember pl-4">
              <p className="text-bone">The connection dropped. Your progress is saved.</p>
              <button type="button" onClick={onResume} className="btn btn-primary !h-11">
                Resume audit
              </button>
            </div>
          )}
        </div>

        <ol className="border-t border-line">
          {STAGES.map((label, i) => {
            const state = i < s.stage ? "done" : i === s.stage ? "active" : "todo";
            return (
              <li key={label} className="flex items-center gap-4 border-b border-line py-3">
                <span
                  aria-hidden="true"
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[0.65rem] ${state === "done" ? "border-ember bg-ember text-ink" : state === "active" ? "border-ember text-ember" : "border-line-2 text-mute"}`}
                >
                  {state === "done" ? "✓" : state === "active" ? <span className="h-1.5 w-1.5 animate-ping rounded-full bg-ember" /> : i + 1}
                </span>
                <span className={state === "todo" ? "text-mute" : "text-bone"}>{label}</span>
                <span className="sr-only">{state === "done" ? "(done)" : state === "active" ? "(in progress)" : "(waiting)"}</span>
                {i === 3 && state === "active" && (
                  <span className="t-mono ml-auto text-xs text-bone-dim">
                    {s.stats.crawled}/{Math.min(s.limits.maxPages, Math.max(s.stats.discovered, s.stats.crawled))}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
