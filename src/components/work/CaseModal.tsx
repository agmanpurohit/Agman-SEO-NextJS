"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { lockScroll } from "@/lib/scroll";
import type { CaseStudy } from "@/content/work";
import { CaseCover } from "./CaseCover";
import { ChartView } from "./Charts";
import { EvidenceGallery } from "./EvidenceGallery";
import { ClientLogo } from "./ClientLogo";
import { TLink } from "@/components/ui/TLink";

/**
 * Full case study in an overlay (keeps the site at four pages). Keyboard: Esc closes,
 * ← / → move between cases; focus is trapped inside and restored on close.
 */
export function CaseModal({
  c,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  c: CaseStudy;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const closing = useRef(false);

  // Open animation + scroll lock + focus.
  useEffect(() => {
    returnFocus.current = document.activeElement as HTMLElement;
    lockScroll(true);
    const el = root.current!;
    if (!prefersReducedMotion()) {
      gsap.fromTo(el.querySelector("[data-panel]"), { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "wipe" });
      gsap.fromTo(el.querySelector("[data-backdrop]"), { opacity: 0 }, { opacity: 1, duration: 0.5 });
    }
    el.querySelector<HTMLElement>("[data-close]")?.focus({ preventScroll: true });
    return () => {
      lockScroll(false);
      returnFocus.current?.focus?.({ preventScroll: true });
    };
  }, []);

  // Content swap animation when moving between cases.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTop = 0;
    if (prefersReducedMotion()) return;
    gsap.fromTo(el.querySelectorAll("[data-m]"), { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.05, duration: 1, delay: 0.15 });
  }, [c.slug]);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    const el = root.current!;
    if (prefersReducedMotion()) return onClose();
    gsap.to(el.querySelector("[data-backdrop]"), { opacity: 0, duration: 0.5 });
    gsap.to(el.querySelector("[data-panel]"), { clipPath: "inset(0% 0% 100% 0%)", duration: 0.7, ease: "wipe", onComplete: onClose });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "Tab") {
        const f = root.current!.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])");
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onNext, onPrev]);

  const Block = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <section data-m className="grid grid-cols-1 gap-3 border-t border-line py-8 md:grid-cols-[12rem_1fr] md:gap-10">
      <h3 className="t-label pt-1">{label}</h3>
      <div>{children}</div>
    </section>
  );
  const List = ({ items }: { items: string[] }) => (
    <ul className="flex flex-col gap-3">
      {items.map((s) => (
        <li key={s} className="grid grid-cols-[1.25rem_1fr] text-bone-dim">
          <span aria-hidden="true" className="mt-[0.75em] h-px w-2.5 bg-ember" />
          <span>{s}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div ref={root} role="dialog" aria-modal="true" aria-labelledby="case-title" className="fixed inset-0 z-[85]">
      <div data-backdrop className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={close} />
      <div data-panel className="absolute inset-0 flex flex-col bg-ink md:inset-y-0 md:right-0 md:left-auto md:w-[min(100%,72rem)] md:border-l md:border-line">
        <div className="flex h-[var(--header-h)] shrink-0 items-center justify-between border-b border-line px-5 md:px-10">
          <span className="t-label">
            Case <span className="text-bone">{String(index + 1).padStart(2, "0")}</span> / {String(total).padStart(2, "0")}
          </span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={onPrev} className="t-label grid h-11 w-11 place-items-center !text-bone hover:!text-ember" aria-label="Previous case study">
              ←
            </button>
            <button type="button" onClick={onNext} className="t-label grid h-11 w-11 place-items-center !text-bone hover:!text-ember" aria-label="Next case study">
              →
            </button>
            <button data-close type="button" onClick={close} className="t-label ml-3 flex h-11 items-center gap-2 rounded-full border border-line-2 px-4 !text-bone hover:border-bone" data-cursor="Close">
              Close <span aria-hidden="true">✕</span>
            </button>
          </div>
        </div>

        <div ref={scroller} className="flex-1 overflow-y-auto overscroll-contain" data-lenis-prevent>
          <div className="px-5 pt-10 pb-20 md:px-10 md:pt-14">
            {c.client && (
              <div data-m className="mb-8 flex flex-wrap items-center gap-5">
                <ClientLogo client={c.client} size="md" />
                <div>
                  <p className="t-label">Client</p>
                  <p className="text-xl font-medium text-bone">{c.client.name}</p>
                </div>
              </div>
            )}
            <p data-m className="t-label ember">
              {c.type}
            </p>
            <h2 data-m id="case-title" className="mt-4 max-w-[20ch] text-[clamp(2.2rem,5vw,4.5rem)] leading-[0.95] font-bold tracking-[-0.03em]">
              {c.title}
            </h2>
            <p data-m className="mt-4 text-lg text-bone-dim">
              {c.industry}
            </p>

            <div data-m className="mt-10 aspect-[16/8] w-full border border-line">
              <CaseCover c={c} />
            </div>

            <dl data-m className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
              <div>
                <dt className="t-label">Headline result</dt>
                <dd className="mt-1 text-3xl font-light tracking-tight">{c.metric.value}</dd>
                <dd className="text-sm text-bone-dim">{c.metric.label}</dd>
              </div>
              <div className="col-span-1 md:col-span-3">
                <dt className="t-label">Services</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {c.services.map((s) => (
                    <span key={s} className="rounded-full border border-line-2 px-3 py-1 text-sm text-bone-dim">
                      {s}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>

            <div className="mt-12">
              <Block label="Overview">
                <p className="t-lead">{c.summary}</p>
              </Block>
              <Block label="Challenge">
                <List items={c.challenge} />
              </Block>
              <Block label="Objective">
                <p className="text-bone">{c.objective}</p>
              </Block>
              <Block label="Strategy & execution">
                <List items={c.strategy} />
              </Block>
              <Block label="Results">
                <ul className="flex flex-col gap-3">
                  {c.results.map((r) => (
                    <li key={r} className="border-l border-ember pl-4 text-bone">
                      {r}
                    </li>
                  ))}
                </ul>
                {c.charts && (
                  <div className="mt-8 grid gap-6 xl:grid-cols-2">
                    {c.charts.map((ch) => (
                      <ChartView key={ch.title} chart={ch} />
                    ))}
                  </div>
                )}
              </Block>
              {c.evidence && (
                <Block label="Reports">
                  <EvidenceGallery key={c.slug} evidence={c.evidence} />
                </Block>
              )}
              <Block label="Tools">
                <p className="text-bone-dim">{c.tools.join(" · ")}</p>
              </Block>
              <Block label="My contribution">
                <p className="text-bone">{c.contribution}</p>
              </Block>
              <section data-m className="border-t border-line pt-6">
                <p className="t-body text-xs">Source: {c.source}
                  {c.client ? "" : " Client identity withheld."}</p>
              </section>
            </div>

            <div data-m className="mt-16 flex flex-col gap-6 border-t border-line pt-10 md:flex-row md:items-center md:justify-between">
              <p className="text-2xl font-medium tracking-tight">Want results like these on your team?</p>
              <TLink href="/contact" className="btn btn-primary self-start" onClick={() => lockScroll(false)}>
                <span>Let&apos;s talk</span>
              </TLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
