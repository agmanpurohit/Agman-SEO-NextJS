"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Magnetic } from "@/components/ui/Magnetic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const key = (id: string) => `seo-audit-token:${id}`;

/**
 * Shown only after the audit is complete. Name + email unlock the PDF report;
 * marketing consent is a separate, unticked, optional box.
 */
export function LeadCapture({ id, domain }: { id: string; domain: string }) {
  const uid = useId();
  const [token, setToken] = useState<string | null>(null);
  const [emailed, setEmailed] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    try {
      const t = localStorage.getItem(key(id));
      if (t) setToken(t);
    } catch {}
  }, [id]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return; // guard against double submission
    const errs: typeof errors = {};
    if (name.trim().length < 2) errs.name = "Please enter your full name.";
    if (!EMAIL.test(email.trim())) errs.email = "Please enter a valid email address.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/audits/${id}/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), consent, startedAt: startedAt.current, company: new FormData(e.currentTarget).get("company") ?? "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 422 && data.errors) setErrors(data.errors);
      else if (!res.ok || !data.token) setErrors({ form: data.error ?? "Something went wrong. Please try again." });
      else {
        setToken(data.token);
        setEmailed(!!data.emailedToVisitor);
        try {
          localStorage.setItem(key(id), data.token);
        } catch {}
      }
    } catch {
      setErrors({ form: "Network error. Please try again." });
    }
    setBusy(false);
  }

  const download = token ? `/api/audits/${id}/report?token=${encodeURIComponent(token)}` : "";

  return (
    <section className="wrap mt-16" aria-labelledby={`${uid}-t`}>
      <div className="relative overflow-hidden border border-ember/50 bg-ink-2/70 p-6 md:p-10">
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-ember/10 blur-3xl" />
        {token ? (
          <div className="relative" role="status">
            <p className="t-label ember">Report ready</p>
            <h2 id={`${uid}-t`} className="t-h2 mt-3">
              Your full SEO report for {domain}.
            </h2>
            <p className="t-lead mt-4 max-w-[40rem] text-bone-dim">
              {emailed ? "We’ve also emailed a copy to you. " : ""}Download the PDF with every finding, affected URL and the prioritised action plan.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Magnetic>
                <a href={download} className="btn btn-primary" data-cursor="PDF">
                  <span>Download PDF report</span>
                </a>
              </Magnetic>
            </div>
          </div>
        ) : (
          <div className="relative grid gap-10 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <p className="t-label ember">Free PDF report</p>
              <h2 id={`${uid}-t`} className="t-h2 mt-3">
                Your SEO Audit Is Ready!
              </h2>
              <p className="t-lead mt-4 text-bone-dim">We&apos;ve completed your website analysis. Enter your details below to receive your complete SEO audit report.</p>
            </div>
            <form onSubmit={submit} noValidate className="flex flex-col gap-5">
              <div>
                <label htmlFor={`${uid}-name`} className="t-label">
                  Full Name *
                </label>
                <input
                  id={`${uid}-name`}
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={errors.name ? `${uid}-ne` : undefined}
                  className="mt-1 h-12 w-full border-b border-line-2 bg-transparent text-lg text-bone outline-none focus:border-bone"
                />
                {errors.name && (
                  <p id={`${uid}-ne`} role="alert" className="mt-1 text-sm text-ember-soft">
                    {errors.name}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor={`${uid}-email`} className="t-label">
                  Email Address *
                </label>
                <input
                  id={`${uid}-email`}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? `${uid}-ee` : undefined}
                  className="mt-1 h-12 w-full border-b border-line-2 bg-transparent text-lg text-bone outline-none focus:border-bone"
                />
                {errors.email && (
                  <p id={`${uid}-ee`} role="alert" className="mt-1 text-sm text-ember-soft">
                    {errors.email}
                  </p>
                )}
              </div>
              <label className="flex cursor-pointer items-start gap-3 text-sm text-bone-dim">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-[#ff5a1f]" />
                <span>Optional: I’d like occasional SEO tips and updates from Agman Rajpurohit. You can unsubscribe at any time.</span>
              </label>
              <input name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px" />
              {errors.form && (
                <p role="alert" className="border-l border-ember pl-3 text-sm text-bone">
                  {errors.form}
                </p>
              )}
              <div className="flex flex-col gap-5">
                <p className="t-body text-xs">
                  Privacy: your name and email are stored with this audit so the report can be prepared and Agman can follow up about it. No marketing emails unless you tick the box
                  above. <a href="/seo-audit#privacy-title" className="underline">More</a>
                </p>
                <Magnetic>
                  <button type="submit" disabled={busy} className="btn btn-primary w-full justify-center disabled:opacity-70 sm:w-auto" data-cursor="PDF">
                    {busy ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border border-ink border-t-transparent" aria-hidden="true" />
                        <span>Preparing report…</span>
                      </>
                    ) : (
                      <span>Get My Free SEO Report</span>
                    )}
                  </button>
                </Magnetic>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
