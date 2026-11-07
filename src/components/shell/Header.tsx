"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { lockScroll } from "@/lib/scroll";
import { nav, site, primaryLocation, auditTool } from "@/content/site";
import { TLink } from "@/components/ui/TLink";
import { Logo } from "@/components/brand/Logo";
import { Magnetic } from "@/components/ui/Magnetic";

const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const bar = useRef<HTMLElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const marker = useRef<HTMLSpanElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  // Active indicator: an ember tick that glides to the current page (desktop).
  useEffect(() => {
    const place = () => {
      const ul = list.current;
      const m = marker.current;
      if (!ul || !m) return;
      const active = ul.querySelector<HTMLElement>("[aria-current='page']");
      if (!active) return gsap.to(m, { autoAlpha: 0, duration: 0.3 });
      const a = active.getBoundingClientRect();
      const u = ul.getBoundingClientRect();
      gsap.to(m, { x: a.left - u.left, width: a.width, autoAlpha: 1, duration: 0.8, ease: "cine" });
    };
    place();
    document.fonts?.ready.then(place);
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [pathname]);

  // Hide on scroll down, reveal on scroll up.
  useEffect(() => {
    let lastY = window.scrollY;
    let hidden = false;
    const onScroll = () => {
      const y = window.scrollY;
      const down = y > lastY && y > 160;
      if (down !== hidden && !open) {
        hidden = down;
        gsap.to(bar.current, { yPercent: down ? -110 : 0, duration: 0.6, ease: "cine" });
      }
      bar.current?.classList.toggle("is-scrolled", y > 40);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open]);

  // Mobile / full-screen menu.
  useEffect(() => {
    const el = menu.current;
    if (!el) return;
    lockScroll(open);
    const reduced = prefersReducedMotion();
    if (open) {
      gsap.set(el, { visibility: "visible" });
      const tl = gsap.timeline();
      tl.fromTo(el, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: reduced ? 0 : 0.8, ease: "wipe" })
        .fromTo(el.querySelectorAll("[data-m-item]"), { yPercent: 110 }, { yPercent: 0, stagger: 0.06, duration: reduced ? 0 : 0.9 }, reduced ? 0 : 0.3)
        .fromTo(el.querySelectorAll("[data-m-fade]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, reduced ? 0 : 0.6);
      el.querySelector<HTMLElement>("a")?.focus({ preventScroll: true });
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    } else if (el.style.visibility === "visible") {
      gsap.to(el, {
        clipPath: "inset(0% 0% 100% 0%)",
        duration: reduced ? 0 : 0.7,
        ease: "wipe",
        onComplete: () => {
          gsap.set(el, { visibility: "hidden" });
        },
      });
    }
  }, [open]);

  // Close the menu whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <a href="#main" className="sr-only-focusable fixed top-3 left-3 z-[120] rounded bg-bone px-4 py-2 text-ink">
        Skip to content
      </a>
      <header
        ref={bar}
        className="group fixed inset-x-0 top-0 z-[80] transition-[background-color,backdrop-filter] duration-500 [&.is-scrolled]:bg-ink/70 [&.is-scrolled]:backdrop-blur-md"
      >
        <div className="wrap flex h-[var(--header-h)] items-center justify-between">
          <TLink href="/" aria-label="Agman Rajpurohit — home" className="relative z-[2] flex items-center gap-3" data-cursor="Home">
            <Logo variant="mark" title={null} className="h-7 w-auto text-bone md:h-8" />
            <span className="t-label hidden !text-bone xl:inline">Agman Rajpurohit</span>
          </TLink>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul ref={list} className="relative flex items-center gap-1">
              {nav.map((n) => {
                const active = isActive(pathname, n.href);
                return (
                  <li key={n.href}>
                    <TLink
                      href={n.href}
                      aria-current={active ? "page" : undefined}
                      className={`group/nav relative flex items-baseline gap-1.5 whitespace-nowrap px-2.5 py-2 transition-colors duration-300 xl:px-3.5 ${active ? "text-bone" : "text-bone-dim hover:text-bone"}`}
                    >
                      <span className="t-label !text-[0.6rem] ember opacity-70">{n.index}</span>
                      <span className="relative block overflow-hidden text-[0.95rem] font-medium">
                        <span className="block transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover/nav:-translate-y-full">{n.label}</span>
                        <span aria-hidden="true" className="absolute inset-0 block translate-y-full transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover/nav:translate-y-0">
                          {n.label}
                        </span>
                      </span>
                    </TLink>
                  </li>
                );
              })}
              <span ref={marker} aria-hidden="true" className="pointer-events-none absolute -bottom-0.5 left-0 h-px bg-ember opacity-0" style={{ width: 0 }} />
            </ul>
          </nav>

          <div className="hidden items-center gap-5 xl:flex">
            <span className="t-label hidden items-center gap-2 2xl:flex">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ember" />
              </span>
              {site.availability} · {primaryLocation.city}
            </span>
            <Magnetic>
              <TLink href={auditTool.href} className="btn btn-primary !h-11 !px-5" data-cursor="Audit">
                {auditTool.label}
              </TLink>
            </Magnetic>
          </div>

          {/* Below desktop: a compact audit button stays visible next to the menu toggle. */}
          <div className="relative z-[2] flex items-center gap-4 lg:hidden">
            {!pathname.startsWith(auditTool.href) && (
              <TLink href={auditTool.href} className="btn btn-primary !h-9 !gap-2 !px-3.5 !text-[0.62rem]">
                Free audit
              </TLink>
            )}
          <button
            ref={toggle}
            type="button"
            className="relative flex h-11 items-center gap-3"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="t-label !text-bone">{open ? "Close" : "Menu"}</span>
            <span className="relative block h-3 w-6" aria-hidden="true">
              <span className={`absolute left-0 h-px w-full bg-bone transition-transform duration-500 ${open ? "top-1/2 rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 h-px w-full bg-bone transition-transform duration-500 ${open ? "top-1/2 -rotate-45" : "bottom-0"}`} />
            </span>
          </button>
          </div>
        </div>
      </header>

      <div
        ref={menu}
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className="fixed inset-0 z-[79] flex flex-col bg-ink-2 pt-[var(--header-h)] lg:hidden"
        style={{ visibility: "hidden", clipPath: "inset(0% 0% 100% 0%)" }}
      >
        <nav aria-label="Mobile" className="wrap flex flex-1 flex-col justify-center">
          <ul className="flex flex-col gap-1">
            {nav.map((n) => {
              const active = isActive(pathname, n.href);
              return (
                <li key={n.href} className="overflow-hidden border-b border-line">
                  <TLink
                    href={n.href}
                    tabIndex={open ? 0 : -1}
                    aria-current={active ? "page" : undefined}
                    data-m-item
                    className="flex items-baseline justify-between py-4"
                  >
                    <span className={`text-[clamp(2.2rem,10.5vw,4.5rem)] leading-none font-bold tracking-tight uppercase ${active ? "text-bone" : "text-bone-dim"}`} style={{ fontStretch: "112%" }}>
                      {n.label}
                    </span>
                    <span className={`t-label ${active ? "ember" : ""}`}>{n.index}</span>
                  </TLink>
                </li>
              );
            })}
          </ul>
        </nav>
        <div data-m-fade className="wrap flex flex-col gap-3 pb-10">
          <a href={`mailto:${site.email}`} tabIndex={open ? 0 : -1} className="text-lg text-bone">
            {site.email}
          </a>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <a href={primaryLocation.whatsapp ?? "#"} tabIndex={open ? 0 : -1} className="t-label !text-bone" target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
            <a href={site.linkedin} tabIndex={open ? 0 : -1} className="t-label !text-bone" target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
            <a href={site.cv} tabIndex={open ? 0 : -1} className="t-label !text-bone" download>
              Download CV
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
