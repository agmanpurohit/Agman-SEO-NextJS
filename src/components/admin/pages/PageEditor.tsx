"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MediaPicker } from "@/components/admin/media/MediaPicker";
import { parseCustomSchema } from "@/lib/blog/custom-schema";
import { SECTION_TYPES, makeSection, newId, sectionLabel, sectionSummary, slugProblem, toSlug, pagePath, type PageInput, type Section, type SectionType } from "@/lib/pages/types";
import { SectionForm, Field, input, type SitePageOption } from "./SectionForms";

type Props = { id?: number; initial: PageInput; publishedAt?: string | null; siteUrl: string; pages: SitePageOption[] };
const PREVIEW_CHANNEL = "page-builder-preview";

function Counter({ n, ideal, max }: { n: number; ideal: [number, number]; max: number }) {
  const tone = n === 0 ? "text-mute" : n > max ? "text-ember" : n >= ideal[0] && n <= ideal[1] ? "text-[#4fd18b]" : "text-[#f0b64a]";
  return <span className={`t-mono text-xs ${tone}`}>{n}</span>;
}

/** Page builder: page settings, SEO and an ordered list of sections. */
export function PageEditor({ id, initial, publishedAt, siteUrl, pages }: Props) {
  const router = useRouter();
  const [p, setP] = useState<PageInput>(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [open, setOpen] = useState<string | null>(initial.sections[0]?.id ?? null);
  const [adding, setAdding] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<"" | "draft" | "publish">("");
  const [uploading, setUploading] = useState(false);
  const [ogPicker, setOgPicker] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!!id);
  const [livePreview, setLivePreview] = useState(false);
  const previewTimer = useRef<number | null>(null);

  const dirty = JSON.stringify(p) !== saved;
  const savedPage = useMemo(() => JSON.parse(saved) as PageInput, [saved]);
  const live = savedPage.status === "published" && !!id;
  const path = pagePath(p.slug || "your-page");
  const schema = useMemo(() => parseCustomSchema(p.customSchema), [p.customSchema]);
  const slugError = p.slug ? slugProblem(p.slug) : null;

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const set = <K extends keyof PageInput>(k: K, v: PageInput[K]) => setP((x) => ({ ...x, [k]: v }));
  const setTitle = (title: string) => setP((x) => ({ ...x, title, ...(slugTouched ? {} : { slug: toSlug(title) }) }));
  const setSection = (sid: string, patch: Partial<Section>) => setP((x) => ({ ...x, sections: x.sections.map((s) => (s.id === sid ? ({ ...s, ...patch } as Section) : s)) }));
  const setSections = (fn: (s: Section[]) => Section[]) => setP((x) => ({ ...x, sections: fn(x.sections) }));

  function move(i: number, d: number) {
    setSections((list) => {
      const j = i + d;
      if (j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function add(type: SectionType, at: number) {
    const s = makeSection(type);
    setSections((list) => [...list.slice(0, at), s, ...list.slice(at)]);
    setOpen(s.id);
    setAdding(null);
  }
  function duplicate(i: number) {
    setSections((list) => {
      const copy = { ...structuredClone(list[i]), id: newId() } as Section;
      return [...list.slice(0, i + 1), copy, ...list.slice(i + 1)];
    });
  }
  function remove(i: number) {
    const s = p.sections[i];
    if (!window.confirm(`Delete the “${sectionLabel(s.type)}” section${sectionSummary(s) ? ` (${sectionSummary(s).slice(0, 50)})` : ""}?`)) return;
    setSections((list) => list.filter((_, k) => k !== i));
  }

  async function upload(file: File): Promise<string | null> {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/blog/media", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setUploading(false);
    if (!res.ok) {
      setNotice({ ok: false, text: data.error ?? "Upload failed." });
      return null;
    }
    return data.url as string;
  }

  const save = useCallback(
    async (mode: "draft" | "publish") => {
      setBusy(mode);
      setNotice(null);
      setErrors({});
      const body = { ...p, status: mode === "publish" ? "published" : "draft" };
      const res = await fetch(id ? `/api/admin/pages/${id}` : "/api/admin/pages", { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      setBusy("");
      if (!res.ok) {
        const errs: Record<string, string> = data.errors ?? {};
        setErrors(errs);
        const first = Object.keys(errs).find((k) => k.startsWith("section:"));
        if (first) setOpen(first.slice(8));
        return setNotice({ ok: false, text: data.error ?? (res.status === 401 ? "Your session has expired. Sign in again in another tab, then save." : "Some things need fixing before saving.") });
      }
      const page = data.page as PageInput & { id: number };
      const clean: PageInput = { title: page.title, slug: page.slug, status: page.status, metaTitle: page.metaTitle, metaDescription: page.metaDescription, ogImage: page.ogImage, noindex: page.noindex, customSchema: page.customSchema, sections: page.sections };
      setP(clean);
      setSaved(JSON.stringify(clean));
      setNotice({ ok: true, text: mode === "publish" ? (live ? "Updated. The live page now shows these changes." : "Published.") : live ? "Saved as a draft. The page is no longer live." : "Draft saved." });
      if (!id) router.replace(`/admin/pages/${page.id}`);
      else router.refresh();
    },
    [p, id, live, router],
  );

  // Ctrl/Cmd+S saves a draft (or updates the live page).
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!busy) save(live ? "publish" : "draft");
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [save, busy, live]);

  // Preview: sends the unsaved page to the preview tab, which refreshes itself.
  const sendPreview = useCallback(async () => {
    const res = await fetch("/api/admin/pages/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...p, status: "draft" }) });
    if (res.ok) {
      const ch = new BroadcastChannel(PREVIEW_CHANNEL);
      ch.postMessage("refresh");
      ch.close();
    }
    return res.ok;
  }, [p]);
  async function openPreview() {
    const tab = window.open("about:blank", "page-builder-preview");
    if (await sendPreview()) {
      if (tab) tab.location.href = "/admin/pages/preview";
      setLivePreview(true);
    } else {
      tab?.close();
      setNotice({ ok: false, text: "Couldn't create the preview." });
    }
  }
  useEffect(() => {
    if (!livePreview) return;
    if (previewTimer.current) window.clearTimeout(previewTimer.current);
    previewTimer.current = window.setTimeout(() => void sendPreview(), 900);
    return () => {
      if (previewTimer.current) window.clearTimeout(previewTimer.current);
    };
  }, [p, livePreview, sendPreview]);

  const titleLen = (p.metaTitle || p.title).length;
  const descLen = p.metaDescription.length;
  const btn = "grid h-8 w-8 place-items-center rounded border border-line-2 text-xs text-bone-dim transition-colors hover:border-bone hover:text-bone disabled:opacity-30";

  const AddMenu = ({ at }: { at: number }) =>
    adding === at ? (
      <div className="rounded border border-line-2 bg-ink-2 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="t-label !text-bone">Add a section</p>
          <button type="button" className="text-sm text-bone-dim hover:text-bone" onClick={() => setAdding(null)}>
            Cancel
          </button>
        </div>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {SECTION_TYPES.filter((t) => t.type !== "hero" || (at === 0 && !p.sections.some((s) => s.type === "hero"))).map((t) => (
            <li key={t.type}>
              <button type="button" onClick={() => add(t.type, at)} className="h-full w-full rounded border border-line bg-ink p-3 text-left transition-colors hover:border-ember">
                <span className="block text-sm font-medium text-bone">{t.label}</span>
                <span className="mt-1 block text-xs text-mute">{t.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    ) : (
      <button type="button" onClick={() => setAdding(at)} className="group flex w-full items-center gap-3 py-1 text-xs text-mute hover:text-bone" aria-label="Add a section here">
        <span className="h-px flex-1 bg-line group-hover:bg-line-2" />
        <span className="rounded-full border border-line-2 px-3 py-1 group-hover:border-bone">+ Add section</span>
        <span className="h-px flex-1 bg-line group-hover:bg-line-2" />
      </button>
    );

  return (
    <div className="pb-24">
      {/* Action bar */}
      <div className="sticky top-0 z-30 -mx-[var(--gutter)] border-b border-line bg-ink/90 px-[var(--gutter)] py-3 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/pages" className="t-label hover:!text-bone">
            ← Pages
          </Link>
          <span className={`rounded-full border px-2.5 py-0.5 text-xs ${live ? "border-[#4fd18b]/50 text-[#4fd18b]" : "border-line-2 text-bone-dim"}`}>{live ? "Live" : "Draft"}</span>
          {dirty && <span className="t-label !text-[#f0b64a]">Unsaved changes</span>}
          {notice && <span className={`text-sm ${notice.ok ? "text-[#4fd18b]" : "text-ember-soft"}`}>{notice.text}</span>}
          <div className="ml-auto flex flex-wrap gap-2">
            <button type="button" className="btn btn-ghost !h-10 !px-4" onClick={openPreview}>
              Preview
            </button>
            {live && (
              <a href={path} target="_blank" rel="noopener noreferrer" className="btn btn-ghost !h-10 !px-4">
                View live ↗
              </a>
            )}
            <button type="button" className="btn btn-ghost !h-10 !px-4 disabled:opacity-50" disabled={!!busy} onClick={() => save("draft")}>
              {busy === "draft" ? "Saving…" : live ? "Unpublish" : "Save draft"}
            </button>
            <button type="button" className="btn btn-primary !h-10 !px-5 disabled:opacity-50" disabled={!!busy} onClick={() => save("publish")}>
              {busy === "publish" ? "Saving…" : live ? "Update" : "Publish"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        {/* Sections */}
        <div className="min-w-0">
          <h1 className="t-h3">{p.title || "New page"}</h1>
          {errors.sections && <p className="mt-3 text-sm text-ember-soft">{errors.sections}</p>}
          <div className="mt-6 space-y-2">
            <AddMenu at={0} />
            {p.sections.map((s, i) => {
              const err = errors[`section:${s.id}`];
              const isOpen = open === s.id;
              return (
                <div key={s.id} className="space-y-2">
                  <div className={`rounded border ${err ? "border-ember/70" : isOpen ? "border-line-2" : "border-line"} bg-ink-2/40 ${s.hidden ? "opacity-60" : ""}`}>
                    <div className="flex items-center gap-3 p-3 md:p-4">
                      <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setOpen(isOpen ? null : s.id)} aria-expanded={isOpen}>
                        <span className="t-label ember shrink-0">{String(i + 1).padStart(2, "0")}</span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-bone">
                            {sectionLabel(s.type)}
                            {s.hidden && <span className="t-label ml-2 !text-[0.6rem]">Hidden</span>}
                          </span>
                          <span className="block truncate text-xs text-mute">{sectionSummary(s) || "Empty"}</span>
                        </span>
                      </button>
                      <div className="flex shrink-0 gap-1">
                        <button type="button" className={btn} onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" title="Move up">
                          ↑
                        </button>
                        <button type="button" className={btn} onClick={() => move(i, 1)} disabled={i === p.sections.length - 1} aria-label="Move down" title="Move down">
                          ↓
                        </button>
                        <button type="button" className={`${btn} hidden sm:grid`} onClick={() => duplicate(i)} disabled={s.type === "hero"} aria-label="Duplicate" title="Duplicate">
                          ⧉
                        </button>
                        <button type="button" className={btn} onClick={() => setSection(s.id, { hidden: !s.hidden })} aria-label={s.hidden ? "Show on page" : "Hide from page"} title={s.hidden ? "Show on page" : "Hide from page"}>
                          {s.hidden ? "◌" : "◉"}
                        </button>
                        <button type="button" className={`${btn} hover:!border-ember hover:!text-ember`} onClick={() => remove(i)} aria-label="Delete section" title="Delete">
                          ✕
                        </button>
                      </div>
                    </div>
                    {err && <p className="px-4 pb-3 text-sm text-ember-soft">{err}</p>}
                    {isOpen && (
                      <div className="space-y-4 border-t border-line p-4 md:p-5">
                        <SectionForm s={s} set={(patch) => setSection(s.id, patch)} ctx={{ upload, uploading, pages }} />
                      </div>
                    )}
                  </div>
                  <AddMenu at={i + 1} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Page settings */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <section className="space-y-4 border border-line p-5">
            <h2 className="t-label !text-bone">Page</h2>
            <Field label="Page name" hint={errors.title}>
              <input className={input} value={p.title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="SEO Specialist in Dubai" />
            </Field>
            <Field label="URL" hint={<span className={slugError || errors.slug ? "text-ember-soft" : ""}>{errors.slug || slugError || `${siteUrl.replace(/^https?:\/\//, "")}${path}`}</span>}>
              <div className="flex items-center rounded border border-line-2 bg-ink-2 focus-within:border-bone">
                <span className="t-mono pl-3 text-sm text-mute">/</span>
                <input
                  className="t-mono w-full bg-transparent px-1 py-2.5 text-sm text-bone outline-none"
                  value={p.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9/-]/g, "-"));
                  }}
                  onBlur={() => set("slug", toSlug(p.slug))}
                  maxLength={120}
                  aria-label="URL"
                />
              </div>
            </Field>
            {live && savedPage.slug !== p.slug && p.slug && !slugError && <p className="text-xs text-[#f0b64a]">The old URL /{savedPage.slug} will redirect here (301) when you update.</p>}
            {publishedAt && <p className="text-xs text-mute">First published {new Date(publishedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dubai" })}</p>}
          </section>

          <section className="space-y-4 border border-line p-5">
            <h2 className="t-label !text-bone">Search &amp; social</h2>
            <Field label="SEO title" hint={<>Empty = page name + “| Agman Rajpurohit”. Aim for 50–60 characters. <Counter n={titleLen} ideal={[45, 60]} max={65} /></>}>
              <input className={input} value={p.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} maxLength={120} placeholder={p.title} />
            </Field>
            <Field label="Meta description" hint={<span className={errors.metaDescription ? "text-ember-soft" : ""}>{errors.metaDescription || <>Aim for 140–160 characters. <Counter n={descLen} ideal={[120, 160]} max={170} /></>}</span>}>
              <textarea className={`${input} resize-y`} rows={3} value={p.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} maxLength={320} />
            </Field>
            <div className="rounded border border-line bg-[#fff] p-3 font-[arial,sans-serif]">
              <p className="truncate text-xs text-[#4d5156]">{siteUrl.replace(/^https?:\/\//, "")} › {p.slug.split("/").join(" › ")}</p>
              <p className="truncate text-[1.05rem] text-[#1a0dab]">{p.metaTitle || `${p.title || "Page name"} | Agman Rajpurohit`}</p>
              <p className="line-clamp-2 text-xs text-[#4d5156]">{p.metaDescription || "Add a meta description to control this text."}</p>
            </div>
            <div>
              <span className="t-label mb-1.5 block">Social share image</span>
              {p.ogImage ? (
                <div className="relative overflow-hidden rounded border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.ogImage} alt="" className="aspect-[1.91/1] w-full object-cover" />
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button type="button" onClick={() => setOgPicker(true)} className="rounded bg-ink/80 px-2.5 py-1 text-xs text-bone backdrop-blur">
                      Replace
                    </button>
                    <button type="button" onClick={() => set("ogImage", "")} className="rounded bg-ink/80 px-2.5 py-1 text-xs text-bone backdrop-blur">
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setOgPicker(true)} className="w-full rounded border border-dashed border-line-2 px-4 py-5 text-sm text-bone-dim hover:border-bone hover:text-bone">
                  Choose an image (1200×630)
                </button>
              )}
              <p className="mt-1 text-xs text-mute">{errors.ogImage || "Empty = the site's default share card."}</p>
            </div>
            <label className="flex items-start gap-2 text-sm text-bone">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#ff5a1f]" checked={p.noindex} onChange={(e) => set("noindex", e.target.checked)} />
              <span>
                Hide from search engines (noindex)
                <span className="block text-xs text-mute">Also leaves the page out of the sitemap.</span>
              </span>
            </label>
          </section>

          <section className="space-y-3 border border-line p-5">
            <h2 className="t-label !text-bone">Structured data</h2>
            <p className="text-xs text-mute">Added automatically: WebPage, Breadcrumb, and FAQPage when the page has FAQs or a direct answer. Paste extra JSON-LD below (e.g. Service, LocalBusiness).</p>
            <textarea className={`${input} t-mono min-h-[8rem] resize-y text-xs`} value={p.customSchema} onChange={(e) => set("customSchema", e.target.value)} placeholder='{ "@context": "https://schema.org", "@type": "Service", … }' spellCheck={false} aria-label="Custom schema" />
            <p className={`text-xs ${errors.customSchema || !schema.ok ? "text-ember-soft" : "text-mute"}`}>
              {errors.customSchema || (!schema.ok ? schema.error : schema.types.length ? `Valid: ${schema.types.join(", ")}` : "Optional.")}
            </p>
          </section>
        </aside>
      </div>

      <MediaPicker open={ogPicker} onClose={() => setOgPicker(false)} onPick={(m) => (set("ogImage", m.url), setOgPicker(false))} title="Choose a social share image" />
    </div>
  );
}
