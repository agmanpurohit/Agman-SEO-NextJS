"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useStage } from "@/components/ui/motion";
import { roles, freelance, type Role } from "@/content/experience";

/**
 * Career timeline. A sticky rail on the left tracks progress; each role opens to show
 * responsibilities and results. Freelance runs as a parallel track at the end.
 */
export function Timeline() {
  const root = useRef<HTMLElement>(null);

  useStage(root, (reduced) => {
    if (reduced) return;
    gsap.fromTo("[data-rail]", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top 60%", end: "bottom 70%", scrub: true } });
    gsap.utils.toArray<HTMLElement>("[data-role]").forEach((el) => {
      gsap.from(el.querySelectorAll("[data-rf]"), { y: 40, autoAlpha: 0, stagger: 0.08, duration: 1.1, scrollTrigger: { trigger: el, start: "top 82%", once: true } });
      gsap.fromTo(
        el.querySelector("[data-company]"),
        { fontStretch: "75%" },
        { fontStretch: "115%", ease: "none", scrollTrigger: { trigger: el, start: "top 90%", end: "top 30%", scrub: true } },
      );
    });
  });

  return (
    <section ref={root} aria-labelledby="timeline-title" className="relative pb-12 md:pb-20">
      <div className="wrap">
        <h2 id="timeline-title" className="t-label mb-10">
          <span className="ember">A</span> — Employment history
        </h2>
        <div className="relative">
          <span aria-hidden="true" className="absolute top-0 bottom-0 left-[7px] w-px bg-line md:left-[calc(25%-0.5px)]" />
          <span data-rail aria-hidden="true" className="absolute top-0 bottom-0 left-[7px] w-px origin-top bg-ember md:left-[calc(25%-0.5px)]" />
          <ol>
            {roles.map((r, i) => (
              <RoleEntry key={r.slug} role={r} defaultOpen={i === 0} />
            ))}
            <FreelanceEntry />
          </ol>
        </div>
      </div>
    </section>
  );
}

function Dot() {
  return (
    <span aria-hidden="true" className="absolute top-[0.6rem] left-0 grid h-[15px] w-[15px] place-items-center rounded-full border border-line-2 bg-ink md:left-[calc(25%-7.5px)]">
      <span className="h-[5px] w-[5px] rounded-full bg-ember" />
    </span>
  );
}

function RoleEntry({ role, defaultOpen }: { role: Role; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const panel = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const id = `role-${role.slug}`;
  const range = `${role.positions[role.positions.length - 1].start} — ${role.positions[0].end}`;

  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const instant = first.current || prefersReducedMotion();
    first.current = false;
    gsap.to(el, { height: open ? "auto" : 0, duration: instant ? 0 : 0.9, ease: "cine" });
  }, [open]);

  return (
    <li data-role className="relative grid grid-cols-1 gap-x-10 border-b border-line py-12 pl-10 md:grid-cols-4 md:py-16 md:pl-0">
      <Dot />
      <div className="mb-6 md:mb-0 md:pr-12" data-rf>
        <p className="t-label !text-bone">{range}</p>
        {role.location && <p className="t-label mt-2">{role.location}</p>}
      </div>
      <div className="md:col-span-3 md:pl-12">
        <h3 data-rf>
          <span data-company className="block text-[clamp(2.4rem,6vw,5.5rem)] leading-[0.9] font-bold tracking-[-0.035em]" style={{ fontStretch: "100%" }}>
            {role.company}
          </span>
          {role.descriptor && <span className="mt-3 block text-lg text-bone-dim">{role.descriptor}</span>}
        </h3>

        <ul className="mt-6 flex flex-col gap-1" data-rf>
          {role.positions.map((p, i) => (
            <li key={p.title} className={`flex flex-wrap items-baseline gap-x-4 ${i > 0 ? "text-bone-dim" : "text-bone"}`}>
              <span className="text-xl font-medium">{p.title}</span>
              <span className="t-label">
                {p.start} — {p.end}
              </span>
            </li>
          ))}
        </ul>

        <p className="t-lead mt-6 max-w-[44rem] text-bone-dim" data-rf>
          {role.summary}
        </p>

        {role.highlights.length > 0 && (
          <dl className="mt-8 flex flex-wrap gap-x-12 gap-y-6" data-rf>
            {role.highlights.map((h) => (
              <div key={h.label}>
                <dt className="t-label order-2">{h.label}</dt>
                <dd className="text-4xl font-light tracking-tight md:text-5xl">{h.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <button
          type="button"
          data-rf
          aria-expanded={open}
          aria-controls={`${id}-detail`}
          onClick={() => setOpen((v) => !v)}
          className="t-label mt-8 inline-flex items-center gap-3 !text-bone hover:!text-ember"
        >
          <span className="relative block h-3 w-3" aria-hidden="true">
            <span className="absolute top-1/2 left-0 h-px w-full bg-current" />
            <span className={`absolute top-0 left-1/2 h-full w-px bg-current transition-transform duration-500 ${open ? "scale-y-0" : ""}`} />
          </span>
          {open ? "Hide details" : "Responsibilities & results"}
        </button>

        <div ref={panel} id={`${id}-detail`} className="overflow-hidden" style={{ height: defaultOpen ? "auto" : 0 }}>
          <div className="grid gap-10 pt-8 lg:grid-cols-[1fr_16rem]">
            <ul className="flex flex-col gap-4">
              {role.points.map((p) => (
                <li key={p} className="grid grid-cols-[1.25rem_1fr] text-bone-dim">
                  <span aria-hidden="true" className="mt-[0.7em] h-px w-2.5 bg-ember" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <div>
              <p className="t-label mb-3">Skills used</p>
              <ul className="flex flex-wrap gap-2">
                {role.skills.map((s) => (
                  <li key={s} className="rounded-full border border-line-2 px-3 py-1 text-sm text-bone-dim">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

function FreelanceEntry() {
  return (
    <li data-role className="relative grid grid-cols-1 gap-x-10 py-12 pl-10 md:grid-cols-4 md:py-16 md:pl-0">
      <Dot />
      <div className="mb-6 md:mb-0 md:pr-12" data-rf>
        <p className="t-label !text-bone">Parallel track</p>
        <p className="t-label mt-2">Alongside employment</p>
      </div>
      <div className="md:col-span-3 md:pl-12">
        <h3 data-rf>
          <span data-company className="block text-[clamp(2.4rem,6vw,5.5rem)] leading-[0.9] font-bold tracking-[-0.035em]">
            {freelance.title}
          </span>
          <span className="mt-3 block text-lg text-bone-dim">{freelance.descriptor}</span>
        </h3>
        <p className="t-lead mt-6 max-w-[44rem] text-bone-dim" data-rf>
          {freelance.summary}
        </p>
        <ul className="mt-6 flex flex-wrap gap-2" data-rf>
          {freelance.services.map((s) => (
            <li key={s} className="rounded-full border border-line-2 px-3 py-1 text-sm text-bone">
              {s}
            </li>
          ))}
        </ul>

        <div className="mt-10 grid gap-px border border-line bg-line md:grid-cols-2" data-rf>
          {freelance.paid.map((p) => (
            <div key={p.platform} className="bg-ink p-6 md:p-8">
              <p className="text-2xl font-semibold tracking-tight">{p.platform}</p>
              <p className="t-body mt-1 text-sm">{p.scope}</p>
              <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6">
                {p.metrics.map((m) => (
                  <div key={m.label} className="flex flex-col-reverse">
                    <dt className="t-label mt-1">{m.label}</dt>
                    <dd className="text-2xl font-light tracking-tight md:text-3xl">{m.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
        <p className="t-body mt-4 text-sm" data-rf>
          Typical ranges across freelance accounts. Client names are not published.
        </p>
      </div>
    </li>
  );
}
