"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SerpCard } from "@/components/tools/serp";
import { parseCustomSchema } from "@/lib/blog/custom-schema";

type Form = {
  title: string;
  description: string;
  canonical: string;
  robotsIndex: boolean | null;
  robotsFollow: boolean | null;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  customSchema: string;
};
type Live = { title: string; description: string; canonical: string; robots: string; ogTitle: string; ogDescription: string; ogImage: string; schemaTypes: string[] };

const input = "w-full rounded border border-line-2 bg-ink-2 px-3 py-2.5 text-sm text-bone outline-none transition-colors placeholder:text-mute focus:border-bone";
const SITE = "https://agmanrajpurohit.com";

/** What the page outputs right now (with any saved override applied), read from its HTML. */
async function readLive(path: string): Promise<Live | null> {
  try {
    const html = await fetch(`${path}${path.includes("?") ? "&" : "?"}_seo=${Date.now()}`, { cache: "no-store" }).then((r) => r.text());
    const d = new DOMParser().parseFromString(html, "text/html");
    const meta = (sel: string) => d.querySelector<HTMLMetaElement>(sel)?.content ?? "";
    const types = new Set<string>();
    d.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
      try {
        const j = JSON.parse(s.textContent || "{}");
        (Array.isArray(j) ? j : j["@graph"] ?? [j]).forEach((x: { "@type"?: string | string[] }) => [x["@type"]].flat().forEach((t) => t && types.add(t)));
      } catch {
        /* ignore */
      }
    });
    return {
      title: d.title,
      description: meta('meta[name="description"]'),
      canonical: d.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? "",
      robots: meta('meta[name="robots"]') || "index, follow",
      ogTitle: meta('meta[property="og:title"]'),
      ogDescription: meta('meta[property="og:description"]'),
      ogImage: meta('meta[property="og:image"]'),
      schemaTypes: [...types],
    };
  } catch {
    return null;
  }
}

function Field({ label, hint, count, max, children }: { label: string; hint?: string; count?: number; max?: number; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="t-label">{label}</span>
        {max !== undefined && count !== undefined && <span className={`t-mono text-xs ${count > max ? "text-ember" : count ? "text-[#4fd18b]" : "text-mute"}`}>{count} / {max}</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-mute">{hint}</span>}
    </label>
  );
}

export function SeoPageEditor({ path, label, initial }: { path: string; label: string; initial: Form | null }) {
  const router = useRouter();
  const empty: Form = { title: "", description: "", canonical: "", robotsIndex: null, robotsFollow: null, ogTitle: "", ogDescription: "", ogImage: "", customSchema: "" };
  const [f, setF] = useState<Form>(initial ?? empty);
  const [live, setLive] = useState<Live | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
  const schema = useMemo(() => parseCustomSchema(f.customSchema), [f.customSchema]);

  const refreshLive = useCallback(async () => setLive(await readLive(path)), [path]);
  useEffect(() => {
    void refreshLive();
  }, [refreshLive]);

  async function save(clear = false) {
    setSaving(true);
    setNotice(null);
    setErrors({});
    const res = clear
      ? await fetch(`/api/admin/seo/page?path=${encodeURIComponent(path)}`, { method: "DELETE" })
      : await fetch("/api/admin/seo/page", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path, ...f }) });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      if (data.errors) setErrors(data.errors);
      setNotice({ ok: false, text: data.error ?? "Some fields need fixing." });
      return;
    }
    if (clear) setF(empty);
    setNotice({ ok: true, text: clear || data.cleared ? "Back to the page's built-in SEO. The live page is updated." : "Saved. The live page is updated." });
    router.refresh();
    setTimeout(() => void refreshLive(), 600);
  }

  const err = (k: string) => errors[k] && <span className="mt-1 block text-xs text-ember-soft">{errors[k]}</span>;
  const previewTitle = f.title || live?.title || "";
  const previewDesc = f.description || live?.description || "";
  const tri = (v: boolean | null) => (v === null ? "" : v ? "yes" : "no");
  const fromTri = (s: string) => (s === "" ? null : s === "yes");

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/admin/seo" className="t-label !text-bone hover:!text-ember">
              ← All pages
            </Link>
            <h2 className="mt-3 text-2xl font-semibold text-bone">{label}</h2>
            <a href={path} target="_blank" rel="noopener noreferrer" className="t-mono text-xs text-mute hover:text-bone">
              {SITE}
              {path === "/" ? "" : path} ↗
            </a>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => save(true)} disabled={saving || !initial} className="btn btn-ghost !h-10 !px-4 disabled:opacity-40" title="Remove every override on this page">
              Reset to built-in
            </button>
            <button type="button" onClick={() => save()} disabled={saving} className="btn btn-primary !h-10 !px-5 disabled:opacity-60">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
        {notice && (
          <p role="status" className={`text-sm ${notice.ok ? "text-[#4fd18b]" : "text-ember-soft"}`}>
            {notice.text}
          </p>
        )}

        <section className="space-y-5 border border-line p-5 md:p-6">
          <h3 className="t-label !text-bone">Search appearance</h3>
          <Field label="SEO title" hint="Used exactly as written (include your name if you want it). Leave empty to keep the built-in title." count={f.title.length} max={60}>
            <input className={input} value={f.title} onChange={(e) => set("title", e.target.value)} placeholder={live?.title} />
          </Field>
          <Field label="Meta description" count={f.description.length} max={160} hint="Leave empty to keep the built-in description.">
            <textarea className={`${input} resize-y`} rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder={live?.description} />
          </Field>
          <Field label="Canonical URL" hint="Only change this if another URL should rank instead of this one.">
            <input className={input} value={f.canonical} onChange={(e) => set("canonical", e.target.value)} placeholder={live?.canonical} inputMode="url" />
            {err("canonical")}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Indexing" hint={f.robotsIndex === false ? "Google will drop this page from search results." : undefined}>
              <select className={input} value={tri(f.robotsIndex)} onChange={(e) => set("robotsIndex", fromTri(e.target.value))}>
                <option value="">Built-in (index)</option>
                <option value="yes">Index</option>
                <option value="no">Noindex: keep out of Google</option>
              </select>
            </Field>
            <Field label="Links">
              <select className={input} value={tri(f.robotsFollow)} onChange={(e) => set("robotsFollow", fromTri(e.target.value))}>
                <option value="">Built-in (follow)</option>
                <option value="yes">Follow</option>
                <option value="no">Nofollow</option>
              </select>
            </Field>
          </div>
        </section>

        <section className="space-y-5 border border-line p-5 md:p-6">
          <h3 className="t-label !text-bone">Social sharing</h3>
          <Field label="Social title" hint="Leave empty to reuse the SEO title." count={f.ogTitle.length} max={70}>
            <input className={input} value={f.ogTitle} onChange={(e) => set("ogTitle", e.target.value)} placeholder={live?.ogTitle} />
          </Field>
          <Field label="Social description" count={f.ogDescription.length} max={200}>
            <textarea className={`${input} resize-y`} rows={2} value={f.ogDescription} onChange={(e) => set("ogDescription", e.target.value)} placeholder={live?.ogDescription} />
          </Field>
          <Field label="Share image URL" hint="1200 × 630. Upload images in the blog editor's media, or use a full https:// URL.">
            <input className={input} value={f.ogImage} onChange={(e) => set("ogImage", e.target.value)} placeholder={live?.ogImage} inputMode="url" />
            {err("ogImage")}
          </Field>
        </section>

        <section className="space-y-3 border border-line p-5 md:p-6">
          <h3 className="t-label !text-bone">Custom schema (JSON-LD)</h3>
          <p className="text-xs text-mute">
            Added on top of the page&apos;s built-in schema{live?.schemaTypes.length ? ` (${live.schemaTypes.join(", ")})` : ""}. Paste JSON or full &lt;script type=&quot;application/ld+json&quot;&gt; blocks.
          </p>
          <textarea
            className={`${input} t-mono resize-y text-xs leading-5`}
            rows={10}
            spellCheck={false}
            data-lenis-prevent
            value={f.customSchema}
            onChange={(e) => set("customSchema", e.target.value)}
            placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "Review",\n  "…": "…"\n}'}
          />
          {f.customSchema.trim() &&
            (schema.ok ? (
              <p className="text-xs text-[#4fd18b]">
                ✓ Valid · {schema.blocks.length} block{schema.blocks.length === 1 ? "" : "s"}
                {schema.types.length ? ` · ${schema.types.join(", ")}` : ""}
              </p>
            ) : (
              <p className="text-xs text-ember-soft">✕ {schema.error}</p>
            ))}
          {err("customSchema")}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <a href="/free-seo-tools/schema-markup-generator" target="_blank" rel="noopener noreferrer" className="text-bone-dim hover:text-bone">
              Schema generator ↗
            </a>
            <a href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(SITE + (path === "/" ? "" : path))}`} target="_blank" rel="noopener noreferrer" className="text-bone-dim hover:text-bone">
              Test in Google ↗
            </a>
          </div>
        </section>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-[calc(var(--header-h)+1rem)] xl:self-start">
        <div className="border border-line p-4">
          <p className="t-label mb-3">Google preview</p>
          <div className="rounded bg-[#f8f9fa] p-3">
            <SerpCard title={previewTitle} description={previewDesc} url={SITE + (path === "/" ? "" : path)} siteName="Agman Rajpurohit" device="desktop" />
          </div>
        </div>
        <div className="border border-line p-4 text-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="t-label">Live now</p>
            <button type="button" onClick={() => void refreshLive()} className="text-xs text-bone-dim hover:text-bone">
              Refresh
            </button>
          </div>
          {live ? (
            <dl className="space-y-3">
              {[
                ["Title", live.title],
                ["Description", live.description],
                ["Canonical", live.canonical],
                ["Robots", live.robots],
                ["Social image", live.ogImage],
                ["Schema", live.schemaTypes.join(", ")],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="t-label !text-[0.62rem]">{k}</dt>
                  <dd className={`mt-0.5 break-words ${k === "Robots" && /noindex/.test(v) ? "text-[#f0b64a]" : "text-bone-dim"}`}>{v || "–"}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-xs text-mute">Reading the live page…</p>
          )}
        </div>
      </aside>
    </div>
  );
}
