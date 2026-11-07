"use client";

import { useMemo, useState, type FormEvent } from "react";
import { CopyButton, Field, Panel, Segmented, SmallButton, Stat, TextArea, TextInput, Toggle } from "./ui";
import { logAction, sessionId, useToolLog } from "@/lib/tools/track";

const TOOL = "keyword-density-checker";

const STOP = new Set(
  "a about above after again against all am an and any are aren't as at be because been before being below between both but by can can't cannot could couldn't did didn't do does doesn't doing don't down during each few for from further get got had hadn't has hasn't have haven't having he he'd he'll he's her here here's hers herself him himself his how how's i i'd i'll i'm i've if in into is isn't it it's its itself just let's me more most mustn't my myself no nor not now of off on once only or other ought our ours ourselves out over own same shan't she she'd she'll she's should shouldn't so some such than that that's the their theirs them themselves then there there's these they they'd they'll they're they've this those through to too under until up us very was wasn't we we'd we'll we're we've were weren't what what's when when's where where's which while who who's whom why why's will with won't would wouldn't you you'd you'll you're you've your yours yourself yourselves also may might must shall one two new like use used using via per etc us".split(
    " ",
  ),
);

type Row = { phrase: string; count: number; density: number };
type Page = { title: string; metaDescription: string; h1: string[]; finalUrl: string };

function tokenize(text: string) {
  return (text.toLowerCase().normalize("NFKC").match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)*/gu) ?? []).map((w) => w.replace(/’/g, "'"));
}

function analyse(text: string, n: number, skipStop: boolean, minLen: number) {
  const words = tokenize(text);
  const total = words.length;
  const counts = new Map<string, number>();
  for (let i = 0; i + n <= words.length; i++) {
    const gram = words.slice(i, i + n);
    if (gram.some((w) => /^\d+$/.test(w))) continue;
    if (n === 1 && (gram[0].length < minLen || (skipStop && STOP.has(gram[0])))) continue;
    // Phrases: skip ones that start or end with a stop word ("of the", "seo in").
    if (n > 1 && skipStop && (STOP.has(gram[0]) || STOP.has(gram[n - 1]))) continue;
    const k = gram.join(" ");
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const rows: Row[] = [...counts.entries()]
    .filter(([, c]) => n === 1 || c > 1)
    .map(([phrase, count]) => ({ phrase, count, density: total ? ((count * n) / total) * 100 : 0 }))
    .sort((a, b) => b.count - a.count || a.phrase.localeCompare(b.phrase))
    .slice(0, 100);
  return { rows, total, unique: new Set(words).size };
}

function countPhrase(text: string, phrase: string) {
  const p = tokenize(phrase);
  if (!p.length) return 0;
  const w = tokenize(text);
  let c = 0;
  for (let i = 0; i + p.length <= w.length; i++) if (p.every((x, j) => w[i + j] === x)) c++;
  return c;
}

const SAMPLE =
  "Local SEO helps a dental clinic show up when people nearby search for a dentist. The map pack, the three businesses Google shows with a map, gets most of the clicks for local searches. To get there, a clinic needs a complete Google Business Profile, consistent details across directories and real reviews from patients. Location pages matter too. A clinic with branches in Dubai Marina and Jumeirah should have a page for each area, with its own address, opening hours, photos and the treatments offered there. Local SEO is not a one-off task. Reviews, photos and posts need regular attention, and the website has to load fast on mobile, because most local searches happen on a phone.";

export function KeywordDensityTool() {
  const [mode, setMode] = useState<"text" | "url">("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [n, setN] = useState<"1" | "2" | "3">("1");
  const [skipStop, setSkipStop] = useState(true);
  const [focus, setFocus] = useState("");

  const res = useMemo(() => analyse(text, Number(n), skipStop, 3), [text, n, skipStop]);
  const sentences = useMemo(() => (text.match(/[^.!?\n]+[.!?]+/g) ?? []).length, [text]);
  const focusCount = useMemo(() => countPhrase(text, focus), [text, focus]);
  const focusWords = tokenize(focus).length || 1;
  const focusDensity = res.total ? ((focusCount * focusWords) / res.total) * 100 : 0;
  const max = res.rows[0]?.count ?? 1;

  // Usage log (shown in the admin panel): what was analysed and the headline results.
  const logSummary = `${page ? `URL: ${page.finalUrl}` : `Pasted text`} · ${res.total} words${focus.trim() ? ` · focus “${focus.trim()}” ${focusDensity.toFixed(2)}%` : ""}`;
  const logData = {
    mode,
    url: page?.finalUrl ?? null,
    words: res.total,
    focusKeyword: focus.trim() || null,
    focusCount,
    focusDensity: Number(focusDensity.toFixed(2)),
    topKeywords: res.rows.slice(0, 10).map((r) => `${r.phrase} (${r.count})`),
    text: text.slice(0, 15_000),
  };
  useToolLog(TOOL, { summary: logSummary, data: logData }, text.trim().length > 0);

  async function fetchPage(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const r = await fetch("/api/tools/page-text", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, sid: sessionId() }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Couldn't fetch that page.");
      setText(j.text);
      setPage({ title: j.title, metaDescription: j.metaDescription, h1: j.h1, finalUrl: j.finalUrl });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const csv = ["phrase,count,density_percent", ...res.rows.map((r) => `"${r.phrase}",${r.count},${r.density.toFixed(2)}`)].join("\n");
  const fk = focus.trim().toLowerCase();
  const inEl = (s: string) => fk && s.toLowerCase().includes(fk);

  return (
    <div className="space-y-6">
      <Panel
        title="Your content"
        actions={
          <Segmented
            label="Input"
            value={mode}
            onChange={(v) => {
              setMode(v);
              setError("");
            }}
            options={[
              { value: "text", label: "Paste text" },
              { value: "url", label: "Check a URL" },
            ]}
          />
        }
      >
        {mode === "url" ? (
          <form onSubmit={fetchPage} className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="kd-url" className="sr-only">
              Page URL
            </label>
            <TextInput id="kd-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.example.com/blog/post" inputMode="url" required className="flex-1" />
            <SmallButton type="submit" variant="primary" disabled={loading || !url.trim()}>
              {loading ? "Fetching…" : "Analyse page"}
            </SmallButton>
          </form>
        ) : null}
        {error && (
          <p role="alert" className="mt-3 text-sm text-ember-soft">
            {error}
          </p>
        )}
        {(mode === "text" || text) && (
          <div className={mode === "url" ? "mt-5" : ""}>
            <Field label={mode === "url" ? "Text found on the page (you can edit it)" : "Text to analyse"}>
              {(id) => <TextArea id={id} rows={mode === "url" ? 6 : 10} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your article, page copy or product description here." />}
            </Field>
            <div className="mt-3 flex flex-wrap gap-2">
              {!text && mode === "text" && <SmallButton onClick={() => setText(SAMPLE)}>Try a sample</SmallButton>}
              {text && (
                <SmallButton
                  onClick={() => {
                    setText("");
                    setPage(null);
                  }}
                >
                  Clear
                </SmallButton>
              )}
            </div>
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Words" value={res.total.toLocaleString()} />
        <Stat label="Unique words" value={res.unique.toLocaleString()} />
        <Stat label="Sentences" value={sentences.toLocaleString()} />
        <Stat label="Characters" value={text.length.toLocaleString()} />
        <Stat label="Reading time" value={`${Math.max(res.total ? 1 : 0, Math.round(res.total / 230))} min`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel
          title="Keyword density"
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <Segmented
                label="Phrase length"
                value={n}
                onChange={setN}
                options={[
                  { value: "1", label: "1 word" },
                  { value: "2", label: "2 words" },
                  { value: "3", label: "3 words" },
                ]}
              />
              <CopyButton text={res.rows.length ? csv : ""} label="Copy CSV" onCopied={() => logAction(TOOL, "copy-csv", logSummary, logData)} />
            </div>
          }
        >
          <div className="mb-4">
            <Toggle checked={skipStop} onChange={setSkipStop} label="Ignore common words" hint="Hides words like “the”, “and”, “for” so the real topics stand out." />
          </div>
          {res.rows.length === 0 ? (
            <p className="t-body py-10 text-center text-sm">{text ? "Not enough repeated words or phrases yet." : "Results appear here as soon as there's some text."}</p>
          ) : (
            <div className="max-h-[32rem] overflow-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Most frequent {n}-word phrases</caption>
                <thead className="sticky top-0 bg-ink-2 text-left">
                  <tr className="border-b border-line">
                    <th scope="col" className="t-label py-2 pr-3 !text-[0.62rem] font-normal">
                      #
                    </th>
                    <th scope="col" className="t-label py-2 pr-3 !text-[0.62rem] font-normal">
                      Keyword
                    </th>
                    <th scope="col" className="t-label py-2 pr-3 text-right !text-[0.62rem] font-normal">
                      Count
                    </th>
                    <th scope="col" className="t-label py-2 text-right !text-[0.62rem] font-normal">
                      Density
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {res.rows.map((r, i) => {
                    const high = n === "1" && r.density > 3 && res.total > 150;
                    return (
                      <tr key={r.phrase} className="border-b border-line/60">
                        <td className="t-mono py-2 pr-3 text-xs text-mute">{i + 1}</td>
                        <td className="py-2 pr-3">
                          <button type="button" onClick={() => setFocus(r.phrase)} className="text-left text-bone hover:text-ember" title="Check as focus keyword">
                            {r.phrase}
                          </button>
                          <div className="mt-1 h-1 rounded-full bg-line">
                            <div className={`h-full rounded-full ${high ? "bg-ember" : "bg-bone/40"}`} style={{ width: `${(r.count / max) * 100}%` }} />
                          </div>
                        </td>
                        <td className="t-mono py-2 pr-3 text-right text-bone">{r.count}</td>
                        <td className={`t-mono py-2 text-right ${high ? "text-ember" : "text-bone-dim"}`}>{r.density.toFixed(2)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Focus keyword">
            <Field label="Keyword or phrase" hint="Or click any keyword in the table.">
              {(id) => <TextInput id={id} value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. local seo" />}
            </Field>
            {focus.trim() && (
              <div className="mt-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="Times used" value={focusCount} />
                  <Stat label="Density" value={`${focusDensity.toFixed(2)}%`} tone={focusCount === 0 ? "bad" : focusDensity > 3 ? "warn" : "good"} />
                </div>
                <p className="text-sm text-bone-dim">
                  {focusCount === 0
                    ? "This phrase doesn't appear in the text yet."
                    : focusDensity > 3
                      ? "That's a lot of repetition. Use synonyms and related terms so it reads naturally."
                      : focusDensity < 0.3 && res.total > 300
                        ? "Used only lightly. Make sure the topic is clear from the headings and first paragraph."
                        : "Healthy usage. Focus on covering the topic well rather than hitting a number."}
                </p>
              </div>
            )}
          </Panel>

          {page && (
            <Panel title="Page elements">
              <dl className="space-y-4 text-sm">
                {[
                  { k: "Title", v: page.title },
                  { k: "Meta description", v: page.metaDescription },
                  { k: page.h1.length > 1 ? `H1 (${page.h1.length} found)` : "H1", v: page.h1.join(" · ") },
                ].map((x) => (
                  <div key={x.k}>
                    <dt className="t-label flex items-center gap-2 !text-[0.62rem]">
                      {x.k}
                      {fk && <span className={inEl(x.v) ? "text-[#7fd6a4]" : "text-ember"}>{inEl(x.v) ? "✓ keyword" : "✗ no keyword"}</span>}
                    </dt>
                    <dd className="mt-1 break-words text-bone">{x.v || <span className="text-ember">Missing</span>}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
