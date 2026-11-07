import { pageMeta } from "@/lib/seo";
import { ToolShell, type ToolCopy } from "@/components/tools/ToolShell";
import { SerpPreviewTool } from "@/components/tools/SerpPreviewTool";
import { toolBySlug } from "@/content/tools";

const tool = toolBySlug("serp-snippet-preview");
const DESCRIPTION = "See how your title and meta description look in Google on desktop and mobile. Pixel-accurate truncation, keyword bolding and length checks.";

export const metadata = pageMeta({ title: "SERP Snippet Preview Tool: Google Preview", description: DESCRIPTION, path: tool.href, socialTitle: "Preview your Google search snippet" });

const copy: ToolCopy = {
  slug: "serp-snippet-preview",
  h1: "SERP Snippet Preview",
  lead: "Type a title, description and URL and see the result the way Google lays it out, on desktop and mobile. The tool measures text in pixels, the way Google decides where to cut it off.",
  description: DESCRIPTION,
  features: ["Desktop and mobile previews", "Pixel-width measurement", "Keyword bolding", "Breadcrumb-style URL display", "Optional date", "Title and description checks"],
  steps: [
    { t: "Enter your snippet", d: "Add the title, meta description and URL of the page. If you're writing a new page, draft them right here." },
    { t: "Switch devices", d: "Toggle between desktop and mobile. Mobile titles get less room, so check that the important words still show." },
    { t: "Fix and copy", d: "Follow the checks until everything is green, then paste the title and description into your CMS or SEO plugin." },
  ],
  about: {
    heading: "Your snippet is the advert you didn't pay for.",
    body: (
      <>
        <p>
          Ranking only gets you seen. The snippet decides whether anyone clicks. A title that's cut off mid-word, or a description that trails off before the useful part, quietly costs you visitors
          every day, even when you're on page one.
        </p>
        <p>
          Google doesn't truncate by character count. It measures how wide the text is when rendered, which is why a title full of wide letters like W and M gets cut sooner than one with narrow
          letters. This preview measures in pixels, using the same font Google uses, so what you see here is close to what searchers will see. Words matching the search are shown in bold, which is
          another reason to use the words your customers actually type.
        </p>
        <p>
          Keep in mind that Google can rewrite titles and descriptions when it thinks something else on the page matches the search better. The best protection is a snippet that's accurate, specific and
          clearly about the page. To generate the full set of tags around it, use the <a href="/free-seo-tools/meta-tag-generator">meta tag generator</a>.
        </p>
      </>
    ),
  },
  faq: [
    { q: "How many pixels does Google show for a title?", a: "On desktop, Google shows roughly 600 pixels of a title before cutting it off, usually 50 to 60 characters. Mobile titles can wrap onto two lines, but the visible width is smaller per line, so shorter is safer." },
    { q: "How long should a meta description be in pixels?", a: "Around 920 pixels on desktop, which is about two lines or 150 to 160 characters. On mobile Google shows roughly 680 pixels. Put the key message in the first 120 characters so it survives on every device." },
    { q: "Why does Google show a different title from mine?", a: "Google rewrites titles when they're too long, stuffed with keywords, the same across many pages, or don't match the page content. Write a unique, descriptive title that matches your H1 and the main topic of the page." },
    { q: "Why are some words bold in the preview?", a: "Google highlights words in the description that match the search query. Bold words draw the eye, so a description that naturally includes the phrases people search for tends to stand out more." },
    { q: "Is this exactly what Google will show?", a: "It's a close approximation. Google regularly tests layout changes and may add extras such as review stars, sitelinks, images or dates. The preview reliably shows how your text will be truncated." },
  ],
};

export default function Page() {
  return (
    <ToolShell copy={copy}>
      <SerpPreviewTool />
    </ToolShell>
  );
}
