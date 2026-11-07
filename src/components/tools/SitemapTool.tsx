"use client";

import { useMemo, useState, type FormEvent } from "react";
import { CodeOutput, Field, Panel, Segmented, Select, SmallButton, TextArea, TextInput, Toggle } from "./ui";

type Page = { url: string; depth: number; lastmod?: string; include: boolean };
type Skipped = { url: string; reason: string };
type Stats = { crawled: number; remaining: number; timedOut: boolean; hitLimit: boolean; robotsFound: boolean; seconds: number };

const xmlEscape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const priorityFor = (depth: number) => Math.max(0.3, 1 - depth * 0.2).toFixed(1);
const today = () => new Date().toISOString().slice(0, 10);

function depthOf(url: string) {
  try {
    return new URL(url).pathname.split("/").filter(Boolean).length;
  } catch {
    return 1;
  }
}

export function SitemapTool() {
  const [mode, setMode] = useState<"crawl" | "paste">("crawl");
  const [site, setSite] = useState("");
  const [max, setMax] = useState("100");
  const [pasted, setPasted] = useState("");
  const [pages, setPages] = useState<Page[]>([]);
  const [skipped, setSkipped] = useState<Skipped[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastmod, setLastmod] = useState<"crawl" | "today" | "none">("crawl");
  const [withFreq, setWithFreq] = useState(false);
  const [freq, setFreq] = useState("weekly");
  const [withPriority, setWithPriority] = useState(false);

  async function crawl(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setPages([]);
    setSkipped([]);
    setStats(null);
    try {
      const r = await fetch("/api/tools/sitemap-crawl", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: site, max: Number(max) }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "The crawl failed.");
      setPages((j.pages as Omit<Page, "include">[]).map((p) => ({ ...p, include: true })));
      setSkipped(j.skipped);
      setStats(j.stats);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function usePasted() {
    const urls = [
      ...new Set(
        pasted
          .split(/\s+/)
          .map((s) => s.trim())
          .filter((s) => /^https?:\/\/\S+\.\S+/.test(s)),
      ),
    ];
    setPages(urls.map((url) => ({ url, depth: depthOf(url), include: true })));
    setSkipped([]);
    setStats(null);
    setError(urls.length ? "" : "No valid URLs found. Each one must start with http:// or https://");
  }

  const included = pages.filter((p) => p.include);
  const xml = useMemo(() => {
    if (!included.length) return "";
    const rows = included.map((p) => {
      const lm = lastmod === "today" ? today() : lastmod === "crawl" ? p.lastmod : undefined;
      return [
        "  <url>",
        `    <loc>${xmlEscape(p.url)}</loc>`,
        lm ? `    <lastmod>${lm}</lastmod>` : "",
        withFreq ? `    <changefreq>${freq}</changefreq>` : "",
        withPriority ? `    <priority>${priorityFor(p.depth)}</priority>` : "",
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n");
    });
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</urlset>\n`;
  }, [included, lastmod, withFreq, freq, withPriority]);

  const reasons = skipped.reduce<Record<string, number>>((a, s) => ((a[s.reason] = (a[s.reason] ?? 0) + 1), a), {});

  return (
    <div className="space-y-6">
      <Panel
        title="1 · Find your pages"
        actions={
          <Segmented
            label="Source"
            value={mode}
            onChange={(v) => {
              setMode(v);
              setError("");
            }}
            options={[
              { value: "crawl", label: "Crawl my site" },
              { value: "paste", label: "Paste URLs" },
            ]}
          />
        }
      >
        {mode === "crawl" ? (
          <form onSubmit={crawl} className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-end">
            <Field label="Website address">{(id) => <TextInput id={id} value={site} onChange={(e) => setSite(e.target.value)} placeholder="https://www.example.com" inputMode="url" required />}</Field>
            <Field label="Max pages">
              {(id) => (
                <Select id={id} value={max} onChange={(e) => setMax(e.target.value)}>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="250">250</option>
                </Select>
              )}
            </Field>
            <SmallButton type="submit" variant="primary" disabled={loading || !site.trim()}>
              {loading ? "Crawling…" : "Start crawl"}
            </SmallButton>
          </form>
        ) : (
          <div>
            <Field label="Your URLs" hint="One per line, or separated by spaces. Duplicates are removed.">
              {(id) => <TextArea id={id} rows={7} value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder={"https://www.example.com/\nhttps://www.example.com/about\nhttps://www.example.com/services/seo"} className="t-mono text-sm" />}
            </Field>
            <div className="mt-3">
              <SmallButton variant="primary" onClick={usePasted} disabled={!pasted.trim()}>
                Use these URLs
              </SmallButton>
            </div>
          </div>
        )}
        {loading && (
          <p className="mt-4 flex items-center gap-3 text-sm text-bone-dim" role="status">
            <span className="h-2 w-2 animate-ping rounded-full bg-ember" aria-hidden="true" />
            Following links and checking each page. This can take up to a minute for bigger sites.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-ember-soft">
            {error}
          </p>
        )}
        {stats && (
          <p className="mt-4 text-sm text-bone-dim">
            Found <strong className="text-bone">{pages.length}</strong> indexable pages from {stats.crawled} checked in {stats.seconds}s.
            {stats.hitLimit && stats.remaining > 0 && " Reached your page limit; there are more pages to find."}
            {stats.timedOut && " Stopped at the time limit, so larger sites may have more pages."}
            {!stats.robotsFound && " No robots.txt was found."}
          </p>
        )}
      </Panel>

      {pages.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <Panel
              title={`2 · Pages (${included.length} of ${pages.length} included)`}
              actions={
                <div className="flex gap-2">
                  <SmallButton onClick={() => setPages(pages.map((p) => ({ ...p, include: true })))}>All</SmallButton>
                  <SmallButton onClick={() => setPages(pages.map((p) => ({ ...p, include: false })))}>None</SmallButton>
                </div>
              }
            >
              <ul className="max-h-[26rem] space-y-1 overflow-auto pr-1">
                {pages.map((p, i) => (
                  <li key={p.url}>
                    <label className="flex cursor-pointer items-start gap-3 rounded px-2 py-1.5 hover:bg-ink">
                      <input type="checkbox" checked={p.include} onChange={(e) => setPages(pages.map((x, j) => (j === i ? { ...x, include: e.target.checked } : x)))} className="mt-1 h-4 w-4 shrink-0 accent-[#ff5a1f]" />
                      <span className="t-mono min-w-0 flex-1 text-xs leading-5 break-all text-bone-dim">{p.url}</span>
                      {p.lastmod && <span className="t-mono shrink-0 text-[0.65rem] text-mute">{p.lastmod}</span>}
                    </label>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="3 · Options">
              <div className="space-y-5">
                <Field label="Last modified date" hint="Google uses lastmod when it's accurate. Don't set every page to today unless they really changed.">
                  {(id) => (
                    <Select id={id} value={lastmod} onChange={(e) => setLastmod(e.target.value as typeof lastmod)}>
                      <option value="crawl">From the server, where available</option>
                      <option value="today">Today for every page</option>
                      <option value="none">Leave it out</option>
                    </Select>
                  )}
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Toggle checked={withFreq} onChange={setWithFreq} label="Add change frequency" hint="Google ignores it. Bing may use it." />
                  <Toggle checked={withPriority} onChange={setWithPriority} label="Add priority" hint="Google ignores it. Set by link depth." />
                </div>
                {withFreq && (
                  <Field label="Change frequency">
                    {(id) => (
                      <Select id={id} value={freq} onChange={(e) => setFreq(e.target.value)}>
                        {["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"].map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>
                )}
              </div>
            </Panel>

            {skipped.length > 0 && (
              <Panel title={`Left out (${skipped.length})`}>
                <p className="mb-3 text-sm text-bone-dim">These pages were found but don't belong in a sitemap:</p>
                <ul className="mb-4 flex flex-wrap gap-2">
                  {Object.entries(reasons).map(([r, n]) => (
                    <li key={r} className="rounded-full border border-line-2 px-3 py-1 text-xs text-bone-dim">
                      {r}: <span className="text-bone">{n}</span>
                    </li>
                  ))}
                </ul>
                <details>
                  <summary className="cursor-pointer text-sm text-bone">Show the list</summary>
                  <ul className="mt-3 max-h-60 space-y-1 overflow-auto">
                    {skipped.map((s) => (
                      <li key={s.url} className="t-mono text-xs break-all text-mute">
                        <span className="text-ember-soft">{s.reason}</span> · {s.url}
                      </li>
                    ))}
                  </ul>
                </details>
              </Panel>
            )}
          </div>

          <div className="space-y-6 lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:self-start">
            <CodeOutput code={xml} title="sitemap.xml" filename="sitemap.xml" mime="application/xml" minRows={14} />
            <Panel title="Next steps">
              <ol className="list-decimal space-y-2 pl-5 text-sm text-bone-dim marker:text-ember">
                <li>Upload the file to your site's root so it opens at /sitemap.xml.</li>
                <li>
                  Add <span className="t-mono text-bone">Sitemap: https://yoursite.com/sitemap.xml</span> to robots.txt.
                </li>
                <li>Submit it in Google Search Console and Bing Webmaster Tools.</li>
                <li>Regenerate it when you add or remove pages. A CMS plugin can keep it updated automatically.</li>
              </ol>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
