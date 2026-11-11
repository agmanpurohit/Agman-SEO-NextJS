"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

export type MediaUsage = { kind: "post" | "page"; label: string; href: string; where: string };
export type MediaItem = {
  id: string;
  url: string;
  filename: string;
  title: string;
  alt: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  createdAt: string;
  usage: MediaUsage[];
};
export type Picked = { url: string; alt: string; width: number | null; height: number | null };

const input = "w-full rounded border border-line-2 bg-ink-2 px-3 py-2 text-sm text-bone outline-none placeholder:text-mute focus:border-bone";
const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";

/**
 * Media library. mode="manage" is the full admin page; mode="pick" is used inside the editors'
 * "Choose from library" dialog and adds a "Use this image" button.
 */
export function MediaBrowser({ mode = "manage", onPick, initial }: { mode?: "manage" | "pick"; onPick?: (p: Picked) => void; initial?: MediaItem[] }) {
  const [items, setItems] = useState<MediaItem[]>(initial ?? []);
  const [loading, setLoading] = useState(!initial);
  const [loadError, setLoadError] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "noalt" | "unused">("all");
  const [selId, setSelId] = useState<string | null>(null);
  const [uploads, setUploads] = useState<{ name: string; state: "up" | "ok" | "err"; msg?: string }[]>([]);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/blog/media", { cache: "no-store" }).catch(() => null);
    if (res?.ok) {
      setItems((await res.json()).media);
      setLoadError("");
    } else setLoadError(res?.status === 401 ? "Your session has expired. Sign in again to see the media library." : "Couldn't load the media library. Check your connection and try again.");
    setLoading(false);
  }, []);
  useEffect(() => {
    if (!initial) void load();
  }, [initial, load]);

  async function uploadFiles(files: File[]) {
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) return;
    setUploads(imgs.map((f) => ({ name: f.name, state: "up" })));
    let lastId: string | null = null;
    for (const [i, f] of imgs.entries()) {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/admin/blog/media", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      setUploads((u) => u.map((x, j) => (j === i ? (res.ok ? { ...x, state: "ok" } : { ...x, state: "err", msg: data.error ?? "Upload failed" }) : x)));
      if (res.ok) lastId = data.id;
    }
    await load();
    if (lastId) setSelId(lastId);
    setTimeout(() => setUploads((u) => u.filter((x) => x.state === "err")), 2500);
  }

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter(
      (m) =>
        (!s || [m.title, m.filename, m.alt, m.id].some((x) => x.toLowerCase().includes(s))) &&
        (filter === "all" || (filter === "noalt" && !m.alt.trim()) || (filter === "unused" && m.usage.length === 0)),
    );
  }, [items, q, filter]);
  const sel = items.find((m) => m.id === selId) ?? null;
  const total = items.reduce((n, m) => n + m.size, 0);

  return (
    <div
      className={`relative ${drag ? "outline-2 outline-offset-4 outline-ember outline-dashed" : ""}`}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDrag(true);
        }
      }}
      onDragLeave={(e) => e.currentTarget === e.target && setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        void uploadFiles([...e.dataTransfer.files]);
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-primary !h-10 !px-5" onClick={() => fileRef.current?.click()}>
          Upload images
        </button>
        <input ref={fileRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={(e) => (void uploadFiles([...(e.target.files ?? [])]), (e.target.value = ""))} />
        <label className="min-w-[12rem] flex-1">
          <span className="sr-only">Search media</span>
          <input className={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or alt text" />
        </label>
        <div className="flex rounded border border-line-2 p-0.5" role="radiogroup" aria-label="Filter">
          {(
            [
              ["all", "All"],
              ["noalt", "Missing alt"],
              ["unused", "Unused"],
            ] as const
          ).map(([k, l]) => (
            <button key={k} type="button" role="radio" aria-checked={filter === k} onClick={() => setFilter(k)} className={`rounded px-3 py-1.5 text-xs ${filter === k ? "bg-bone text-ink" : "text-bone-dim hover:text-bone"}`}>
              {l}
              {k === "noalt" ? ` (${items.filter((m) => !m.alt.trim()).length})` : k === "unused" ? ` (${items.filter((m) => !m.usage.length).length})` : ""}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-3 text-xs text-mute">
        {items.length} files · {kb(total)} · Drag images anywhere here to upload. JPG, PNG, WebP, GIF or AVIF, up to 4 MB each.
      </p>
      {uploads.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs" aria-live="polite">
          {uploads.map((u, i) => (
            <li key={i} className={u.state === "err" ? "text-ember-soft" : u.state === "ok" ? "text-[#4fd18b]" : "text-bone-dim"}>
              {u.state === "up" ? "Uploading" : u.state === "ok" ? "Uploaded" : "Failed"} · {u.name}
              {u.msg ? ` — ${u.msg}` : ""}
            </li>
          ))}
        </ul>
      )}

      <div className={`mt-6 grid grid-cols-1 gap-6 ${sel ? "lg:grid-cols-[minmax(0,1fr)_340px]" : ""}`}>
        <div className="min-w-0">
          {loading ? (
            <p className="py-16 text-center text-sm text-mute">Loading media…</p>
          ) : loadError ? (
            <p role="alert" className="border border-dashed border-ember/50 py-16 text-center text-sm text-ember-soft">
              {loadError}
            </p>
          ) : shown.length === 0 ? (
            <p className="border border-dashed border-line-2 py-16 text-center text-sm text-bone-dim">{items.length ? "No files match." : "No images yet. Upload your first one."}</p>
          ) : (
            <ul className={`grid gap-3 ${mode === "pick" ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"}`}>
              {shown.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setSelId(m.id)}
                    onDoubleClick={() => mode === "pick" && onPick?.({ url: m.url, alt: m.alt, width: m.width, height: m.height })}
                    aria-pressed={selId === m.id}
                    className={`group block w-full overflow-hidden rounded border text-left transition-colors ${selId === m.id ? "border-ember" : "border-line hover:border-line-2"}`}
                  >
                    <span className="block aspect-[4/3] bg-[repeating-conic-gradient(#17171a_0_25%,#111113_0_50%)] bg-[length:16px_16px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.url} alt={m.alt} loading="lazy" decoding="async" className="h-full w-full object-contain" />
                    </span>
                    <span className="block px-2.5 py-2">
                      <span className="block truncate text-xs text-bone">{m.title || m.filename}</span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[0.65rem] text-mute">
                        {m.width && m.height ? `${m.width}×${m.height}` : m.mime.replace("image/", "")} · {kb(m.size)}
                        {!m.alt.trim() && <span className="rounded bg-[#f0b64a]/15 px-1 text-[#f0b64a]">no alt</span>}
                        {!m.usage.length && <span className="rounded bg-line px-1">unused</span>}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {sel && (
          <Details
            key={sel.id}
            item={sel}
            mode={mode}
            onClose={() => setSelId(null)}
            onSaved={(alt, title) => setItems((list) => list.map((m) => (m.id === sel.id ? { ...m, alt, title } : m)))}
            onDeleted={() => {
              setItems((list) => list.filter((m) => m.id !== sel.id));
              setSelId(null);
            }}
            onPick={onPick}
          />
        )}
      </div>
    </div>
  );
}

function Details({ item, mode, onClose, onSaved, onDeleted, onPick }: { item: MediaItem; mode: "manage" | "pick"; onClose: () => void; onSaved: (alt: string, title: string) => void; onDeleted: () => void; onPick?: (p: Picked) => void }) {
  const [alt, setAlt] = useState(item.alt);
  const [title, setTitle] = useState(item.title || item.filename.replace(/\.[^.]+$/, ""));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const dirty = alt !== item.alt || title !== (item.title || item.filename.replace(/\.[^.]+$/, ""));
  const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${item.url}` : item.url;

  async function save() {
    setBusy(true);
    const res = await fetch(`/api/admin/media/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ alt, title }) });
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: "Couldn't save." });
    onSaved(alt.trim(), title.trim());
    setMsg({ ok: true, text: "Saved." });
  }

  async function remove() {
    if (!window.confirm(`Delete “${item.title || item.filename}” permanently? This can't be undone.`)) return;
    setBusy(true);
    let res = await fetch(`/api/admin/media/${item.id}`, { method: "DELETE" });
    if (res.status === 409) {
      const data = await res.json();
      const where = (data.usage as MediaUsage[]).map((u) => `• ${u.label} (${u.where})`).join("\n");
      if (!window.confirm(`This image is still used in:\n\n${where}\n\nThose places will show a broken image. Delete anyway?`)) return setBusy(false);
      res = await fetch(`/api/admin/media/${item.id}?force=1`, { method: "DELETE" });
    }
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: "Couldn't delete." });
    onDeleted();
  }

  return (
    <aside className="self-start border border-line bg-ink-2/60 p-4 lg:sticky lg:top-[calc(var(--header-h)+1rem)]" aria-label="Image details">
      <div className="mb-3 flex items-center justify-between">
        <p className="t-label">Details</p>
        <button type="button" onClick={onClose} className="text-xs text-mute hover:text-bone" aria-label="Close details">
          ✕
        </button>
      </div>
      <div className="aspect-[4/3] overflow-hidden rounded border border-line bg-[repeating-conic-gradient(#17171a_0_25%,#111113_0_50%)] bg-[length:16px_16px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.url} alt={item.alt} className="h-full w-full object-contain" />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <dt className="text-mute">Size</dt>
        <dd className="text-bone-dim">{item.width && item.height ? `${item.width} × ${item.height}px · ` : ""}{kb(item.size)}</dd>
        <dt className="text-mute">Type</dt>
        <dd className="text-bone-dim">{item.mime.replace("image/", "").toUpperCase()}</dd>
        <dt className="text-mute">Uploaded</dt>
        <dd className="text-bone-dim">{new Date(item.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</dd>
      </dl>
      {item.size > 400 * 1024 && <p className="mt-2 text-xs text-[#f0b64a]">Over 400 KB: consider compressing it to WebP for faster pages.</p>}

      <label className="mt-4 block">
        <span className="t-label mb-1 block">Name</span>
        <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="mt-3 block">
        <span className="mb-1 flex justify-between">
          <span className="t-label">Alt text</span>
          <span className={`t-mono text-xs ${alt.length > 125 ? "text-[#f0b64a]" : "text-mute"}`}>{alt.length}/125</span>
        </span>
        <textarea className={`${input} resize-y`} rows={2} value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe what the image shows, for Google and screen readers" />
      </label>
      <p className="mt-1 text-[0.7rem] text-mute">Used automatically when you insert this image from the library.</p>

      <div className="mt-3">
        <span className="t-label mb-1 block">URL</span>
        <div className="flex gap-2">
          <input className={`${input} t-mono text-xs`} value={item.url} readOnly onFocus={(e) => e.currentTarget.select()} aria-label="Image URL" />
          <button
            type="button"
            className="shrink-0 rounded border border-line-2 px-3 text-xs text-bone hover:border-bone"
            onClick={async () => {
              await navigator.clipboard.writeText(fullUrl).catch(() => {});
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="mt-4">
        <span className="t-label mb-1 block">Used in</span>
        {item.usage.length ? (
          <ul className="space-y-1 text-xs">
            {item.usage.map((u, i) => (
              <li key={i}>
                <Link href={u.href} className="link-u text-bone" target={mode === "pick" ? "_blank" : undefined}>
                  {u.label}
                </Link>{" "}
                <span className="text-mute">· {u.where}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-mute">Not used anywhere yet.</p>
        )}
      </div>

      {msg && <p className={`mt-3 text-xs ${msg.ok ? "text-[#4fd18b]" : "text-ember-soft"}`}>{msg.text}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {mode === "pick" && (
          <button
            type="button"
            className="btn btn-primary !h-10 !px-5"
            onClick={async () => {
              if (dirty) await save();
              onPick?.({ url: item.url, alt: alt.trim(), width: item.width, height: item.height });
            }}
          >
            Use this image
          </button>
        )}
        <button type="button" className={`btn ${mode === "pick" ? "btn-ghost" : "btn-primary"} !h-10 !px-4`} disabled={busy || !dirty} onClick={save}>
          Save
        </button>
        {mode === "manage" && (
          <button type="button" className="ml-auto text-xs text-mute hover:text-ember" disabled={busy} onClick={remove}>
            Delete
          </button>
        )}
      </div>
    </aside>
  );
}
