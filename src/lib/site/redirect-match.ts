/**
 * Redirect matching, shared by the request proxy and the dashboard (validation and the tester).
 * Sources are site paths. A trailing "/*" matches a whole folder, and a "*" in the destination
 * is replaced with the matched remainder: /old-blog/* → /blog/* sends /old-blog/a to /blog/a.
 */
export type RedirectRule = { id: number; source: string; destination: string; status: number };

export const REDIRECT_STATUSES = [301, 302, 307, 308] as const;
/** Paths that must never be redirected (the dashboard, APIs, framework files). */
export const PROTECTED = /^\/(admin|api|_next)(\/|$)/i;

export const normalisePath = (p: string) => {
  let s = (p || "").trim();
  try {
    if (/^https?:\/\//i.test(s)) s = new URL(s).pathname;
  } catch {
    /* keep as typed */
  }
  s = s.split("#")[0].split("?")[0];
  if (!s.startsWith("/")) s = `/${s}`;
  s = s.replace(/\/{2,}/g, "/");
  if (s.length > 1 && s.endsWith("/") && !s.endsWith("/*/")) s = s.slice(0, -1);
  return s;
};

export function matchRedirect(path: string, rules: RedirectRule[]): { rule: RedirectRule; location: string } | null {
  const p = normalisePath(path).toLowerCase();
  const exact = rules.find((r) => !r.source.endsWith("/*") && r.source.toLowerCase() === p);
  if (exact) return { rule: exact, location: exact.destination.replace("*", "") };
  const wild = rules
    .filter((r) => r.source.endsWith("/*"))
    .sort((a, b) => b.source.length - a.source.length)
    .find((r) => {
      const base = r.source.slice(0, -2).toLowerCase();
      return p === base || p.startsWith(`${base}/`);
    });
  if (!wild) return null;
  const rest = p.slice(wild.source.length - 2).replace(/^\//, "");
  return { rule: wild, location: wild.destination.includes("*") ? wild.destination.replace("*", rest) : wild.destination };
}

/** Validates a redirect before saving. Returns an error message, or null when it's fine. */
export function validateRedirect(source: string, destination: string, siteHost: string, others: RedirectRule[]): string | null {
  if (!source || source === "/") return "The source can't be the homepage.";
  if (PROTECTED.test(source)) return "Admin, API and /_next paths can't be redirected.";
  if (source.includes("*") && !source.endsWith("/*")) return "Use * only at the end of a source, like /old-folder/*.";
  if (!destination) return "Enter where the page should redirect to.";
  if (!destination.startsWith("/") && !/^https:\/\//i.test(destination)) return "The destination must be a path like /new-page or a full https:// URL.";
  let destPath = destination;
  try {
    const u = new URL(destination, `https://${siteHost}`);
    if (u.hostname.replace(/^www\./, "") !== siteHost.replace(/^www\./, "")) return null; // external: fine
    destPath = u.pathname;
  } catch {
    return "That destination isn't a valid URL.";
  }
  const dest = normalisePath(destPath).toLowerCase();
  if (dest === source.toLowerCase()) return "A page can't redirect to itself.";
  // Follow the chain to catch loops (A → B → A) and long chains.
  let hop = dest;
  for (let i = 0; i < 10; i++) {
    const next = matchRedirect(hop, [...others, { id: -1, source, destination, status: 301 }]);
    if (!next) return null;
    const loc = next.location;
    if (/^https?:\/\//i.test(loc) && !loc.includes(siteHost)) return null;
    hop = normalisePath(loc).toLowerCase();
    if (hop === source.toLowerCase() || hop === dest) return "This would create a redirect loop.";
  }
  return "This creates a long redirect chain. Point it at the final page instead.";
}
