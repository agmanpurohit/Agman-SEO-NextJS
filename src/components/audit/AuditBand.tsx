"use client";

import { usePathname } from "next/navigation";
import { ButtonLink } from "@/components/ui/Buttons";
import { auditTool } from "@/content/site";

/** Sitewide promo for the free audit, shown above the footer on every page except the tool itself. */
export function AuditBand() {
  const pathname = usePathname();
  if (pathname.startsWith(auditTool.href) || pathname.startsWith("/admin")) return null;
  return (
    <aside aria-label="Free SEO audit" className="relative overflow-hidden border-t border-line">
      <div className="wrap flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between md:py-12">
        <div className="flex items-start gap-5">
          <span aria-hidden="true" className="mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-ember/60">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-ember">
              <circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="m15 15 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <div>
            <p className="t-label ember">Free tool</p>
            <p className="mt-1 text-[clamp(1.3rem,2.4vw,2rem)] leading-tight font-semibold tracking-tight">Discover what’s holding your website back.</p>
            <p className="t-body mt-1 text-sm">A real crawl of up to 100 pages, scored across technical, on-page, content, speed and more. No sign-up.</p>
          </div>
        </div>
        <ButtonLink href={auditTool.href} cursor="Audit">
          Start free SEO audit
        </ButtonLink>
      </div>
    </aside>
  );
}
