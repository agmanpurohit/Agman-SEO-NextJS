"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { useTransition } from "@/components/shell/TransitionProvider";

/** Internal link that routes through the cinematic page transition. */
export function TLink({ href, onClick, ...rest }: ComponentProps<typeof Link> & { href: string }) {
  const { go } = useTransition();
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (rest.target && rest.target !== "_self") return;
    e.preventDefault();
    go(href);
  };
  return <Link href={href} onClick={handle} {...rest} />;
}
