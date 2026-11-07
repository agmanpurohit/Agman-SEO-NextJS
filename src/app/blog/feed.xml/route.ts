import { listLivePosts } from "@/lib/blog/db";
import { site } from "@/content/site";

export const revalidate = 3600;

const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

/** RSS 2.0 feed of live, indexable posts. */
export async function GET() {
  const posts = (await listLivePosts().catch(() => [])).filter((p) => !p.noindex).slice(0, 50);
  const items = posts
    .map((p) => {
      const url = `${site.url}/blog/${p.slug}`;
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(p.publishedAt!).toUTCString()}</pubDate>
      ${p.category ? `<category>${esc(p.category)}</category>` : ""}
      <description>${esc(p.excerpt)}</description>
    </item>`;
    })
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(site.name)} Blog</title>
    <link>${site.url}/blog</link>
    <description>Practical SEO articles from real client work.</description>
    <language>en</language>
    <atom:link href="${site.url}/blog/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=3600" } });
}
