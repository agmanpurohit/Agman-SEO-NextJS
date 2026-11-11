import { Fragment, type ReactNode } from "react";
import { TLink } from "@/components/ui/TLink";

/**
 * Renders copy that contains [label](/path) links. Internal paths become page-transition
 * links (real <a href> in the HTML, so crawlers follow them); http(s) links open safely.
 */
export function RichText({ text, linkClassName = "text-bone underline decoration-ember/70 underline-offset-4 transition-colors hover:text-ember" }: { text: string; linkClassName?: string }) {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(<Fragment key={i++}>{text.slice(last, m.index)}</Fragment>);
    const [, label, href] = m;
    out.push(
      href.startsWith("/") ? (
        <TLink key={i++} href={href} className={linkClassName}>
          {label}
        </TLink>
      ) : (
        <a key={i++} href={href} target="_blank" rel="noopener noreferrer" className={linkClassName}>
          {label}
        </a>
      ),
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(<Fragment key={i++}>{text.slice(last)}</Fragment>);
  return <>{out}</>;
}

/** Plain text version (for JSON-LD and meta): [label](/path) → label. */
export const plainText = (text: string) => text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1");
