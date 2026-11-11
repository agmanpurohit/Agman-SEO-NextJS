"use client";

import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";
import { MediaPicker } from "@/components/admin/media/MediaPicker";
import type { Cta, Img, Section } from "@/lib/pages/types";

const VisualEditor = dynamic(() => import("../VisualEditor").then((m) => m.VisualEditor), {
  ssr: false,
  loading: () => <div className="min-h-[12rem] p-5 text-sm text-mute">Loading editor…</div>,
});

export const input = "w-full rounded border border-line-2 bg-ink-2 px-3 py-2.5 text-sm text-bone outline-none placeholder:text-mute focus:border-bone";
const LINK_HINT = "Add links with [link text](/path).";

export type SitePageOption = { path: string; label: string; group: string };
export type Ctx = { upload: (f: File) => Promise<string | null>; uploading: boolean; pages: SitePageOption[] };

export function Field({ label, hint, children, className = "" }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="t-label mb-1.5 block">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-mute">{hint}</span>}
    </label>
  );
}

function Text({ label, value, onChange, placeholder, max = 160, hint, className }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; max?: number; hint?: ReactNode; className?: string }) {
  return (
    <Field label={label} hint={hint} className={className}>
      <input className={input} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={max} />
    </Field>
  );
}

function Area({ label, value, onChange, placeholder, rows = 3, max = 1200, hint = LINK_HINT, className }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; max?: number; hint?: ReactNode; className?: string }) {
  return (
    <Field label={label} hint={hint} className={className}>
      <textarea className={`${input} resize-y`} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={max} />
    </Field>
  );
}

/** Page path or full link, with a list of the site's pages to pick from. */
function LinkInput({ value, onChange, pages, placeholder = "/contact or https://…" }: { value: string; onChange: (v: string) => void; pages: SitePageOption[]; placeholder?: string }) {
  const listId = "site-pages-list";
  return (
    <>
      <input className={`${input} t-mono`} value={value} onChange={(e) => onChange(e.target.value.trim())} placeholder={placeholder} list={listId} inputMode="url" />
      <datalist id={listId}>
        {pages.map((p) => (
          <option key={p.path} value={p.path}>
            {p.label}
          </option>
        ))}
      </datalist>
    </>
  );
}

function CtaFields({ label, value, onChange, pages }: { label: string; value: Cta; onChange: (v: Cta) => void; pages: SitePageOption[] }) {
  return (
    <fieldset className="grid grid-cols-1 gap-2">
      <legend className="t-label mb-1.5">{label}</legend>
      <input className={input} value={value.label} onChange={(e) => onChange({ ...value, label: e.target.value })} placeholder="Button text (empty = no button)" maxLength={60} aria-label={`${label} text`} />
      <LinkInput value={value.href} onChange={(href) => onChange({ ...value, href })} pages={pages} />
    </fieldset>
  );
}

function ImagePick({ label = "Image", value, onChange }: { label?: string; value: Img | null; onChange: (v: Img | null) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <span className="t-label mb-1.5 block">{label}</span>
      {value ? (
        <div className="grid grid-cols-[7rem_1fr] gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.url} alt="" className="aspect-[4/3] w-full rounded border border-line object-cover" />
          <div className="min-w-0 space-y-2">
            <input className={input} value={value.alt} onChange={(e) => onChange({ ...value, alt: e.target.value })} placeholder="Alt text: describe the image" maxLength={200} aria-label="Alt text" />
            {!value.alt && <p className="text-xs text-[#f0b64a]">Add alt text for search engines and screen readers.</p>}
            <div className="flex gap-3 text-xs">
              <button type="button" className="link-u text-bone" onClick={() => setOpen(true)}>
                Replace
              </button>
              <button type="button" className="link-u text-ember-soft" onClick={() => onChange(null)}>
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="w-full rounded border border-dashed border-line-2 px-4 py-6 text-sm text-bone-dim transition-colors hover:border-bone hover:text-bone">
          Choose or upload an image
        </button>
      )}
      <MediaPicker open={open} onClose={() => setOpen(false)} onPick={(m) => (onChange({ url: m.url, alt: m.alt || value?.alt || "", width: m.width ?? undefined, height: m.height ?? undefined }), setOpen(false))} />
    </div>
  );
}

function Html({ label = "Text", value, onChange, ctx }: { label?: string; value: string; onChange: (v: string) => void; ctx: Ctx }) {
  return (
    <div>
      <span className="t-label mb-1.5 block">{label}</span>
      <div className="overflow-hidden rounded border border-line-2 bg-ink">
        <VisualEditor compact value={value} onChange={onChange} onUploadImage={ctx.upload} uploading={ctx.uploading} label={label} placeholder="Write here, or paste from Google Docs or Word…" />
      </div>
    </div>
  );
}

/** Repeating rows (cards, steps, FAQs…) with add, move and remove. */
function Items<T>({ label, items, onChange, make, render, addLabel, max = 24 }: { label: string; items: T[]; onChange: (v: T[]) => void; make: () => T; render: (it: T, set: (v: T) => void, i: number) => ReactNode; addLabel: string; max?: number }) {
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const btn = "grid h-7 w-7 place-items-center rounded border border-line-2 text-xs text-bone-dim hover:border-bone hover:text-bone disabled:opacity-30";
  return (
    <div>
      <span className="t-label mb-2 block">
        {label} <span className="text-mute">({items.length})</span>
      </span>
      <ol className="space-y-3">
        {items.map((it, i) => (
          <li key={i} className="rounded border border-line bg-ink p-3 md:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="t-label ember">{String(i + 1).padStart(2, "0")}</span>
              <div className="flex gap-1">
                <button type="button" className={btn} onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                  ↑
                </button>
                <button type="button" className={btn} onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down">
                  ↓
                </button>
                <button type="button" className={`${btn} hover:!border-ember hover:!text-ember`} onClick={() => onChange(items.filter((_, k) => k !== i))} aria-label="Remove">
                  ✕
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">{render(it, (v) => onChange(items.map((x, k) => (k === i ? v : x))), i)}</div>
          </li>
        ))}
      </ol>
      {items.length < max && (
        <button type="button" className="mt-3 rounded-full border border-dashed border-line-2 px-4 py-2 text-sm text-bone-dim hover:border-bone hover:text-bone" onClick={() => onChange([...items, make()])}>
          + {addLabel}
        </button>
      )}
    </div>
  );
}

const Grid2 = ({ children }: { children: ReactNode }) => <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>;

/** The form for one section. `set` receives a partial update. */
export function SectionForm({ s, set, ctx }: { s: Section; set: (patch: Partial<Section>) => void; ctx: Ctx }) {
  // Narrowed setter per type keeps the forms type-safe.
  const up = set as (p: Record<string, unknown>) => void;
  switch (s.type) {
    case "hero":
      return (
        <>
          <Grid2>
            <Text label="Small label above (optional)" value={s.eyebrow} onChange={(v) => up({ eyebrow: v })} placeholder="SEO services · UAE" />
            <Text label="Heading (H1)" value={s.heading} onChange={(v) => up({ heading: v })} max={200} placeholder="The main promise of the page" hint="The page's only H1. Include the main keyword." />
          </Grid2>
          <Area label="Intro" value={s.text} onChange={(v) => up({ text: v })} rows={3} />
          <Grid2>
            <CtaFields label="Main button" value={s.primary} onChange={(v) => up({ primary: v })} pages={ctx.pages} />
            <CtaFields label="Second button" value={s.secondary} onChange={(v) => up({ secondary: v })} pages={ctx.pages} />
          </Grid2>
          <ImagePick label="Image (optional, shown beside the heading)" value={s.image} onChange={(v) => up({ image: v })} />
        </>
      );
    case "answer":
      return (
        <>
          <Text label="Question" value={s.question} onChange={(v) => up({ question: v })} max={200} placeholder="What does an SEO specialist do?" hint="Phrase it the way people search." />
          <Area label="Answer" value={s.answer} onChange={(v) => up({ answer: v })} rows={4} hint={`Answer in the first sentence, in 40–60 words. ${LINK_HINT}`} />
        </>
      );
    case "text":
      return (
        <>
          <Grid2>
            <Text label="Small label (optional)" value={s.eyebrow} onChange={(v) => up({ eyebrow: v })} placeholder="Context" />
            <Text label="Heading (H2)" value={s.heading} onChange={(v) => up({ heading: v })} max={200} />
          </Grid2>
          <Html value={s.html} onChange={(v) => up({ html: v })} ctx={ctx} />
        </>
      );
    case "imageText":
      return (
        <>
          <Grid2>
            <Text label="Small label (optional)" value={s.eyebrow} onChange={(v) => up({ eyebrow: v })} />
            <Text label="Heading (H2)" value={s.heading} onChange={(v) => up({ heading: v })} max={200} />
          </Grid2>
          <Html value={s.html} onChange={(v) => up({ html: v })} ctx={ctx} />
          <Grid2>
            <ImagePick value={s.image} onChange={(v) => up({ image: v })} />
            <Field label="Image position">
              <select className={input} value={s.imageSide} onChange={(e) => up({ imageSide: e.target.value })}>
                <option value="right">Image on the right</option>
                <option value="left">Image on the left</option>
              </select>
            </Field>
          </Grid2>
          <CtaFields label="Button (optional)" value={s.cta} onChange={(v) => up({ cta: v })} pages={ctx.pages} />
        </>
      );
    case "cards":
      return (
        <>
          <Grid2>
            <Text label="Small label (optional)" value={s.eyebrow} onChange={(v) => up({ eyebrow: v })} placeholder="Scope" />
            <Text label="Heading (H2)" value={s.heading} onChange={(v) => up({ heading: v })} max={200} />
          </Grid2>
          <Grid2>
            <Area label="Intro (optional)" value={s.intro} onChange={(v) => up({ intro: v })} rows={2} />
            <Field label="Cards per row (desktop)">
              <select className={input} value={s.columns} onChange={(e) => up({ columns: Number(e.target.value) })}>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </Field>
          </Grid2>
          <Items
            label="Cards"
            addLabel="Add card"
            items={s.items}
            onChange={(items) => up({ items })}
            make={() => ({ title: "", text: "", href: "" })}
            render={(it, setIt) => (
              <>
                <input className={input} value={it.title} onChange={(e) => setIt({ ...it, title: e.target.value })} placeholder="Card title (H3)" maxLength={120} aria-label="Card title" />
                <textarea className={`${input} resize-y`} rows={2} value={it.text} onChange={(e) => setIt({ ...it, text: e.target.value })} placeholder="Short description" maxLength={1200} aria-label="Card text" />
                <LinkInput value={it.href} onChange={(href) => setIt({ ...it, href })} pages={ctx.pages} placeholder="Link the whole card (optional)" />
              </>
            )}
          />
        </>
      );
    case "steps":
      return (
        <>
          <Grid2>
            <Text label="Small label (optional)" value={s.eyebrow} onChange={(v) => up({ eyebrow: v })} placeholder="How it works" />
            <Text label="Heading (H2)" value={s.heading} onChange={(v) => up({ heading: v })} max={200} />
          </Grid2>
          <Items
            label="Steps"
            addLabel="Add step"
            items={s.items}
            onChange={(items) => up({ items })}
            make={() => ({ title: "", text: "" })}
            render={(it, setIt) => (
              <>
                <input className={input} value={it.title} onChange={(e) => setIt({ ...it, title: e.target.value })} placeholder="Step title" maxLength={120} aria-label="Step title" />
                <textarea className={`${input} resize-y`} rows={2} value={it.text} onChange={(e) => setIt({ ...it, text: e.target.value })} placeholder="What happens in this step" maxLength={1200} aria-label="Step text" />
              </>
            )}
          />
        </>
      );
    case "stats":
      return (
        <>
          <Grid2>
            <Text label="Small label (optional)" value={s.eyebrow} onChange={(v) => up({ eyebrow: v })} placeholder="Proof" />
            <Text label="Heading (H2)" value={s.heading} onChange={(v) => up({ heading: v })} max={200} />
          </Grid2>
          <p className="text-xs text-[#f0b64a]">Only use numbers you can back up: a client report, Search Console or Analytics.</p>
          <Items
            label="Numbers"
            addLabel="Add number"
            items={s.items}
            onChange={(items) => up({ items })}
            make={() => ({ value: "", label: "", context: "" })}
            render={(it, setIt) => (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[8rem_1fr]">
                <input className={input} value={it.value} onChange={(e) => setIt({ ...it, value: e.target.value })} placeholder="+120%" maxLength={24} aria-label="Value" />
                <input className={input} value={it.label} onChange={(e) => setIt({ ...it, label: e.target.value })} placeholder="Label, e.g. organic clicks" maxLength={80} aria-label="Label" />
                <input className={`${input} sm:col-span-2`} value={it.context} onChange={(e) => setIt({ ...it, context: e.target.value })} placeholder="Context: where and over what period" maxLength={300} aria-label="Context" />
              </div>
            )}
          />
        </>
      );
    case "image":
      return (
        <>
          <ImagePick value={s.image} onChange={(v) => up({ image: v })} />
          <Grid2>
            <Text label="Caption (optional)" value={s.caption} onChange={(v) => up({ caption: v })} max={300} />
            <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-bone">
              <input type="checkbox" className="h-4 w-4 accent-[#ff5a1f]" checked={s.wide} onChange={(e) => up({ wide: e.target.checked })} />
              Full width (edge to edge)
            </label>
          </Grid2>
        </>
      );
    case "quote":
      return (
        <>
          <Area label="Quote" value={s.quote} onChange={(v) => up({ quote: v })} rows={3} hint="Use real words from a real person, with their permission." />
          <Grid2>
            <Text label="Name" value={s.name} onChange={(v) => up({ name: v })} max={80} />
            <Text label="Role / company" value={s.role} onChange={(v) => up({ role: v })} max={120} />
          </Grid2>
        </>
      );
    case "faq":
      return (
        <>
          <Grid2>
            <Text label="Small label (optional)" value={s.eyebrow} onChange={(v) => up({ eyebrow: v })} placeholder="Questions" />
            <Text label="Heading (H2)" value={s.heading} onChange={(v) => up({ heading: v })} max={200} />
          </Grid2>
          <Items
            label="Questions"
            addLabel="Add question"
            items={s.items}
            onChange={(items) => up({ items })}
            make={() => ({ q: "", a: "" })}
            render={(it, setIt) => (
              <>
                <input className={input} value={it.q} onChange={(e) => setIt({ ...it, q: e.target.value })} placeholder="Question" maxLength={300} aria-label="Question" />
                <textarea className={`${input} resize-y`} rows={3} value={it.a} onChange={(e) => setIt({ ...it, a: e.target.value })} placeholder="Answer (direct, first sentence answers it)" maxLength={2400} aria-label="Answer" />
              </>
            )}
          />
        </>
      );
    case "links":
      return (
        <>
          <Text label="Heading (H2)" value={s.heading} onChange={(v) => up({ heading: v })} max={200} />
          <LinkPicker pages={ctx.pages} chosen={s.links.map((l) => l.href)} onAdd={(p) => up({ links: [...s.links, { label: p.label, href: p.path, note: "" }] })} />
          <Items
            label="Links"
            addLabel="Add a custom link"
            items={s.links}
            onChange={(links) => up({ links })}
            make={() => ({ label: "", href: "", note: "" })}
            render={(it, setIt) => (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input className={input} value={it.label} onChange={(e) => setIt({ ...it, label: e.target.value })} placeholder="Link text" maxLength={120} aria-label="Link text" />
                  <LinkInput value={it.href} onChange={(href) => setIt({ ...it, href })} pages={ctx.pages} />
                </div>
                <input className={input} value={it.note} onChange={(e) => setIt({ ...it, note: e.target.value })} placeholder="One line about the page (optional)" maxLength={200} aria-label="Note" />
              </>
            )}
          />
        </>
      );
    case "cta":
      return (
        <>
          <Grid2>
            <Text label="Small label (optional)" value={s.eyebrow} onChange={(v) => up({ eyebrow: v })} />
            <Text label="Heading (H2)" value={s.heading} onChange={(v) => up({ heading: v })} max={200} />
          </Grid2>
          <Area label="Text" value={s.text} onChange={(v) => up({ text: v })} rows={2} />
          <Grid2>
            <CtaFields label="Main button" value={s.primary} onChange={(v) => up({ primary: v })} pages={ctx.pages} />
            <CtaFields label="Second button" value={s.secondary} onChange={(v) => up({ secondary: v })} pages={ctx.pages} />
          </Grid2>
        </>
      );
    case "closing":
      return (
        <>
          <Grid2>
            <Text label="Small label" value={s.label} onChange={(v) => up({ label: v })} max={60} />
            <div className="grid grid-cols-2 gap-3">
              <Text label="Headline line 1" value={s.line1} onChange={(v) => up({ line1: v })} max={60} />
              <Text label="Headline line 2" value={s.line2} onChange={(v) => up({ line2: v })} max={60} />
            </div>
          </Grid2>
          <Area label="Text (optional)" value={s.body} onChange={(v) => up({ body: v })} rows={2} max={400} hint="Leave empty to use the site's standard closing text. The button always goes to the contact page." />
        </>
      );
  }
}

/** Quick picker: add any page on the site as a related link. */
function LinkPicker({ pages, chosen, onAdd }: { pages: SitePageOption[]; chosen: string[]; onAdd: (p: SitePageOption) => void }) {
  const groups = [...new Set(pages.map((p) => p.group))];
  return (
    <Field label="Add a page from the site" hint="Linking related pages helps visitors and helps Google crawl the site.">
      <select
        className={input}
        value=""
        onChange={(e) => {
          const p = pages.find((x) => x.path === e.target.value);
          if (p) onAdd(p);
        }}
      >
        <option value="">Choose a page…</option>
        {groups.map((g) => (
          <optgroup key={g} label={g}>
            {pages
              .filter((p) => p.group === g && !chosen.includes(p.path))
              .map((p) => (
                <option key={p.path} value={p.path}>
                  {p.label} — {p.path}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </Field>
  );
}
