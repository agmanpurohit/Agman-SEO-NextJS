"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { SiteSettings } from "@/lib/site/settings-shared";

const input = "w-full rounded border border-line-2 bg-ink-2 px-3 py-2.5 text-sm text-bone outline-none placeholder:text-mute focus:border-bone";

function Field({ label, hint, error, children }: { label: string; hint?: ReactNode; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="t-label mb-1.5 block">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-ember-soft">{error}</span> : hint ? <span className="mt-1 block text-xs text-mute">{hint}</span> : null}
    </label>
  );
}

function Section({ title, where, children }: { title: string; where: string; children: ReactNode }) {
  return (
    <section className="border border-line p-5 md:p-6">
      <h2 className="t-label !text-bone">{title}</h2>
      <p className="mt-1 text-xs text-mute">Shown in: {where}</p>
      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function SettingsForm({ initial, defaults, isCustom }: { initial: SiteSettings; defaults: SiteSettings; isCustom: boolean }) {
  const router = useRouter();
  const [s, setS] = useState<SiteSettings>(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => setS((p) => ({ ...p, [k]: v }));
  const setA = (k: keyof SiteSettings["announcement"], v: string | boolean) => setS((p) => ({ ...p, announcement: { ...p.announcement, [k]: v } }));
  const dirty = JSON.stringify(s) !== saved;

  async function save() {
    setBusy(true);
    setErrors({});
    setNotice(null);
    const res = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErrors(data.errors ?? {});
      return setNotice({ ok: false, text: data.error ?? "Some fields need fixing." });
    }
    setS(data.settings);
    setSaved(JSON.stringify(data.settings));
    setNotice({ ok: true, text: "Saved. Every page now shows the new details." });
    router.refresh();
  }

  async function reset() {
    if (!window.confirm("Go back to the details in the code? Your saved settings will be removed.")) return;
    setBusy(true);
    const res = await fetch("/api/admin/settings", { method: "DELETE" });
    setBusy(false);
    if (!res.ok) return setNotice({ ok: false, text: "Couldn't reset." });
    setS(defaults);
    setSaved(JSON.stringify(defaults));
    setNotice({ ok: true, text: "Back to the built-in details." });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-20 -mx-[var(--gutter)] flex flex-wrap items-center gap-3 border-b border-line bg-ink/90 px-[var(--gutter)] py-3 backdrop-blur-md">
        {dirty ? <span className="t-label !text-[#f0b64a]">Unsaved changes</span> : <span className="t-label">{isCustom ? "Custom settings" : "Using built-in details"}</span>}
        {notice && <span className={`text-sm ${notice.ok ? "text-[#4fd18b]" : "text-ember-soft"}`}>{notice.text}</span>}
        <div className="ml-auto flex gap-2">
          <button type="button" className="btn btn-ghost !h-10 !px-4 disabled:opacity-40" disabled={busy || !isCustom} onClick={reset}>
            Reset to built-in
          </button>
          <button type="button" className="btn btn-primary !h-10 !px-5 disabled:opacity-50" disabled={busy || !dirty} onClick={save}>
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <Section title="Contact details" where="footer, contact page, mobile menu, contact form, structured data">
        <Field label="Email" error={errors.email}>
          <input className={input} type="email" value={s.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Dubai phone" error={errors.dubaiPhone}>
          <input className={input} value={s.dubaiPhone} onChange={(e) => set("dubaiPhone", e.target.value)} placeholder="+971 50 000 0000" />
        </Field>
        <Field label="WhatsApp link" error={errors.dubaiWhatsapp} hint="e.g. https://wa.me/971500000000. Leave empty to hide WhatsApp links.">
          <input className={input} value={s.dubaiWhatsapp} onChange={(e) => set("dubaiWhatsapp", e.target.value)} inputMode="url" />
        </Field>
        <Field label="India phone" error={errors.indiaPhone}>
          <input className={input} value={s.indiaPhone} onChange={(e) => set("indiaPhone", e.target.value)} placeholder="+91 00000 00000" />
        </Field>
      </Section>

      <Section title="Profiles" where="footer, contact page, mobile menu, blog author box, structured data (sameAs)">
        <Field label="LinkedIn URL" error={errors.linkedin}>
          <input className={input} value={s.linkedin} onChange={(e) => set("linkedin", e.target.value)} inputMode="url" />
        </Field>
      </Section>

      <Section title="Availability" where="header (desktop), homepage hero, experience page, contact page">
        <Field label="Short line" error={errors.availability} hint="A few words, e.g. “Available immediately”.">
          <input className={input} value={s.availability} onChange={(e) => set("availability", e.target.value)} maxLength={60} />
        </Field>
        <Field label="Full sentence" hint="Shown on the contact page.">
          <textarea className={`${input} resize-y`} rows={3} value={s.availabilityLong} onChange={(e) => set("availabilityLong", e.target.value)} maxLength={400} />
        </Field>
      </Section>

      <Section title="Analytics" where="every public page (live domain only, never on /admin)">
        <Field
          label="Google Tag Manager container ID"
          error={errors.gtmId}
          hint={s.gtmId ? "GA4 is configured inside this GTM container." : <span className="text-[#f0b64a]">Empty: analytics is turned off on the whole site.</span>}
        >
          <input className={`${input} t-mono`} value={s.gtmId} onChange={(e) => set("gtmId", e.target.value.toUpperCase())} placeholder="GTM-XXXXXXX" />
        </Field>
      </Section>

      <section className="border border-line p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="t-label !text-bone">Announcement bar</h2>
            <p className="mt-1 text-xs text-mute">A small notice at the bottom of every public page. Visitors can dismiss it; a new message shows again.</p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-bone">
            <input type="checkbox" className="h-4 w-4 accent-[#ff5a1f]" checked={s.announcement.enabled} onChange={(e) => setA("enabled", e.target.checked)} />
            Show it
          </label>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-[2fr_1fr_1.4fr]">
          <Field label="Message" error={errors["announcement.text"]}>
            <input className={input} value={s.announcement.text} onChange={(e) => setA("text", e.target.value)} maxLength={160} placeholder="New: free SEO tools for Indian businesses" />
          </Field>
          <Field label="Link text" error={errors["announcement.linkLabel"]}>
            <input className={input} value={s.announcement.linkLabel} onChange={(e) => setA("linkLabel", e.target.value)} maxLength={40} placeholder="Take a look" />
          </Field>
          <Field label="Link" error={errors["announcement.href"]}>
            <input className={input} value={s.announcement.href} onChange={(e) => setA("href", e.target.value)} placeholder="/india or https://…" />
          </Field>
        </div>
        {s.announcement.text && (
          <div className="mt-5">
            <p className="t-label mb-2">Preview</p>
            <div className={`flex max-w-[44rem] items-center gap-3 rounded-full border border-line-2 bg-ink-2 py-2 pr-2 pl-5 text-sm ${s.announcement.enabled ? "" : "opacity-50"}`}>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
              <span className="min-w-0 flex-1 text-bone">{s.announcement.text}</span>
              {s.announcement.linkLabel && <span className="shrink-0 rounded-full bg-bone px-3.5 py-1.5 text-xs font-medium text-ink">{s.announcement.linkLabel}</span>}
              <span className="grid h-8 w-8 shrink-0 place-items-center text-bone-dim">✕</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
