"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { site } from "@/content/site";
import { Magnetic } from "@/components/ui/Magnetic";
import { useSite } from "@/components/shell/SiteSettingsProvider";

const TYPES = ["Job opportunity", "Freelance project", "Digital marketing services", "Website development", "Collaboration", "Other"];

type Errors = Partial<Record<"name" | "email" | "subject" | "inquiry" | "message", string>>;
type Status = "idle" | "sending" | "sent" | "error" | "unconfigured";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(v: Record<string, string>): Errors {
  const e: Errors = {};
  if (v.name.trim().length < 2) e.name = "Please enter your name.";
  if (!EMAIL_RE.test(v.email.trim())) e.email = "Please enter a valid email address.";
  if (v.subject.trim().length < 3) e.subject = "Please add a short subject.";
  if (!TYPES.includes(v.inquiry)) e.inquiry = "Please choose an enquiry type.";
  if (v.message.trim().length < 20) e.message = "Please write at least a couple of sentences (20+ characters).";
  return e;
}

/** Contact form with inline validation, honeypot, loading and honest result states. */
export function ContactForm() {
  const liveSite = useSite();
  const [values, setValues] = useState({ name: "", email: "", subject: "", inquiry: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverMsg, setServerMsg] = useState("");
  const startedAt = useRef(Date.now());
  const form = useRef<HTMLFormElement>(null);
  const done = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status !== "sent" || !done.current) return;
    done.current.focus();
    if (prefersReducedMotion()) return;
    gsap.from(done.current.querySelectorAll("[data-d]"), { y: 40, autoAlpha: 0, stagger: 0.08, duration: 1 });
  }, [status]);

  const set = (k: keyof typeof values, v: string) => {
    const next = { ...values, [k]: v };
    setValues(next);
    if (touched[k]) setErrors(validate(next));
  };
  const blur = (k: string) => {
    setTouched((t) => ({ ...t, [k]: true }));
    setErrors(validate(values));
  };

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validate(values);
    setErrors(errs);
    setTouched({ name: true, email: true, subject: true, inquiry: true, message: true });
    if (Object.keys(errs).length) {
      form.current?.querySelector<HTMLElement>(`[name="${Object.keys(errs)[0]}"]`)?.focus();
      return;
    }
    setStatus("sending");
    setServerMsg("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, company: fd.get("company") ?? "", startedAt: startedAt.current }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) return setStatus("sent");
      if (res.status === 422 && data.errors) {
        setErrors(data.errors);
        return setStatus("idle");
      }
      if (res.status === 503) return setStatus("unconfigured");
      setServerMsg(typeof data.error === "string" && data.error.length > 20 ? data.error : "");
      setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div ref={done} tabIndex={-1} role="status" className="flex min-h-[28rem] flex-col justify-center border border-line p-8 outline-none md:p-14">
        <span data-d className="t-label ember">
          Message received
        </span>
        <p data-d className="mt-6 text-[clamp(2rem,4vw,3.5rem)] leading-[1] font-semibold tracking-[-0.03em]">
          Thank you, {values.name.split(" ")[0]}.
        </p>
        <p data-d className="t-lead mt-6 max-w-[32rem] text-bone-dim">
          Your message is in my inbox. I&apos;ll reply to {values.email} personally.
        </p>
      </div>
    );
  }

  const field = "peer w-full border-0 border-b border-line-2 bg-transparent px-0 pt-7 pb-3 text-lg text-bone outline-none transition-colors placeholder:text-transparent focus:border-bone focus-visible:outline-none";
  const label =
    "t-label pointer-events-none absolute top-7 left-0 origin-left transition-all duration-300 peer-focus:top-0 peer-focus:scale-90 peer-focus:!text-ember peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90";
  const err = (k: keyof Errors) =>
    touched[k] && errors[k] ? (
      <p id={`${k}-error`} className="mt-2 text-sm text-ember-soft" role="alert">
        {errors[k]}
      </p>
    ) : null;
  const aria = (k: keyof Errors) => ({
    "aria-invalid": touched[k] && errors[k] ? true : undefined,
    "aria-describedby": touched[k] && errors[k] ? `${k}-error` : undefined,
  });

  return (
    <form ref={form} onSubmit={submit} noValidate className="flex flex-col gap-8" aria-describedby="form-note">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative">
          <input id="name" name="name" autoComplete="name" required placeholder="Full name" className={field} value={values.name} onChange={(e) => set("name", e.target.value)} onBlur={() => blur("name")} {...aria("name")} />
          <label htmlFor="name" className={label}>
            Full name *
          </label>
          {err("name")}
        </div>
        <div className="relative">
          <input id="email" name="email" type="email" autoComplete="email" required placeholder="Email address" className={field} value={values.email} onChange={(e) => set("email", e.target.value)} onBlur={() => blur("email")} {...aria("email")} />
          <label htmlFor="email" className={label}>
            Email address *
          </label>
          {err("email")}
        </div>
      </div>

      <fieldset>
        <legend className="t-label mb-4">Enquiry type *</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-describedby={touched.inquiry && errors.inquiry ? "inquiry-error" : undefined}>
          {TYPES.map((t) => (
            <label key={t} className="cursor-pointer">
              <input
                type="radio"
                name="inquiry"
                value={t}
                checked={values.inquiry === t}
                onChange={() => {
                  set("inquiry", t);
                  setTouched((x) => ({ ...x, inquiry: true }));
                }}
                className="peer sr-only"
              />
              <span className="block rounded-full border border-line-2 px-4 py-2 text-sm text-bone-dim transition-colors duration-300 peer-checked:border-ember peer-checked:bg-ember peer-checked:text-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ember hover:border-bone hover:text-bone">
                {t}
              </span>
            </label>
          ))}
        </div>
        {err("inquiry")}
      </fieldset>

      <div className="relative">
        <input id="subject" name="subject" required placeholder="Subject" className={field} value={values.subject} onChange={(e) => set("subject", e.target.value)} onBlur={() => blur("subject")} {...aria("subject")} />
        <label htmlFor="subject" className={label}>
          Subject *
        </label>
        {err("subject")}
      </div>

      <div className="relative">
        <textarea id="message" name="message" required rows={5} placeholder="Message" className={`${field} resize-y`} value={values.message} onChange={(e) => set("message", e.target.value)} onBlur={() => blur("message")} {...aria("message")} />
        <label htmlFor="message" className={label}>
          Message *
        </label>
        {err("message")}
      </div>

      {/* Honeypot: hidden from people and assistive tech, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="company">Company website</label>
        <input id="company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <p id="form-note" className="t-body max-w-[26rem] text-sm">
          Fields marked * are required. Your details are only used to reply to you.
        </p>
        <Magnetic>
          <button type="submit" disabled={status === "sending"} className="btn btn-primary min-w-[12rem] justify-center disabled:opacity-70" data-cursor="Send">
            {status === "sending" ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border border-ink border-t-transparent" aria-hidden="true" />
                <span>Sending…</span>
              </>
            ) : (
              <span>Send message</span>
            )}
          </button>
        </Magnetic>
      </div>

      <div aria-live="polite">
        {status === "error" && (
          <p className="border-l border-ember pl-4 text-bone">
            {serverMsg || "Something went wrong while sending."} You can also email me directly at{" "}
            <a className="underline" href={`mailto:${liveSite.email}`}>
              {liveSite.email}
            </a>
            .
          </p>
        )}
        {status === "unconfigured" && (
          <p className="border-l border-ember pl-4 text-bone">
            The form can&apos;t send messages just yet. Please email me directly at{" "}
            <a className="underline" href={`mailto:${liveSite.email}?subject=${encodeURIComponent(values.subject)}`}>
              {liveSite.email}
            </a>
            {liveSite.locations[0].whatsapp && (
              <>
                {" "}
                or message me on{" "}
                <a className="underline" href={liveSite.locations[0].whatsapp} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              </>
            )}
            .
          </p>
        )}
      </div>
    </form>
  );
}
