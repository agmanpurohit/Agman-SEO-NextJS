"use client";

import { useMemo, useState } from "react";
import { CodeOutput, Field, Panel, Segmented, SmallButton, TextArea, TextInput, Toggle } from "./ui";

type Preset = { id: string; label: string; hint: string; disallow: string[]; allow?: string[] };
const PRESETS: Preset[] = [
  { id: "wp", label: "WordPress admin", hint: "Blocks /wp-admin/ but keeps admin-ajax.php reachable (themes need it).", disallow: ["/wp-admin/"], allow: ["/wp-admin/admin-ajax.php"] },
  { id: "search", label: "Internal search results", hint: "Endless, thin result pages that waste crawl budget.", disallow: ["/search", "/*?s=", "/*?q="] },
  { id: "cart", label: "Cart, checkout & account", hint: "Private, per-visitor pages with nothing to rank.", disallow: ["/cart", "/checkout", "/my-account", "/account"] },
  { id: "params", label: "Sort & filter parameters", hint: "Stops crawlers looping through every filter combination.", disallow: ["/*?sort=", "/*?filter=", "/*?orderby=", "/*&sort="] },
  { id: "admin", label: "Admin & login", hint: "Generic admin and login areas.", disallow: ["/admin", "/login"] },
  { id: "staging", label: "Test & staging folders", hint: "Folders like /staging/ or /test/ on the live domain.", disallow: ["/staging/", "/test/", "/dev/"] },
];

type Bot = { ua: string; who: string; purpose: "training" | "search" };
const AI_BOTS: Bot[] = [
  { ua: "GPTBot", who: "OpenAI", purpose: "training" },
  { ua: "ClaudeBot", who: "Anthropic", purpose: "training" },
  { ua: "Google-Extended", who: "Google (Gemini training)", purpose: "training" },
  { ua: "Applebot-Extended", who: "Apple Intelligence", purpose: "training" },
  { ua: "CCBot", who: "Common Crawl", purpose: "training" },
  { ua: "meta-externalagent", who: "Meta AI", purpose: "training" },
  { ua: "Bytespider", who: "ByteDance", purpose: "training" },
  { ua: "Amazonbot", who: "Amazon", purpose: "training" },
  { ua: "OAI-SearchBot", who: "ChatGPT search", purpose: "search" },
  { ua: "ChatGPT-User", who: "ChatGPT browsing for a user", purpose: "search" },
  { ua: "Claude-SearchBot", who: "Claude search", purpose: "search" },
  { ua: "Claude-User", who: "Claude browsing for a user", purpose: "search" },
  { ua: "PerplexityBot", who: "Perplexity", purpose: "search" },
];

const lines = (s: string) =>
  s
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
const asPath = (p: string) => (p === "*" || p.startsWith("/") ? p : `/${p}`);

export function RobotsTool() {
  const [policy, setPolicy] = useState<"allow" | "block">("allow");
  const [presets, setPresets] = useState<string[]>(["search"]);
  const [disallow, setDisallow] = useState("");
  const [allow, setAllow] = useState("");
  const [sitemaps, setSitemaps] = useState("");
  const [delay, setDelay] = useState("");
  const [blocked, setBlocked] = useState<string[]>([]);
  const [comment, setComment] = useState(true);

  const issues = useMemo(() => {
    const out: string[] = [];
    if (policy === "block") out.push("Every crawler is blocked from the whole site. Only use this on staging sites, never on a live site you want in Google.");
    const custom = [...lines(disallow), ...lines(allow)];
    if (custom.some((p) => /\.(css|js)(\$|$)|\/(wp-includes|assets|static|_next)\b/i.test(p))) out.push("You're blocking CSS, JavaScript or asset folders. Google needs these to render your pages properly.");
    if (lines(disallow).includes("/")) out.push("“Disallow: /” in your custom rules blocks the entire site.");
    if (sitemaps && lines(sitemaps).some((s) => !/^https?:\/\//.test(s))) out.push("Sitemap lines must be full URLs, like https://www.example.com/sitemap.xml.");
    if (delay && Number(delay) > 10) out.push("A crawl delay above 10 seconds can stop Bing and others from crawling your site fully. Google ignores this rule.");
    if (blocked.some((b) => AI_BOTS.find((x) => x.ua === b)?.purpose === "search")) out.push("You're blocking AI search crawlers. Your pages won't be shown or cited in those AI answers.");
    return out;
  }, [policy, disallow, allow, sitemaps, delay, blocked]);

  const code = useMemo(() => {
    const out: string[] = [];
    if (comment) out.push(`# robots.txt generated with agmanrajpurohit.com/free-seo-tools/robots-txt-generator`, "");
    out.push("User-agent: *");
    if (policy === "block") out.push("Disallow: /");
    else {
      const chosen = PRESETS.filter((p) => presets.includes(p.id));
      const al = [...new Set([...chosen.flatMap((p) => p.allow ?? []), ...lines(allow).map(asPath)])];
      const dis = [...new Set([...chosen.flatMap((p) => p.disallow), ...lines(disallow).map(asPath)])];
      al.forEach((p) => out.push(`Allow: ${p}`));
      dis.forEach((p) => out.push(`Disallow: ${p}`));
      if (!al.length && !dis.length) out.push("Disallow:");
    }
    if (delay && Number(delay) > 0) out.push(`Crawl-delay: ${Number(delay)}`);
    if (blocked.length) {
      out.push("");
      if (comment) out.push("# AI crawlers");
      blocked.forEach((ua) => out.push(`User-agent: ${ua}`));
      out.push("Disallow: /");
    }
    const sm = lines(sitemaps);
    if (sm.length) {
      out.push("");
      sm.forEach((s) => out.push(`Sitemap: ${s}`));
    }
    return out.join("\n") + "\n";
  }, [policy, presets, disallow, allow, delay, blocked, sitemaps, comment]);

  const toggleIn = (list: string[], v: string, on: boolean) => (on ? [...new Set([...list, v])] : list.filter((x) => x !== v));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <Panel title="1 · Default rule for all crawlers">
          <Segmented
            label="Default rule"
            value={policy}
            onChange={setPolicy}
            options={[
              { value: "allow", label: "Allow crawling" },
              { value: "block", label: "Block everything" },
            ]}
          />
          <p className="mt-3 text-sm text-mute">{policy === "allow" ? "Recommended for live sites. Then block only the areas below." : "Blocks all crawlers from the whole site. Good for staging sites only."}</p>
        </Panel>

        {policy === "allow" && (
          <Panel title="2 · Areas to keep crawlers out of">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {PRESETS.map((p) => (
                <Toggle key={p.id} checked={presets.includes(p.id)} onChange={(on) => setPresets((l) => toggleIn(l, p.id, on))} label={p.label} hint={p.hint} />
              ))}
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field label="Extra paths to block" hint="One per line, e.g. /private/ or /*.pdf$">
                {(id) => <TextArea id={id} rows={4} value={disallow} onChange={(e) => setDisallow(e.target.value)} placeholder={"/private/\n/thank-you"} className="t-mono text-sm" />}
              </Field>
              <Field label="Paths to allow (exceptions)" hint="Re-opens something inside a blocked folder.">
                {(id) => <TextArea id={id} rows={4} value={allow} onChange={(e) => setAllow(e.target.value)} placeholder="/private/press-kit/" className="t-mono text-sm" />}
              </Field>
            </div>
          </Panel>
        )}

        <Panel title="3 · AI crawlers">
          <p className="mb-5 text-sm text-bone-dim">
            <strong className="text-bone">Training bots</strong> collect content to train AI models. <strong className="text-bone">Search bots</strong> fetch pages to answer questions and cite sources, so blocking them
            removes you from those answers.
          </p>
          <div className="mb-4 flex flex-wrap gap-2">
            <SmallButton onClick={() => setBlocked(AI_BOTS.filter((b) => b.purpose === "training").map((b) => b.ua))}>Block training bots only</SmallButton>
            <SmallButton onClick={() => setBlocked(AI_BOTS.map((b) => b.ua))}>Block all AI bots</SmallButton>
            <SmallButton onClick={() => setBlocked([])}>Allow all</SmallButton>
          </div>
          {(["training", "search"] as const).map((group) => (
            <fieldset key={group} className="mt-5">
              <legend className="t-label mb-3 !text-[0.62rem]">{group === "training" ? "AI training" : "AI search & assistants"}</legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {AI_BOTS.filter((b) => b.purpose === group).map((b) => (
                  <Toggle key={b.ua} checked={blocked.includes(b.ua)} onChange={(on) => setBlocked((l) => toggleIn(l, b.ua, on))} label={`Block ${b.ua}`} hint={b.who} />
                ))}
              </div>
            </fieldset>
          ))}
        </Panel>

        <Panel title="4 · Sitemap & extras">
          <div className="space-y-5">
            <Field label="Sitemap URL(s)" hint="One per line. Helps every search engine find your pages.">
              {(id) => <TextArea id={id} rows={2} value={sitemaps} onChange={(e) => setSitemaps(e.target.value)} placeholder="https://www.example.com/sitemap.xml" className="t-mono text-sm" />}
            </Field>
            <div className="grid grid-cols-1 items-end gap-5 sm:grid-cols-2">
              <Field label="Crawl delay (seconds, optional)" hint="Bing and Yandex honour it. Google ignores it.">
                {(id) => <TextInput id={id} type="number" min={0} max={60} value={delay} onChange={(e) => setDelay(e.target.value)} placeholder="Leave empty" />}
              </Field>
              <Toggle checked={comment} onChange={setComment} label="Add comments" hint="Short notes explaining each section." />
            </div>
          </div>
        </Panel>
      </div>

      <div className="space-y-6 lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:self-start">
        <CodeOutput code={code} title="robots.txt" filename="robots.txt" minRows={12} />
        <Panel title={issues.length ? `Check before you upload (${issues.length})` : "Check before you upload"}>
          {issues.length ? (
            <ul className="space-y-2.5">
              {issues.map((i) => (
                <li key={i} className="flex gap-3 text-sm text-bone">
                  <span aria-hidden="true" className="text-ember">
                    !
                  </span>
                  {i}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-bone-dim">
              <span className="text-[#7fd6a4]">✓</span> No problems spotted. Upload the file to the root of your domain so it lives at <span className="t-mono text-bone">/robots.txt</span>.
            </p>
          )}
          <p className="mt-4 text-xs leading-relaxed text-mute">Robots.txt controls crawling, not indexing. To keep a page out of Google, let it be crawled and add a noindex tag instead.</p>
        </Panel>
      </div>
    </div>
  );
}
