"use client";

import { useId, useState, type ReactNode, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";

/** Building blocks shared by the free tools, matching the site's ink / bone / ember look. */

export const inputCls =
  "w-full rounded-md border border-line-2 bg-ink-2 px-3.5 py-2.5 text-[0.95rem] text-bone outline-none transition-colors placeholder:text-mute focus:border-bone";

export function Panel({ title, children, className = "", actions }: { title?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <div className={`rounded-lg border border-line bg-ink-2/60 p-5 md:p-7 ${className}`}>
      {(title || actions) && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="t-label !text-bone">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

type FieldProps = { label: string; hint?: ReactNode; count?: { value: number; min?: number; max: number; unit?: string }; children: (id: string) => ReactNode; className?: string };

/** Label + control + optional hint and live character counter. */
export function Field({ label, hint, count, children, className = "" }: FieldProps) {
  const id = useId();
  const state = count ? (count.value === 0 ? "empty" : count.value > count.max ? "over" : count.min && count.value < count.min ? "short" : "ok") : null;
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-bone">
          {label}
        </label>
        {count && (
          <span className={`t-mono text-xs ${state === "over" ? "text-ember" : state === "short" ? "text-ember-soft" : state === "ok" ? "text-[#7fd6a4]" : "text-mute"}`}>
            {count.value} / {count.max}
            {count.unit ?? ""}
          </span>
        )}
      </div>
      {children(id)}
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-mute">{hint}</p>}
    </div>
  );
}

export const TextInput = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={`${inputCls} ${p.className ?? ""}`} />;
export const TextArea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={`${inputCls} resize-y leading-relaxed ${p.className ?? ""}`} />;
export const Select = ({ children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className={`${inputCls} cursor-pointer appearance-none bg-[length:12px] bg-[right_0.9rem_center] bg-no-repeat pr-9 ${p.className ?? ""}`} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23aca79e' fill='none' stroke-width='1.5'/%3E%3C/svg%3E\")" }}>
    {children}
  </select>
);

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span aria-hidden="true" className="relative mt-0.5 h-5 w-9 shrink-0 rounded-full bg-line-2 transition-colors peer-checked:bg-ember peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-bone after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-bone after:transition-transform peer-checked:after:translate-x-4" />
      <span>
        <span className="block text-sm text-bone">{label}</span>
        {hint && <span className="block text-xs text-mute">{hint}</span>}
      </span>
    </label>
  );
}

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border border-line-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full px-4 py-1.5 text-sm transition-colors ${value === o.value ? "bg-bone text-ink" : "text-bone-dim hover:text-bone"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SmallButton({ children, onClick, variant = "ghost", disabled, type = "button" }: { children: ReactNode; onClick?: () => void; variant?: "ghost" | "primary"; disabled?: boolean; type?: "button" | "submit" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        variant === "primary" ? "bg-bone text-ink hover:bg-ember hover:text-ink" : "border border-line-2 text-bone hover:border-bone"
      }`}
    >
      {children}
    </button>
  );
}

export function CopyButton({ text, label = "Copy", onCopied }: { text: string; label?: string; onCopied?: () => void }) {
  const [done, setDone] = useState(false);
  return (
    <SmallButton
      disabled={!text}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setDone(true);
        onCopied?.();
        setTimeout(() => setDone(false), 1800);
      }}
    >
      <span aria-live="polite">{done ? "Copied ✓" : label}</span>
    </SmallButton>
  );
}

export function DownloadButton({ text, filename, mime = "text/plain", label = "Download", onDownloaded }: { text: string; filename: string; mime?: string; label?: string; onDownloaded?: () => void }) {
  return (
    <SmallButton
      disabled={!text}
      onClick={() => {
        const url = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }));
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        onDownloaded?.();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }}
    >
      {label}
    </SmallButton>
  );
}

/** Read-only code output with copy (and optional download). */
export function CodeOutput({ code, title = "Your code", filename, mime, minRows = 8, extra, onAction }: { code: string; title?: string; filename?: string; mime?: string; minRows?: number; extra?: ReactNode; onAction?: (action: "copy" | "download") => void }) {
  return (
    <Panel
      title={title}
      actions={
        <div className="flex flex-wrap gap-2">
          {extra}
          <CopyButton text={code} onCopied={() => onAction?.("copy")} />
          {filename && <DownloadButton text={code} filename={filename} mime={mime} onDownloaded={() => onAction?.("download")} />}
        </div>
      }
    >
      <pre
        tabIndex={0}
        aria-label={title}
        className="t-mono max-h-[34rem] overflow-auto rounded-md border border-line bg-ink p-4 text-[0.8rem] leading-6 whitespace-pre text-bone-dim"
        style={{ minHeight: `${minRows * 1.5}rem` }}
      >
        {code || "// Fill in the form to generate code"}
      </pre>
    </Panel>
  );
}

export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: "good" | "warn" | "bad" }) {
  return (
    <div className="rounded-md border border-line bg-ink p-4">
      <p className="t-label !text-[0.62rem]">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${tone === "bad" ? "text-ember" : tone === "warn" ? "text-ember-soft" : tone === "good" ? "text-[#7fd6a4]" : "text-bone"}`}>{value}</p>
    </div>
  );
}

export const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
