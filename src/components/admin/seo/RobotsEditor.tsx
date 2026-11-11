"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import robotsParser from "robots-parser";
import { checkRobots } from "@/lib/site/robots-text";

const input = "w-full rounded border border-line-2 bg-ink-2 px-3 py-2.5 text-sm text-bone outline-none focus:border-bone";
const AGENTS = ["Googlebot", "Bingbot", "*", "GPTBot", "OAI-SearchBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "CCBot"];
const TRAINING = ["GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended", "CCBot", "meta-externalagent", "Bytespider"];

export function RobotsEditor({ initial, defaultText, siteUrl, isCustom }: { initial: string; defaultText: string; siteUrl: string; isCustom: boolean }) {
  const router = useRouter();
  const [text, setText] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [testPath, setTestPath] = useState("/india/seo-specialist");
  const [agent, setAgent] = useState("Googlebot");
  const issues = useMemo(() => checkRobots(text, siteUrl), [text, siteUrl]);
  const dirty = text !== saved;

  const test = useMemo(() => {
    try {
      const r = robotsParser(`${siteUrl}/robots.txt`, text);
      const url = `${siteUrl}${testPath.startsWith("/") ? testPath : `/${testPath}`}`;
      return r.isAllowed(url, agent) !== false;
    } catch {
      return null;
    }
  }, [text, testPath, agent, siteUrl]);

  async function save(confirm = false) {
    setBusy(true);
    setNotice(null);
    const res = await fetch("/api/admin/seo/robots", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, confirm }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.status === 409 && data.needsConfirm) {
      const list = (data.issues as { text: string }[]).map((i) => `• ${i.text}`).join("\n");
      if (window.confirm(`This robots.txt has serious problems:\n\n${list}\n\nSave it anyway?`)) return save(true);
      return;
    }
    if (!res.ok) return setNotice({ ok: false, text: data.error ?? "Couldn't save." });
    setSaved(text);
    setNotice({ ok: true, text: "Saved. robots.txt is live now." });
    router.refresh();
  }

  async function reset() {
    if (!window.confirm("Go back to the built-in robots.txt? Your custom rules will be removed.")) return;
    setBusy(true);
    const res = await fetch("/api/admin/seo/robots", { method: "DELETE" });
    setBusy(false);
    if (!res.ok) return setNotice({ ok: false, text: "Couldn't reset." });
    setText(defaultText);
    setSaved(defaultText);
    setNotice({ ok: true, text: "Back to the built-in robots.txt." });
    router.refresh();
  }

  const addTrainingBlock = () => {
    const missing = TRAINING.filter((b) => !new RegExp(`^\\s*user-agent:\\s*${b}\\s*$`, "im").test(text));
    if (!missing.length) return;
    const block = `\n# Block AI training crawlers (AI search tools can still read and cite the site)\n${missing.map((b) => `User-agent: ${b}`).join("\n")}\nDisallow: /\n`;
    const idx = text.search(/^\s*sitemap\s*:/im);
    setText(idx >= 0 ? text.slice(0, idx).replace(/\n*$/, "\n") + block + "\n" + text.slice(idx) : text.replace(/\n*$/, "\n") + block);
  };

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-bone-dim">
            {isCustom ? "Custom robots.txt" : "Built-in robots.txt"} ·{" "}
            <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="link-u text-bone">
              view live ↗
            </a>
            {dirty && <span className="ml-2 text-[#f0b64a]">Unsaved changes</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={addTrainingBlock} className="btn btn-ghost !h-10 !px-4 text-xs">
              Block AI training bots
            </button>
            <button type="button" onClick={reset} disabled={busy || !isCustom} className="btn btn-ghost !h-10 !px-4 disabled:opacity-40">
              Reset to built-in
            </button>
            <button type="button" onClick={() => save()} disabled={busy || !dirty} className="btn btn-primary !h-10 !px-5 disabled:opacity-50">
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
        {notice && (
          <p role="status" className={`mb-3 text-sm ${notice.ok ? "text-[#4fd18b]" : "text-ember-soft"}`}>
            {notice.text}
          </p>
        )}
        <textarea
          aria-label="robots.txt"
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          data-lenis-prevent
          className="t-mono min-h-[420px] w-full resize-y rounded border border-line-2 bg-ink p-4 text-[0.85rem] leading-6 text-bone outline-none focus:border-bone"
        />
      </div>

      <aside className="space-y-6">
        <div className="border border-line p-4">
          <p className="t-label mb-3">Checks</p>
          {issues.length === 0 ? (
            <p className="text-sm text-[#4fd18b]">✓ No problems found.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {issues.map((i) => (
                <li key={i.text} className={i.level === "error" ? "text-ember-soft" : "text-[#f0b64a]"}>
                  {i.level === "error" ? "✕" : "!"} {i.text}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-3 border border-line p-4">
          <p className="t-label">Test a URL</p>
          <input className={input} value={testPath} onChange={(e) => setTestPath(e.target.value)} aria-label="Path to test" placeholder="/blog/my-post" />
          <select className={input} value={agent} onChange={(e) => setAgent(e.target.value)} aria-label="Crawler">
            {AGENTS.map((a) => (
              <option key={a} value={a}>
                {a === "*" ? "Any crawler (*)" : a}
              </option>
            ))}
          </select>
          {test !== null && (
            <p className={`text-sm font-medium ${test ? "text-[#4fd18b]" : "text-ember-soft"}`}>
              {test ? "✓ Allowed" : "✕ Blocked"} for {agent === "*" ? "any crawler" : agent}
            </p>
          )}
          <p className="text-xs text-mute">Tests the text in the editor, including unsaved changes.</p>
        </div>
        <p className="text-xs leading-relaxed text-mute">
          robots.txt controls crawling, not indexing. To keep a page out of Google, set it to noindex in Pages instead of blocking it here.
        </p>
      </aside>
    </div>
  );
}
