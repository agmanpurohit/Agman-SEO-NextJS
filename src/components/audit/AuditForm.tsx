"use client";

import { useId, useState, type FormEvent } from "react";
import { useTransition } from "@/components/shell/TransitionProvider";
import { Magnetic } from "@/components/ui/Magnetic";

/** URL entry that starts a real audit and moves the visitor to its live progress page. */
export function AuditForm({ size = "lg", autoFocus = false }: { size?: "lg" | "md"; autoFocus?: boolean }) {
  const { go } = useTransition();
  const uid = useId();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = url.trim();
    if (!value) return setError("Please enter your website address.");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value, company: new FormData(e.currentTarget).get("company") ?? "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.id) {
        setError(data.error ?? "We couldn’t start the audit. Please try again.");
        setBusy(false);
        return;
      }
      go(`/seo-audit/${data.id}`);
    } catch {
      setError("Network error — please check your connection and try again.");
      setBusy(false);
    }
  }

  const big = size === "lg";
  return (
    <form onSubmit={submit} noValidate className="w-full" aria-describedby={error ? `${uid}-err` : undefined}>
      <div
        className={`group relative flex flex-col gap-3 border bg-ink-2/80 p-2 backdrop-blur-sm transition-colors duration-300 focus-within:border-bone sm:flex-row sm:items-center ${
          error ? "border-ember" : "border-line-2"
        } ${big ? "sm:p-2.5" : ""}`}
      >
        <label htmlFor={`${uid}-url`} className="sr-only">
          Website URL
        </label>
        <span aria-hidden="true" className="t-label hidden pl-3 sm:inline">
          URL
        </span>
        <input
          id={`${uid}-url`}
          name="url"
          type="url"
          inputMode="url"
          autoComplete="url"
          autoCapitalize="off"
          spellCheck={false}
          autoFocus={autoFocus}
          placeholder="https://www.example.com"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError("");
          }}
          aria-invalid={error ? true : undefined}
          className={`min-w-0 flex-1 bg-transparent px-3 text-bone outline-none placeholder:text-mute focus-visible:outline-none ${big ? "h-14 text-lg md:text-xl" : "h-12 text-base"}`}
        />
        {/* Honeypot */}
        <input name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px" />
        <Magnetic strength={0.15}>
          <button type="submit" disabled={busy} className={`btn btn-primary w-full justify-center sm:w-auto ${big ? "!h-14 !px-7" : ""}`} data-cursor="Audit">
            {busy ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border border-ink border-t-transparent" aria-hidden="true" />
                <span>Starting…</span>
              </>
            ) : (
              <span>Start Free SEO Audit</span>
            )}
          </button>
        </Magnetic>
      </div>
      <p id={`${uid}-err`} role="alert" aria-live="polite" className="mt-3 min-h-[1.25rem] text-sm text-ember-soft">
        {error}
      </p>
    </form>
  );
}

export const AUDIT_BADGES = ["100% Free Website Audit", "No Registration Required", "Comprehensive SEO Analysis", "Actionable Recommendations"];

export function AuditBadges({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-x-6 gap-y-2 ${className}`}>
      {AUDIT_BADGES.map((b) => (
        <li key={b} className="t-label flex items-center gap-2 !text-bone">
          <svg viewBox="0 0 12 12" className="h-3 w-3 text-ember" aria-hidden="true">
            <path d="M2 6.5 4.8 9 10 3" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          {b}
        </li>
      ))}
    </ul>
  );
}
