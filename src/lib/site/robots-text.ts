/**
 * robots.txt helpers shared by the public route and the dashboard editor (no server-only code).
 */
export const ROBOTS_MAX = 20_000;

/** The site's standard robots.txt: crawl everything except the API, and point to the sitemap. */
export const defaultRobots = (siteUrl: string) =>
  [
    "# Admin and audit-result pages use a noindex tag instead of Disallow, so crawlers can see it.",
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "",
    `Sitemap: ${siteUrl}/sitemap.xml`,
    "",
  ].join("\n");

export type RobotsIssue = { level: "error" | "warn"; text: string };

const DIRECTIVE = /^(user-agent|allow|disallow|sitemap|crawl-delay|host|clean-param)\s*:/i;

/** Checks a robots.txt for mistakes that hurt SEO. */
export function checkRobots(text: string, siteUrl: string): RobotsIssue[] {
  const out: RobotsIssue[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.replace(/#.*/, "").trim());
  if (text.length > ROBOTS_MAX) out.push({ level: "error", text: `Too long: keep robots.txt under ${ROBOTS_MAX.toLocaleString()} characters.` });

  let group: string[] = [];
  let sawRuleSinceAgent = true;
  const blockedAllFor: string[] = [];
  lines.forEach((l, i) => {
    if (!l) return;
    if (!DIRECTIVE.test(l)) out.push({ level: "warn", text: `Line ${i + 1} isn't a recognised rule: “${l.slice(0, 60)}”.` });
    const [k, ...rest] = l.split(":");
    const key = k.trim().toLowerCase();
    const val = rest.join(":").trim();
    if (key === "user-agent") {
      if (sawRuleSinceAgent) group = [];
      group.push(val.toLowerCase());
      sawRuleSinceAgent = false;
    } else if (key === "allow" || key === "disallow") {
      sawRuleSinceAgent = true;
      if (val && !val.startsWith("/") && !val.startsWith("*")) out.push({ level: "warn", text: `Line ${i + 1}: paths should start with “/”.` });
      if (key === "disallow" && val === "/") blockedAllFor.push(...group);
      if (key === "disallow" && /\.(css|js)\b|\/_next\b/i.test(val)) out.push({ level: "warn", text: `Line ${i + 1} blocks CSS, JavaScript or /_next. Google needs these to render your pages.` });
      if (key === "disallow" && /^\/(india|blog|work|free-seo-tools|seo-audit|experience|contact)(\/|$)/.test(val)) out.push({ level: "warn", text: `Line ${i + 1} blocks a section with pages you want ranked (${val}).` });
    } else if (key === "sitemap") {
      if (!/^https?:\/\//.test(val)) out.push({ level: "error", text: `Line ${i + 1}: the Sitemap line needs a full URL.` });
    } else if (key === "crawl-delay") {
      sawRuleSinceAgent = true;
    }
  });
  if (blockedAllFor.includes("*")) out.unshift({ level: "error", text: "“User-agent: *” with “Disallow: /” blocks every search engine from the whole site." });
  if (blockedAllFor.includes("googlebot")) out.unshift({ level: "error", text: "Googlebot is blocked from the whole site." });
  if (!/^\s*sitemap\s*:/im.test(text)) out.push({ level: "warn", text: `No Sitemap line. Add “Sitemap: ${siteUrl}/sitemap.xml”.` });
  if (!/^\s*user-agent\s*:/im.test(text)) out.push({ level: "warn", text: "No User-agent line: crawlers will ignore the rules." });
  return out;
}
