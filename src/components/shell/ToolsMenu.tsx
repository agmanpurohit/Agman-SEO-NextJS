"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { TLink } from "@/components/ui/TLink";
import { tools, TOOLS_HUB } from "@/content/tools";

/**
 * Desktop "Free SEO Tools" item: the label links to the hub page; hovering, focusing or
 * pressing the chevron opens a panel with every tool. All links are real <a> tags in the
 * HTML, so crawlers can follow them. Closes on Escape, outside click and route change.
 */
export function ToolsMenu({ active, index, label, className }: { active: boolean; index: string; label: string; className: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLLIElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        root.current?.querySelector<HTMLElement>("[data-tools-toggle]")?.focus();
      }
    };
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const enter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const leave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 160);
  };

  return (
    <li
      ref={root}
      className="relative"
      onPointerEnter={(e) => e.pointerType === "mouse" && enter()}
      onPointerLeave={(e) => e.pointerType === "mouse" && leave()}
      onBlur={(e) => !root.current?.contains(e.relatedTarget as Node) && setOpen(false)}
    >
      <div className="flex items-center">
        <TLink href={TOOLS_HUB.href} aria-current={active ? "page" : undefined} className={className}>
          <span className="t-label !text-[0.6rem] ember opacity-70">{index}</span>
          <span className="relative block overflow-hidden text-[0.95rem] font-medium">
            <span className="block transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover/nav:-translate-y-full">{label}</span>
            <span aria-hidden="true" className="absolute inset-0 block translate-y-full transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover/nav:translate-y-0">
              {label}
            </span>
          </span>
        </TLink>
        <button
          type="button"
          data-tools-toggle
          aria-expanded={open}
          aria-controls="tools-menu"
          aria-label={`${open ? "Hide" : "Show"} free SEO tools`}
          onClick={(e) => {
            // With a mouse, hovering already opened it, so a click keeps it open rather than toggling it shut.
            if ((e.nativeEvent as PointerEvent).pointerType === "mouse") return enter();
            setOpen((v) => !v);
          }}
          className="-ml-1.5 grid h-8 w-6 place-items-center text-bone-dim transition-colors hover:text-bone"
        >
          <svg viewBox="0 0 10 6" className={`h-1.5 w-2.5 transition-transform duration-300 ${open ? "rotate-180" : ""}`} fill="none" aria-hidden="true">
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
      </div>

      <div
        id="tools-menu"
        className={`absolute top-full left-1/2 z-10 w-[min(40rem,90vw)] -translate-x-1/2 pt-3 transition-[opacity,transform,visibility] duration-300 ${open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"}`}
      >
        <div className="rounded-lg border border-line-2 bg-ink-2/95 p-3 shadow-2xl shadow-black/50 backdrop-blur-md">
          <ul className="grid grid-cols-2 gap-1">
            {tools.map((t) => {
              const here = pathname === t.href;
              return (
                <li key={t.slug}>
                  <TLink
                    href={t.href}
                    tabIndex={open ? 0 : -1}
                    aria-current={here ? "page" : undefined}
                    className={`group/tool block rounded-md px-4 py-3 transition-colors hover:bg-ink-3 ${here ? "bg-ink-3" : ""}`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-[0.95rem] font-medium text-bone">{t.name}</span>
                      <span className="t-label shrink-0 whitespace-nowrap !text-[0.55rem] ember">{t.kind}</span>
                    </span>
                    <span className="mt-1 block text-xs leading-snug text-bone-dim">{t.short}</span>
                  </TLink>
                </li>
              );
            })}
          </ul>
          <TLink href={TOOLS_HUB.href} tabIndex={open ? 0 : -1} className="t-label mt-2 flex items-center justify-between rounded-md border-t border-line px-4 pt-3 pb-1 !text-bone hover:!text-ember">
            All free SEO tools <span aria-hidden="true">→</span>
          </TLink>
        </div>
      </div>
    </li>
  );
}
