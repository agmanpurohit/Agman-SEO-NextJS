"use client";

import { useMemo, useState } from "react";
import { CodeOutput, Field, Panel, Segmented, Select, TextArea, TextInput, Toggle, escapeHtml } from "./ui";
import { SerpCard, type Device } from "./serp";

type S = {
  title: string;
  description: string;
  canonical: string;
  index: boolean;
  follow: boolean;
  largeImages: boolean;
  lang: string;
  author: string;
  themeColor: string;
  viewport: boolean;
  charset: boolean;
  ogType: string;
  siteName: string;
  image: string;
  imageAlt: string;
  ogTitle: string;
  ogDesc: string;
  locale: string;
  twCard: string;
  twSite: string;
  twCreator: string;
};

const initial: S = {
  title: "",
  description: "",
  canonical: "",
  index: true,
  follow: true,
  largeImages: true,
  lang: "en",
  author: "",
  themeColor: "",
  viewport: true,
  charset: true,
  ogType: "website",
  siteName: "",
  image: "",
  imageAlt: "",
  ogTitle: "",
  ogDesc: "",
  locale: "en_US",
  twCard: "summary_large_image",
  twSite: "",
  twCreator: "",
};

const handle = (h: string) => (h.trim() ? `@${h.trim().replace(/^@/, "")}` : "");

function build(s: S) {
  const e = (v: string) => escapeHtml(v.trim());
  const lines: string[] = [];
  const m = (name: string, content: string) => content.trim() && lines.push(`<meta name="${name}" content="${e(content)}" />`);
  const p = (prop: string, content: string) => content.trim() && lines.push(`<meta property="${prop}" content="${e(content)}" />`);
  const ogTitle = s.ogTitle || s.title;
  const ogDesc = s.ogDesc || s.description;

  if (s.charset) lines.push(`<meta charset="utf-8" />`);
  if (s.viewport) lines.push(`<meta name="viewport" content="width=device-width, initial-scale=1" />`);
  if (s.title.trim()) lines.push(`<title>${e(s.title)}</title>`);
  m("description", s.description);
  const robots = [s.index ? "index" : "noindex", s.follow ? "follow" : "nofollow", ...(s.index && s.largeImages ? ["max-image-preview:large", "max-snippet:-1"] : [])].join(", ");
  if (!(s.index && s.follow && !s.largeImages)) m("robots", robots);
  if (s.canonical.trim()) lines.push(`<link rel="canonical" href="${e(s.canonical)}" />`);
  m("author", s.author);
  m("theme-color", s.themeColor);

  const og: string[] = [];
  const before = lines.length;
  p("og:type", s.ogType);
  p("og:title", ogTitle);
  p("og:description", ogDesc);
  p("og:url", s.canonical);
  p("og:site_name", s.siteName);
  p("og:locale", s.locale);
  p("og:image", s.image);
  p("og:image:alt", s.imageAlt);
  if (lines.length > before) og.push(...lines.splice(before));

  const tw: string[] = [];
  const b2 = lines.length;
  m("twitter:card", s.twCard);
  m("twitter:site", handle(s.twSite));
  m("twitter:creator", handle(s.twCreator));
  m("twitter:title", s.ogTitle && s.ogTitle !== s.title ? s.ogTitle : "");
  m("twitter:description", s.ogDesc && s.ogDesc !== s.description ? s.ogDesc : "");
  if (lines.length > b2) tw.push(...lines.splice(b2));

  if (!s.title.trim() && !s.description.trim()) return "";
  return [
    `<!-- Primary meta tags -->`,
    ...lines,
    ...(og.length ? ["", "<!-- Open Graph (Facebook, LinkedIn, WhatsApp) -->", ...og] : []),
    ...(tw.length ? ["", "<!-- X / Twitter (falls back to Open Graph for title, description and image) -->", ...tw] : []),
  ].join("\n");
}

export function MetaTagTool() {
  const [s, setS] = useState<S>(initial);
  const [device, setDevice] = useState<Device>("desktop");
  const set = <K extends keyof S>(k: K) => (v: S[K]) => setS((p) => ({ ...p, [k]: v }));
  const code = useMemo(() => build(s), [s]);
  const urlOk = !s.canonical || /^https?:\/\/[^\s]+\.[^\s]+/.test(s.canonical);
  const imgOk = !s.image || /^https?:\/\//.test(s.image);
  let host = "example.com";
  try {
    host = new URL(s.canonical).hostname.replace(/^www\./, "");
  } catch {
    /* keep default */
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <Panel title="1 · Search basics">
          <div className="space-y-5">
            <Field label="Page title" count={{ value: s.title.length, max: 60, min: 30 }} hint="Lead with the topic or service, then your brand. Each page needs its own.">
              {(id) => <TextInput id={id} value={s.title} onChange={(e) => set("title")(e.target.value)} placeholder="e.g. Teeth Whitening in Dubai | Bright Smile Clinic" />}
            </Field>
            <Field label="Meta description" count={{ value: s.description.length, max: 160, min: 120 }} hint="Not a ranking factor, but it decides whether people click.">
              {(id) => <TextArea id={id} rows={3} value={s.description} onChange={(e) => set("description")(e.target.value)} placeholder="Say what the page offers and why someone should choose you." />}
            </Field>
            <Field label="Canonical URL" hint={!urlOk ? <span className="text-ember">Use a full URL starting with https://</span> : "The one address you want Google to index for this page."}>
              {(id) => <TextInput id={id} value={s.canonical} onChange={(e) => set("canonical")(e.target.value)} placeholder="https://www.example.com/teeth-whitening" inputMode="url" />}
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Toggle checked={s.index} onChange={set("index")} label="Allow indexing" hint={s.index ? "index" : "noindex: page stays out of Google"} />
              <Toggle checked={s.follow} onChange={set("follow")} label="Follow links" hint={s.follow ? "follow" : "nofollow on every link"} />
              <Toggle checked={s.largeImages} onChange={set("largeImages")} label="Large previews" hint="max-image-preview:large for Discover" />
            </div>
          </div>
        </Panel>

        <Panel title="2 · Social sharing">
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Content type">
                {(id) => (
                  <Select id={id} value={s.ogType} onChange={(e) => set("ogType")(e.target.value)}>
                    <option value="website">Website / page</option>
                    <option value="article">Article / blog post</option>
                    <option value="product">Product</option>
                    <option value="profile">Profile</option>
                  </Select>
                )}
              </Field>
              <Field label="Site name">{(id) => <TextInput id={id} value={s.siteName} onChange={(e) => set("siteName")(e.target.value)} placeholder="Bright Smile Clinic" />}</Field>
            </div>
            <Field label="Share image URL" hint={!imgOk ? <span className="text-ember">Use a full URL starting with https://</span> : "1200 × 630 px works everywhere. Keep text away from the edges."}>
              {(id) => <TextInput id={id} value={s.image} onChange={(e) => set("image")(e.target.value)} placeholder="https://www.example.com/og/teeth-whitening.jpg" inputMode="url" />}
            </Field>
            <Field label="Image description (alt)">{(id) => <TextInput id={id} value={s.imageAlt} onChange={(e) => set("imageAlt")(e.target.value)} placeholder="Patient smiling after whitening treatment" />}</Field>
            <Field label="Social title (optional)" hint="Leave empty to reuse the page title." count={{ value: s.ogTitle.length, max: 70 }}>
              {(id) => <TextInput id={id} value={s.ogTitle} onChange={(e) => set("ogTitle")(e.target.value)} placeholder="A friendlier headline for social feeds" />}
            </Field>
            <Field label="Social description (optional)" count={{ value: s.ogDesc.length, max: 200 }}>
              {(id) => <TextArea id={id} rows={2} value={s.ogDesc} onChange={(e) => set("ogDesc")(e.target.value)} placeholder="Leave empty to reuse the meta description" />}
            </Field>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <Field label="X card style">
                {(id) => (
                  <Select id={id} value={s.twCard} onChange={(e) => set("twCard")(e.target.value)}>
                    <option value="summary_large_image">Large image</option>
                    <option value="summary">Small image</option>
                  </Select>
                )}
              </Field>
              <Field label="X site handle">{(id) => <TextInput id={id} value={s.twSite} onChange={(e) => set("twSite")(e.target.value)} placeholder="@brand" />}</Field>
              <Field label="X author handle">{(id) => <TextInput id={id} value={s.twCreator} onChange={(e) => set("twCreator")(e.target.value)} placeholder="@author" />}</Field>
            </div>
          </div>
        </Panel>

        <Panel title="3 · Extras">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Field label="Language">
              {(id) => (
                <Select id={id} value={s.locale} onChange={(e) => setS((p) => ({ ...p, locale: e.target.value, lang: e.target.value.split("_")[0] }))}>
                  <option value="en_US">English (US)</option>
                  <option value="en_GB">English (UK)</option>
                  <option value="ar_AE">Arabic (UAE)</option>
                  <option value="hi_IN">Hindi (India)</option>
                  <option value="fr_FR">French</option>
                  <option value="de_DE">German</option>
                  <option value="es_ES">Spanish</option>
                </Select>
              )}
            </Field>
            <Field label="Author">{(id) => <TextInput id={id} value={s.author} onChange={(e) => set("author")(e.target.value)} placeholder="Jane Doe" />}</Field>
            <Field label="Browser theme colour">{(id) => <TextInput id={id} value={s.themeColor} onChange={(e) => set("themeColor")(e.target.value)} placeholder="#0a0a0b" />}</Field>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Toggle checked={s.charset} onChange={set("charset")} label="Include charset" />
            <Toggle checked={s.viewport} onChange={set("viewport")} label="Include mobile viewport" />
          </div>
        </Panel>
      </div>

      <div className="space-y-6 lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:self-start">
        <Panel title="Google preview" actions={<Segmented label="Device" value={device} onChange={setDevice} options={[{ value: "desktop", label: "Desktop" }, { value: "mobile", label: "Mobile" }]} />}>
          <div className="rounded-md bg-[#f8f9fa] p-4">
            <SerpCard title={s.title} description={s.description} url={s.canonical || "https://www.example.com/page"} siteName={s.siteName} device={device} />
          </div>
        </Panel>
        <Panel title="Social preview">
          <div className="overflow-hidden rounded-md border border-[#dadde1] bg-white font-[Arial,sans-serif]">
            <div className="grid aspect-[1.91/1] place-items-center bg-[#e9ebee] text-xs text-[#606770]">
              {s.image && imgOk ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.image} alt={s.imageAlt} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                "1200 × 630 share image"
              )}
            </div>
            <div className="border-t border-[#dadde1] bg-[#f2f3f5] px-3 py-2.5">
              <p className="truncate text-[12px] text-[#606770] uppercase">{host}</p>
              <p className="truncate text-[16px] font-semibold text-[#1d2129]">{s.ogTitle || s.title || "Your page title"}</p>
              <p className="line-clamp-1 text-[14px] text-[#606770]">{s.ogDesc || s.description || "Your description"}</p>
            </div>
          </div>
        </Panel>
        <CodeOutput code={code} title="Paste inside <head>" minRows={10} />
      </div>
    </div>
  );
}
