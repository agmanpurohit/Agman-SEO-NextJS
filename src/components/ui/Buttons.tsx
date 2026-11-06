import type { ReactNode } from "react";
import { TLink } from "@/components/ui/TLink";
import { Magnetic } from "@/components/ui/Magnetic";

const Arrow = ({ dir = "right" }: { dir?: "right" | "down" | "up-right" }) => (
  <svg className="btn-arrow h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    {dir === "right" && <path d="M1 6h10M6.5 1.5 11 6l-4.5 4.5" stroke="currentColor" strokeWidth="1.3" />}
    {dir === "down" && <path d="M6 1v10M1.5 6.5 6 11l4.5-4.5" stroke="currentColor" strokeWidth="1.3" />}
    {dir === "up-right" && <path d="M2 10 10 2M3.5 2H10v6.5" stroke="currentColor" strokeWidth="1.3" />}
  </svg>
);

type Common = { children: ReactNode; variant?: "primary" | "ghost"; className?: string; cursor?: string };

/** Primary / ghost pill button for internal routes (with page transition). */
export function ButtonLink({ href, children, variant = "primary", className = "", cursor }: Common & { href: string }) {
  return (
    <Magnetic>
      <TLink href={href} className={`btn btn-${variant} ${className}`} data-cursor={cursor}>
        <span>{children}</span>
        <Arrow />
      </TLink>
    </Magnetic>
  );
}

/** Same look for external links, downloads, mailto and tel. */
export function ButtonA({
  href,
  children,
  variant = "ghost",
  className = "",
  download,
  external,
  arrow = "right",
  cursor,
}: Common & { href: string; download?: boolean; external?: boolean; arrow?: "right" | "down" | "up-right" }) {
  return (
    <Magnetic>
      <a
        href={href}
        className={`btn btn-${variant} ${className}`}
        download={download || undefined}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        data-cursor={cursor}
      >
        <span>{children}</span>
        <Arrow dir={arrow} />
      </a>
    </Magnetic>
  );
}

/** Small section label: index number + name, with a hairline. */
export function SectionLabel({ index, children, className = "" }: { index: string; children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <span className="t-label ember">{index}</span>
      <span className="h-px w-10 bg-line-2" aria-hidden="true" />
      <span className="t-label">{children}</span>
    </div>
  );
}
