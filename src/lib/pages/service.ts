import "server-only";
import { cleanHtml } from "@/lib/blog/markdown";
import { revalidateSite } from "@/lib/blog/service";
import { listRedirects, saveRedirect, deleteRedirect } from "@/lib/site/db";
import { savePage, pageSlugTaken, deletePage, getPage } from "./db";
import { pagePath, type BuilderPage, type PageInput } from "./types";

export class PageConflictError extends Error {}
const AUTO_NOTE = "Page builder: URL changed";

/**
 * Save a page: rich HTML is cleaned, a changed URL of a live page gets a 301 from the old
 * address, and the whole site is refreshed so menus, sitemap and the page itself update.
 */
export async function persistPage(input: PageInput, id?: number): Promise<BuilderPage> {
  if (await pageSlugTaken(input.slug, id)) throw new PageConflictError("Another page already uses this URL.");
  const path = pagePath(input.slug);
  const redirects = await listRedirects().catch(() => []);
  const blocking = redirects.find((r) => r.source.toLowerCase() === path);
  if (blocking) {
    // A redirect made automatically when this URL was renamed away can be cleared; a hand-made one can't.
    if (blocking.note.startsWith(AUTO_NOTE)) await deleteRedirect(blocking.id);
    else throw new PageConflictError(`A redirect in SEO → Redirects already sends ${path} elsewhere. Remove it first or pick another URL.`);
  }

  const clean: PageInput = { ...input, sections: input.sections.map((s) => ("html" in s ? { ...s, html: cleanHtml(s.html) } : s)) };
  const before = id ? await getPage(id) : null;
  const page = await savePage(clean, id);

  if (before && before.slug !== page.slug && before.publishedAt) {
    const from = pagePath(before.slug);
    if (!redirects.some((r) => r.source.toLowerCase() === from)) {
      await saveRedirect({ source: from, destination: path, status: 301, enabled: true, note: `${AUTO_NOTE} (${page.title})` });
    }
    // Older automatic redirects that pointed at the previous URL now go straight to the new one (no chains).
    for (const r of redirects.filter((x) => x.destination === from && x.note.startsWith(AUTO_NOTE))) {
      await saveRedirect({ id: r.id, source: r.source, destination: path, status: r.status, enabled: r.enabled, note: r.note });
    }
  }
  revalidateSite();
  return page;
}

export async function removePage(id: number) {
  const page = await deletePage(id);
  if (page) revalidateSite();
  return page;
}
