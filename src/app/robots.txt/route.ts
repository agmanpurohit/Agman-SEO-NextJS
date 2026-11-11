import { site } from "@/content/site";
import { getSetting } from "@/lib/site/db";
import { defaultRobots } from "@/lib/site/robots-text";

/**
 * robots.txt, editable in the dashboard (Admin → SEO → Robots.txt). Falls back to the standard
 * rules if nothing has been saved or the database is unreachable. Saving refreshes it at once.
 */
export const revalidate = 3600;

export async function GET() {
  const saved = await getSetting<{ text: string }>("robots");
  const text = saved?.text?.trim() ? saved.text : defaultRobots(site.url);
  return new Response(text.endsWith("\n") ? text : `${text}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=3600" },
  });
}
