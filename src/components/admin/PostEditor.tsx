"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { analysePost, effectiveMetaDescription, effectiveMetaTitle } from "@/lib/blog/seo-analysis";
import { readingMinutes, wordCount } from "@/lib/blog/content";
import { parseCustomSchema, AUTO_SCHEMA_TYPES } from "@/lib/blog/custom-schema";
import { slugify, isScheduled, type PostInput, type FaqItem } from "@/lib/blog/types";
import { DeletePostButton } from "./DeletePostButton";

const SITE = "agmanrajpurohit.com";

// The visual editor is only needed in the dashboard and only in the browser.
const VisualEditor = dynamic(() => import("./VisualEditor").then((m) => m.VisualEditor), {
  ssr: false,
  loading: () => <div className="min-h-[60vh] p-5 text-sm text-mute">Loading editor…</div>,
});

type Mode = "visual" | "html" | "markdown";

type Props = { id?: number; initial: PostInput; categories: string[] };

/** Full-featured post editor: content, live preview, SEO analysis, previews, media, FAQ, scheduling. */
export function PostEditor({ id, initial, categories }: Props) {
  const router = useRouter();
  const [p, setP] = useState<PostInput>(initial);
  const [slugTouched, setSlugTouched] = useState(!!id);
  const [view, setView] = useState<"write" | "split" | "preview">("split");
  // Visual and HTML edit the same HTML source; Markdown is its own format.
  const [mode, setMode] = useState<Mode>(initial.contentFormat === "markdown" ? "markdown" : "visual");
  const [converting, setConverting] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [saving, setSaving] = useState<"" | "draft" | "publish">("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState<"" | "cover" | "body" | "og">("");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const fileBody = useRef<HTMLInputElement>(null);

  const set = useCallback(<K extends keyof PostInput>(k: K, v: PostInput[K]) => {
    setP((prev) => {
      const next = { ...prev, [k]: v };
      if (k === "title" && !slugTouched) next.slug = slugify(v as string);
      return next;
    });
    setDirty(true);
  }, [slugTouched]);

  const analysis = useMemo(() => analysePost(p), [p]);
  const wc = useMemo(() => wordCount(p.contentMd, p.contentFormat), [p.contentMd, p.contentFormat]);
  const schema = useMemo(() => parseCustomSchema(p.customSchema), [p.customSchema]);

  // Live preview, rendered by the same server-side renderer as the public page.
  useEffect(() => {
    if (view === "write" || mode === "visual") return;
    const t = setTimeout(async () => {
      const res = await fetch("/api/admin/blog/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contentMd: p.contentMd, contentFormat: p.contentFormat }) });
      if (res.ok) setPreviewHtml((await res.json()).html);
    }, 350);
    return () => clearTimeout(t);
  }, [p.contentMd, p.contentFormat, view, mode]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const save = useCallback(
    async (mode: "draft" | "publish") => {
      setSaving(mode);
      setNotice(null);
      setErrors({});
      // "draft" saves (or unpublishes) as a draft; "publish" publishes, schedules or updates.
      const body = { ...p, status: mode === "publish" ? "published" : "draft" };
      const res = await fetch(id ? `/api/admin/blog/${id}` : "/api/admin/blog", { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      setSaving("");
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        setNotice({ tone: "err", text: data.error ?? Object.values(data.errors ?? {})[0] ?? "Couldn’t save. Check the highlighted fields." });
        return;
      }
      setDirty(false);
      setP((prev) => ({ ...prev, status: data.post.status, publishedAt: data.post.publishedAt, slug: data.post.slug }));
      const scheduled = isScheduled(data.post);
      setNotice({ tone: "ok", text: mode === "draft" ? "Draft saved." : scheduled ? `Scheduled for ${new Date(data.post.publishedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}.` : "Published. The post is live." });
      if (!id) router.replace(`/admin/blog/${data.post.id}`);
      else router.refresh();
    },
    [p, id, router],
  );

  // Ctrl/Cmd+S saves (as draft if not yet published, otherwise updates the live post).
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save(p.status === "published" ? "publish" : "draft");
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [save, p.status]);

  async function upload(file: File): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/blog/media", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setNotice({ tone: "err", text: data.error ?? "Upload failed." });
      return null;
    }
    return data.url as string;
  }

  // ── format switching ──
  // Visual ⇄ HTML: same source, nothing to convert. To or from Markdown: convert the content.
  async function switchMode(next: Mode) {
    if (next === mode || converting) return;
    const hasContent = p.contentMd.trim().length > 0;
    if (next === "markdown") {
      if (hasContent) {
        if (!window.confirm("Convert this post to Markdown? Headings, lists, links, images and tables are kept; custom HTML styling may be simplified.")) return;
        setConverting(true);
        const { default: TurndownService } = await import("turndown");
        const td = new TurndownService({ headingStyle: "atx", bulletListMarker: "-", codeBlockStyle: "fenced", emDelimiter: "*" });
        td.keep(["table", "u", "sup", "sub", "mark"]);
        set("contentMd", td.turndown(p.contentMd));
        setConverting(false);
      }
      set("contentFormat", "markdown");
    } else {
      if (p.contentFormat === "markdown" && hasContent) {
        setConverting(true);
        const res = await fetch("/api/admin/blog/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contentMd: p.contentMd, contentFormat: "markdown" }) });
        setConverting(false);
        if (!res.ok) return setNotice({ tone: "err", text: "Couldn’t convert the content. Please try again." });
        // Strip the display-only extras the renderer adds (heading anchors, ids, lazy-loading).
        const doc = new DOMParser().parseFromString((await res.json()).html, "text/html");
        doc.querySelectorAll("a.heading-anchor").forEach((a) => a.remove());
        doc.querySelectorAll("[id],[loading],[decoding]").forEach((el) => ["id", "loading", "decoding"].forEach((k) => el.removeAttribute(k)));
        doc.querySelectorAll("a[target]").forEach((a) => { a.removeAttribute("target"); a.removeAttribute("rel"); });
        set("contentMd", doc.body.innerHTML.trim());
      }
      set("contentFormat", "html");
    }
    setMode(next);
  }

  // ── markdown toolbar ──
  const wrap = (before: string, after = before, placeholder = "text") => {
    const ta = textarea.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const sel = value.slice(s, e) || placeholder;
    const next = value.slice(0, s) + before + sel + after + value.slice(e);
    set("contentMd", next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(s + before.length, s + before.length + sel.length);
    });
  };
  const linePrefix = (prefix: string) => {
    const ta = textarea.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const start = value.lastIndexOf("\n", s - 1) + 1;
    const block = value.slice(start, e).split("\n").map((l) => prefix + l.replace(/^(#{1,6}\s|>\s|-\s|\d+\.\s)/, "")).join("\n");
    set("contentMd", value.slice(0, start) + block + value.slice(e));
    requestAnimationFrame(() => ta.focus());
  };
  const insert = (text: string) => {
    const ta = textarea.current;
    if (!ta) return;
    const { selectionStart: s, value } = ta;
    set("contentMd", value.slice(0, s) + text + value.slice(s));
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(s + text.length, s + text.length);
    });
  };

  const scheduled = isScheduled(p);
  const statusLabel = p.status === "draft" ? "Draft" : scheduled ? "Scheduled" : "Published";
  const input = "w-full rounded border border-line-2 bg-ink-2 px-3 py-2.5 text-bone outline-none transition-colors focus:border-bone";
  const label = "t-label mb-1.5 block";
  const err = (k: string) => errors[k] && <p className="mt-1 text-xs text-ember-soft">{errors[k]}</p>;

  const metaTitle = effectiveMetaTitle(p);
  const metaDesc = effectiveMetaDescription(p);

  return (
    <div className="pb-24">
      {/* Top bar */}
      <div className="sticky top-0 z-30 -mx-[var(--gutter)] mb-8 border-b border-line bg-ink/90 px-[var(--gutter)] py-3 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/blog" className="t-label !text-bone hover:!text-ember">
            ← All posts
          </Link>
          <span className={`rounded-full border px-2.5 py-0.5 text-xs ${p.status === "draft" ? "border-line-2 text-bone-dim" : scheduled ? "border-[#f0b64a]/50 text-[#f0b64a]" : "border-[#4fd18b]/50 text-[#4fd18b]"}`}>{statusLabel}</span>
          {dirty && <span className="t-label !text-[#f0b64a]">Unsaved changes</span>}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {id && p.status === "published" && !scheduled && (
              <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost !h-10 !px-4">
                View post ↗
              </a>
            )}
            <button type="button" onClick={() => save("draft")} disabled={!!saving} className="btn btn-ghost !h-10 !px-4 disabled:opacity-60">
              {saving === "draft" ? "Saving…" : p.status === "published" ? "Unpublish to draft" : "Save draft"}
            </button>
            <button type="button" onClick={() => save("publish")} disabled={!!saving} className="btn btn-primary !h-10 !px-5 disabled:opacity-60">
              {saving === "publish" ? "Publishing…" : p.status === "published" ? "Update" : scheduled || (p.publishedAt && new Date(p.publishedAt) > new Date()) ? "Schedule" : "Publish"}
            </button>
          </div>
        </div>
        {notice && (
          <p role="status" className={`mt-2 text-sm ${notice.tone === "ok" ? "text-[#4fd18b]" : "text-ember-soft"}`}>
            {notice.text}
          </p>
        )}
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* ── Main column ── */}
        <div className="min-w-0 space-y-6">
          <div>
            <label htmlFor="title" className="sr-only">
              Title
            </label>
            <input
              id="title"
              value={p.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Post title"
              className="w-full border-0 border-b border-line-2 bg-transparent pb-3 text-[clamp(1.8rem,3.4vw,2.8rem)] leading-tight font-semibold tracking-tight text-bone outline-none focus:border-bone"
            />
            {err("title")}
            <div className="mt-3 flex flex-wrap items-center gap-1 text-sm">
              <span className="t-mono text-mute">{SITE}/blog/</span>
              <input
                aria-label="URL slug"
                value={p.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", slugify(e.target.value));
                }}
                className="t-mono min-w-[12rem] flex-1 rounded border border-transparent bg-transparent px-1 text-bone outline-none hover:border-line-2 focus:border-bone"
              />
              {slugTouched && (
                <button type="button" className="t-label !text-bone-dim hover:!text-bone" onClick={() => { setSlugTouched(false); set("slug", slugify(p.title)); }}>
                  Reset from title
                </button>
              )}
            </div>
            {err("slug")}
            {id && initial.slug && p.slug !== initial.slug && initial.status === "published" && (
              <p className="mt-1 text-xs text-[#f0b64a]">The old URL will automatically redirect to the new one.</p>
            )}
          </div>

          <div>
            <label htmlFor="excerpt" className={label}>
              Excerpt <span className="normal-case tracking-normal text-mute">— shown on the blog page and used as the meta description if you leave that empty</span>
            </label>
            <textarea id="excerpt" rows={2} value={p.excerpt} onChange={(e) => set("excerpt", e.target.value)} className={`${input} resize-y`} placeholder="One or two sentences on what readers will get from this post." />
            <p className="mt-1 text-right text-xs text-mute">{p.excerpt.length} / 300</p>
          </div>

          {/* Editor */}
          <div className="border border-line">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-ink px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="t-label">Write in</span>
                <div className="flex rounded border border-line-2 p-0.5" role="radiogroup" aria-label="Content format">
                  {([
                    ["visual", "Visual"],
                    ["html", "HTML"],
                    ["markdown", "Markdown"],
                  ] as const).map(([m, label]) => (
                    <button
                      key={m}
                      type="button"
                      role="radio"
                      aria-checked={mode === m}
                      disabled={converting}
                      onClick={() => switchMode(m)}
                      className={`rounded px-3 py-1 text-xs ${mode === m ? "bg-bone text-ink" : "text-bone-dim hover:text-bone"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {converting && <span className="text-xs text-mute">Converting…</span>}
              </div>
              <span className="text-xs text-mute">
                {mode === "visual" ? "Paste straight from Google Docs, Word or ChatGPT: formatting is kept." : mode === "html" ? "Paste or write HTML. Scripts, styles and iframes are removed on save." : "Markdown syntax: ## heading, **bold**, [link](url)."}
              </span>
            </div>

            {mode === "visual" ? (
              <VisualEditor
                value={p.contentMd}
                onChange={(html) => set("contentMd", html)}
                uploading={uploading === "body"}
                onUploadImage={async (file) => {
                  setUploading("body");
                  const url = await upload(file);
                  setUploading("");
                  return url;
                }}
              />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-1 border-b border-line bg-ink-2 px-2 py-1.5">
                  {(mode === "markdown"
                    ? [
                        ["H2", () => linePrefix("## "), "Section heading"],
                        ["H3", () => linePrefix("### "), "Sub-heading"],
                        ["B", () => wrap("**"), "Bold"],
                        ["I", () => wrap("*"), "Italic"],
                        ["Link", () => wrap("[", "](https://)", "link text"), "Link"],
                        ["• List", () => linePrefix("- "), "Bulleted list"],
                        ["1. List", () => linePrefix("1. "), "Numbered list"],
                        ["Quote", () => linePrefix("> "), "Quote"],
                        ["Code", () => wrap("`"), "Inline code"],
                        ["Table", () => insert("\n\n| Column | Column |\n| --- | --- |\n| Cell | Cell |\n\n"), "Table"],
                        ["—", () => insert("\n\n---\n\n"), "Divider"],
                      ]
                    : [
                        ["H2", () => wrap("<h2>", "</h2>", "Section heading"), "Section heading"],
                        ["H3", () => wrap("<h3>", "</h3>", "Sub-heading"), "Sub-heading"],
                        ["P", () => wrap("<p>", "</p>", "Paragraph"), "Paragraph"],
                        ["B", () => wrap("<strong>", "</strong>"), "Bold"],
                        ["I", () => wrap("<em>", "</em>"), "Italic"],
                        ["Link", () => wrap('<a href="https://">', "</a>", "link text"), "Link"],
                        ["• List", () => insert("\n<ul>\n  <li>Item</li>\n  <li>Item</li>\n</ul>\n"), "Bulleted list"],
                        ["1. List", () => insert("\n<ol>\n  <li>Step</li>\n  <li>Step</li>\n</ol>\n"), "Numbered list"],
                        ["Quote", () => wrap("<blockquote><p>", "</p></blockquote>", "Quote"), "Quote"],
                        ["Code", () => wrap("<code>", "</code>", "code"), "Inline code"],
                        ["Table", () => insert("\n<table>\n  <thead><tr><th>Column</th><th>Column</th></tr></thead>\n  <tbody><tr><td>Cell</td><td>Cell</td></tr></tbody>\n</table>\n"), "Table"],
                        ["—", () => insert("\n<hr />\n"), "Divider"],
                      ]
                  ).map(([t, fn, title]) => (
                    <button key={t as string} type="button" title={title as string} onClick={fn as () => void} className="rounded px-2.5 py-1.5 text-xs text-bone-dim transition-colors hover:bg-ink-3 hover:text-bone">
                      {t as string}
                    </button>
                  ))}
                  <button type="button" title="Upload and insert an image" onClick={() => fileBody.current?.click()} className="rounded px-2.5 py-1.5 text-xs text-bone-dim hover:bg-ink-3 hover:text-bone">
                    {uploading === "body" ? "Uploading…" : "Image"}
                  </button>
                  <input
                    ref={fileBody}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (!f) return;
                      setUploading("body");
                      const url = await upload(f);
                      setUploading("");
                      if (url) insert(mode === "markdown" ? `\n\n![Describe this image](${url} "Optional caption")\n\n` : `\n<figure>\n  <img src="${url}" alt="Describe this image" />\n  <figcaption>Optional caption</figcaption>\n</figure>\n`);
                    }}
                  />
                  <div className="ml-auto flex rounded border border-line-2 p-0.5">
                    {(["write", "split", "preview"] as const).map((v) => (
                      <button key={v} type="button" onClick={() => setView(v)} className={`rounded px-2.5 py-1 text-xs capitalize ${view === v ? "bg-bone text-ink" : "text-bone-dim hover:text-bone"}`}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={`grid ${view === "split" ? "lg:grid-cols-2" : ""}`}>
                  {view !== "preview" && (
                    <textarea
                      ref={textarea}
                      aria-label={mode === "html" ? "Post content (HTML)" : "Post content (Markdown)"}
                      value={p.contentMd}
                      onChange={(e) => set("contentMd", e.target.value)}
                      data-lenis-prevent
                      spellCheck={mode === "markdown"}
                      placeholder={
                        mode === "html"
                          ? '<p>Paste or write your HTML here…</p>\n\n<h2>A section heading</h2>\n<p>A paragraph with <strong>bold</strong> text and a <a href="/seo-audit">link</a>.</p>'
                          : "Start writing in Markdown…\n\n## A section heading\n\nA paragraph with **bold** text and a [link](/seo-audit)."
                      }
                      className="t-mono min-h-[60vh] w-full resize-y bg-ink p-5 text-[0.92rem] leading-7 text-bone outline-none"
                    />
                  )}
                  {view !== "write" && (
                    <div data-lenis-prevent className={`min-h-[60vh] overflow-auto bg-ink-2/40 p-5 ${view === "split" ? "max-h-[75vh] border-t border-line lg:border-t-0 lg:border-l" : ""}`}>
                      {p.title && <h1 className="mb-4 text-3xl font-semibold tracking-tight">{p.title}</h1>}
                      {previewHtml ? <div className="blog-prose" dangerouslySetInnerHTML={{ __html: previewHtml }} /> : <p className="t-body text-sm">The preview appears here as you write.</p>}
                    </div>
                  )}
                </div>
              </>
            )}
            <div className="flex flex-wrap justify-between gap-2 border-t border-line px-4 py-2 text-xs text-mute">
              <span>
                {wc} words · {readingMinutes(p.contentMd, p.contentFormat)} min read
              </span>
              <span>{mode === "visual" ? "Visual editor" : mode === "html" ? "HTML" : "Markdown"} · Ctrl+S to save</span>
            </div>
          </div>
          {err("contentMd")}

          <FaqEditor faq={p.faq} onChange={(f) => set("faq", f)} />
        </div>

        {/* ── Sidebar ── */}
        <aside className="space-y-5">
          <Panel title="Publishing">
            <label className={label} htmlFor="publishedAt">
              Publish date
            </label>
            <input
              id="publishedAt"
              type="datetime-local"
              value={p.publishedAt ? toLocalInput(p.publishedAt) : ""}
              onChange={(e) => set("publishedAt", e.target.value ? new Date(e.target.value).toISOString() : null)}
              className={input}
            />
            <p className="mt-1 text-xs text-mute">Leave empty to publish now. A future date schedules the post.</p>
            <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-bone">
              <input type="checkbox" checked={p.featured} onChange={(e) => set("featured", e.target.checked)} className="h-4 w-4 accent-[#ff5a1f]" />
              Feature at the top of the blog page
            </label>
          </Panel>

          <Panel title={`SEO score · ${analysis.score}/100`}>
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-line">
              <div className="h-full transition-[width] duration-500" style={{ width: `${analysis.score}%`, background: analysis.score >= 80 ? "#4fd18b" : analysis.score >= 50 ? "#f0b64a" : "var(--color-ember)" }} />
            </div>
            <label className={label} htmlFor="kw">
              Focus keyword
            </label>
            <input id="kw" value={p.focusKeyword} onChange={(e) => set("focusKeyword", e.target.value)} className={input} placeholder="e.g. local seo for dentists" />
            <label className={`${label} mt-3`}>Secondary keywords</label>
            <TagInput value={p.secondaryKeywords} onChange={(v) => set("secondaryKeywords", v)} placeholder="Add and press Enter" />
            <ul className="mt-4 space-y-2">
              {[...analysis.checks].sort((a, b) => ({ bad: 0, ok: 1, good: 2 })[a.status] - ({ bad: 0, ok: 1, good: 2 })[b.status]).map((c) => (
                <li key={c.id} className="flex gap-2.5 text-xs">
                  <span aria-hidden="true" className={`mt-1 h-2 w-2 shrink-0 rounded-full ${c.status === "good" ? "bg-[#4fd18b]" : c.status === "ok" ? "bg-[#f0b64a]" : "bg-ember"}`} />
                  <span>
                    <span className="text-bone">{c.label}</span>
                    <span className="block text-mute">{c.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Search appearance">
            <div className="mb-4 rounded border border-line bg-white p-3 font-sans">
              <p className="truncate text-[12px] text-[#4d5156]">{SITE} › blog › {p.slug || "post-url"}</p>
              <p className="mt-0.5 line-clamp-2 text-[18px] leading-snug text-[#1a0dab]">{metaTitle ? `${metaTitle}${p.metaTitle ? "" : " | Agman Rajpurohit"}` : "Your post title"}</p>
              <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-[#4d5156]">{metaDesc || "Your meta description shows here. Write one, or the excerpt is used."}</p>
            </div>
            <label className={label} htmlFor="metaTitle">
              SEO title <Counter n={(p.metaTitle || p.title).length} min={30} max={60} />
            </label>
            <input id="metaTitle" value={p.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} className={input} placeholder={p.title || "Defaults to the post title"} />
            <label className={`${label} mt-3`} htmlFor="metaDescription">
              Meta description <Counter n={metaDesc.length} min={120} max={160} />
            </label>
            <textarea id="metaDescription" rows={3} value={p.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} className={`${input} resize-y`} placeholder={p.excerpt || "Defaults to the excerpt"} />
          </Panel>

          <Panel title="Category & tags">
            <label className={label} htmlFor="category">
              Category
            </label>
            <input id="category" list="cat-list" value={p.category} onChange={(e) => set("category", e.target.value)} className={input} placeholder="e.g. Local SEO" />
            <datalist id="cat-list">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <label className={`${label} mt-3`}>Tags</label>
            <TagInput value={p.tags} onChange={(v) => set("tags", v)} placeholder="Add a tag and press Enter" />
          </Panel>

          <Panel title="Cover image">
            <ImageField
              value={p.coverImage}
              uploading={uploading === "cover"}
              onUpload={async (f) => {
                setUploading("cover");
                const url = await upload(f);
                setUploading("");
                if (url) set("coverImage", url);
              }}
              onClear={() => set("coverImage", null)}
            />
            <label className={`${label} mt-3`} htmlFor="coverAlt">
              Alt text
            </label>
            <input id="coverAlt" value={p.coverAlt} onChange={(e) => set("coverAlt", e.target.value)} className={input} placeholder="Describe what the image shows" />
            {err("coverAlt")}
            <p className="mt-1 text-xs text-mute">Best size: 1200×630 (the standard share-image shape), under 400 KB. WebP is ideal. Other shapes are shown whole, never cropped.</p>
          </Panel>

          <Panel title="Social sharing">
            <div className="mb-4 overflow-hidden rounded border border-line">
              <div className="aspect-[1.91/1] bg-ink-3">
                {(p.ogImage || p.coverImage) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={(p.ogImage || p.coverImage)!} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="bg-ink-2 p-3">
                <p className="t-label !text-[0.6rem]">{SITE}</p>
                <p className="mt-1 line-clamp-1 text-sm font-medium text-bone">{p.ogTitle || metaTitle || "Post title"}</p>
                <p className="line-clamp-2 text-xs text-bone-dim">{p.ogDescription || metaDesc}</p>
              </div>
            </div>
            <label className={label} htmlFor="ogTitle">
              Social title
            </label>
            <input id="ogTitle" value={p.ogTitle} onChange={(e) => set("ogTitle", e.target.value)} className={input} placeholder="Defaults to the SEO title" />
            <label className={`${label} mt-3`} htmlFor="ogDescription">
              Social description
            </label>
            <textarea id="ogDescription" rows={2} value={p.ogDescription} onChange={(e) => set("ogDescription", e.target.value)} className={`${input} resize-y`} placeholder="Defaults to the meta description" />
            <label className={`${label} mt-3`}>Social image</label>
            <ImageField
              value={p.ogImage}
              compact
              uploading={uploading === "og"}
              onUpload={async (f) => {
                setUploading("og");
                const url = await upload(f);
                setUploading("");
                if (url) set("ogImage", url);
              }}
              onClear={() => set("ogImage", null)}
              emptyText="Uses the cover image (1200×630 works best)"
            />
          </Panel>

          <Panel title="Advanced SEO">
            <label className={label} htmlFor="canonical">
              Canonical URL
            </label>
            <input id="canonical" value={p.canonicalUrl} onChange={(e) => set("canonicalUrl", e.target.value)} className={input} placeholder={`https://${SITE}/blog/${p.slug || "…"}`} />
            <p className="mt-1 text-xs text-mute">Only set this if the article was first published elsewhere.</p>
            <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-bone">
              <input type="checkbox" checked={p.noindex} onChange={(e) => set("noindex", e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#ff5a1f]" />
              <span>
                Hide from search engines (noindex)
                <span className="block text-xs text-mute">Also removes it from the sitemap and RSS feed.</span>
              </span>
            </label>
            <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm text-bone">
              <input type="checkbox" checked={p.nofollow} onChange={(e) => set("nofollow", e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#ff5a1f]" />
              <span>
                Don’t follow links on this page (nofollow)
                <span className="block text-xs text-mute">Rarely needed.</span>
              </span>
            </label>
          </Panel>

          <Panel title="Custom schema (JSON-LD)">
            <p className="mb-2 text-xs leading-relaxed text-mute">
              Added to this post on top of the automatic {AUTO_SCHEMA_TYPES.filter((t) => t !== "FAQPage" || p.faq.length).join(", ")} schema. Paste JSON, or full{" "}
              <code className="text-bone-dim">&lt;script type=&quot;application/ld+json&quot;&gt;</code> blocks (several are fine).
            </p>
            <textarea
              id="customSchema"
              aria-label="Custom schema JSON-LD"
              rows={9}
              value={p.customSchema}
              onChange={(e) => set("customSchema", e.target.value)}
              data-lenis-prevent
              spellCheck={false}
              placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "HowTo",\n  "name": "…"\n}'}
              className={`${input} t-mono resize-y text-xs leading-5`}
            />
            {p.customSchema.trim() &&
              (schema.ok ? (
                <div className="mt-2 space-y-1 text-xs">
                  <p className="text-[#4fd18b]">
                    ✓ Valid JSON-LD · {schema.blocks.length} block{schema.blocks.length === 1 ? "" : "s"}
                    {schema.types.length ? ` · ${schema.types.join(", ")}` : ""}
                  </p>
                  {schema.types.filter((t) => AUTO_SCHEMA_TYPES.includes(t) && (t !== "FAQPage" || p.faq.length)).map((t) => (
                    <p key={t} className="text-[#f0b64a]">
                      {t} is already added automatically. Two {t} blocks can confuse Google; remove one.
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-ember-soft">✕ {schema.error}</p>
              ))}
            {err("customSchema")}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {schema.ok && schema.blocks.length > 0 && (
                <button
                  type="button"
                  className="text-bone-dim hover:text-bone"
                  onClick={() => set("customSchema", schema.blocks.map((b) => `<script type="application/ld+json">\n${JSON.stringify(b, null, 2)}\n</script>`).join("\n\n"))}
                >
                  Tidy formatting
                </button>
              )}
              <a href="/free-seo-tools/schema-markup-generator" target="_blank" rel="noopener noreferrer" className="text-bone-dim hover:text-bone">
                Schema generator ↗
              </a>
              {id && p.status === "published" && !scheduled && (
                <a href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(`https://${SITE}/blog/${p.slug}`)}`} target="_blank" rel="noopener noreferrer" className="text-bone-dim hover:text-bone">
                  Test in Google ↗
                </a>
              )}
            </div>
          </Panel>

          {id && (
            <div className="border border-ember/30 p-4 text-sm">
              <p className="t-label mb-2 !text-ember-soft">Danger zone</p>
              <DeletePostButton id={id} title={p.title} after="list" />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-line bg-ink-2/40 p-4">
      <h2 className="t-label mb-3 !text-bone">{title}</h2>
      {children}
    </section>
  );
}

function Counter({ n, min, max }: { n: number; min: number; max: number }) {
  const tone = n === 0 ? "text-mute" : n < min || n > max ? "text-[#f0b64a]" : "text-[#4fd18b]";
  return <span className={`float-right normal-case tracking-normal ${tone}`}>{n} / {max}</span>;
}

function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const parts = draft.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) onChange([...new Set([...value, ...parts])]);
    setDraft("");
  };
  return (
    <div className="flex flex-wrap gap-1.5 rounded border border-line-2 bg-ink-2 p-2 focus-within:border-bone">
      {value.map((t) => (
        <span key={t} className="flex items-center gap-1 rounded-full bg-ink-3 px-2.5 py-1 text-xs text-bone">
          {t}
          <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((x) => x !== t))} className="text-mute hover:text-ember">
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={add}
        placeholder={value.length ? "" : placeholder}
        className="min-w-[8rem] flex-1 bg-transparent px-1 text-sm text-bone outline-none"
      />
    </div>
  );
}

function ImageField({ value, onUpload, onClear, uploading, compact, emptyText = "Drop an image here or click to upload" }: { value: string | null; onUpload: (f: File) => void; onClear: () => void; uploading: boolean; compact?: boolean; emptyText?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div>
      {value ? (
        <div className="relative overflow-hidden rounded border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className={`w-full object-cover ${compact ? "aspect-[1.91/1]" : "aspect-video"}`} />
          <div className="absolute top-2 right-2 flex gap-1.5">
            <button type="button" onClick={() => ref.current?.click()} className="rounded bg-ink/80 px-2.5 py-1 text-xs text-bone backdrop-blur">
              Replace
            </button>
            <button type="button" onClick={onClear} className="rounded bg-ink/80 px-2.5 py-1 text-xs text-ember-soft backdrop-blur">
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) onUpload(f);
          }}
          className={`grid w-full place-items-center rounded border border-dashed px-4 text-center text-xs transition-colors ${compact ? "h-24" : "aspect-video"} ${over ? "border-ember text-bone" : "border-line-2 text-mute hover:border-bone hover:text-bone"}`}
        >
          {uploading ? "Uploading…" : emptyText}
        </button>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onUpload(f);
        }}
      />
    </div>
  );
}

function FaqEditor({ faq, onChange }: { faq: FaqItem[]; onChange: (f: FaqItem[]) => void }) {
  return (
    <section className="border border-line p-4">
      <div className="flex items-center justify-between">
        <h2 className="t-label !text-bone">FAQ section</h2>
        <button type="button" onClick={() => onChange([...faq, { q: "", a: "" }])} className="t-label !text-bone hover:!text-ember">
          + Add question
        </button>
      </div>
      <p className="mt-1 text-xs text-mute">Shown at the end of the post and added as FAQPage structured data. Use real questions people ask.</p>
      <div className="mt-3 space-y-3">
        {faq.map((f, i) => (
          <div key={i} className="grid gap-2 rounded border border-line-2 p-3">
            <input
              value={f.q}
              onChange={(e) => onChange(faq.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))}
              placeholder="Question"
              className="w-full rounded border border-line-2 bg-ink-2 px-3 py-2 text-sm text-bone outline-none focus:border-bone"
            />
            <textarea
              rows={2}
              value={f.a}
              onChange={(e) => onChange(faq.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))}
              placeholder="Answer (plain text)"
              className="w-full resize-y rounded border border-line-2 bg-ink-2 px-3 py-2 text-sm text-bone outline-none focus:border-bone"
            />
            <button type="button" onClick={() => onChange(faq.filter((_, j) => j !== i))} className="justify-self-end text-xs text-ember-soft hover:text-ember">
              Remove
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
