import { pageMeta } from "@/lib/seo";
import { ToolShell, type ToolCopy } from "@/components/tools/ToolShell";
import { MetaTagTool } from "@/components/tools/MetaTagTool";
import { toolBySlug } from "@/content/tools";

const tool = toolBySlug("meta-tag-generator");
const DESCRIPTION = "Write your title tag, meta description, canonical, Open Graph and Twitter tags, preview them in Google, and copy clean HTML for your page's head.";

export const metadata = pageMeta({ title: "Free Meta Tag Generator for SEO & Social", description: DESCRIPTION, path: tool.href, socialTitle: "Meta tag generator with live Google preview" });

const copy: ToolCopy = {
  slug: "meta-tag-generator",
  h1: "Meta Tag Generator",
  lead: "Fill in one form and get every tag your page's head needs: title, description, robots, canonical, Open Graph and X cards. Watch the Google and social previews update as you type.",
  description: DESCRIPTION,
  features: ["Title and meta description with length checks", "Robots and canonical tags", "Open Graph tags", "X (Twitter) card tags", "Live Google and social previews", "Copy-ready HTML"],
  steps: [
    { t: "Write the basics", d: "Add a title and description for the page. The counters and Google preview tell you when something will get cut off." },
    { t: "Set up sharing", d: "Add a share image and, if you want, a different headline for social feeds. The preview shows roughly how LinkedIn, Facebook and WhatsApp will display it." },
    { t: "Copy into your page", d: "Copy the code and paste it inside the page's <head>. On WordPress, use the matching fields in Yoast, Rank Math or your theme instead." },
  ],
  about: {
    heading: "Two tags do most of the work.",
    body: (
      <>
        <p>
          Of everything in a page's head, the <strong>title tag</strong> matters most. It's a confirmed ranking signal, it's the blue link people click, and it's what browsers show on the tab. Keep it
          specific, put the main topic first and leave the brand to the end. Google cuts titles at around 600 pixels on desktop, which is usually 50 to 60 characters.
        </p>
        <p>
          The <strong>meta description</strong> doesn't affect rankings, but it affects clicks. Treat it like a short advert: what the page offers, who it's for, and a reason to choose it. Google
          rewrites descriptions that don't match the search, so write one that answers the most likely query directly.
        </p>
        <p>
          Open Graph and X tags decide how your link looks when someone shares it. Without them, platforms guess, and often pick the wrong image or a menu item as the description. A canonical tag tells
          Google which URL is the original when the same content is reachable at more than one address. To check how a finished snippet looks, try the{" "}
          <a href="/free-seo-tools/serp-snippet-preview">SERP snippet preview</a>.
        </p>
      </>
    ),
  },
  faq: [
    { q: "Which meta tags actually matter for SEO?", a: "The title tag and the robots tag directly affect how search engines handle a page, and the canonical tag helps avoid duplicate-content confusion. The meta description influences click-through rather than rankings. Meta keywords are ignored by Google and aren't worth adding." },
    { q: "How long should a title tag be?", a: "Aim for roughly 50 to 60 characters, or under about 600 pixels wide. Longer titles aren't penalised, but Google will cut them off with an ellipsis, so put the important words first." },
    { q: "How long should a meta description be?", a: "Around 120 to 160 characters fits comfortably on desktop. On mobile Google can show a little less, so make the first sentence count on its own." },
    { q: "What size should my Open Graph image be?", a: "1200 × 630 pixels works on Facebook, LinkedIn, X and WhatsApp. Use a JPG or PNG under 5 MB, and keep important text away from the edges, because some platforms crop the image." },
    { q: "Do I need both Open Graph and Twitter tags?", a: "Not entirely. X reads Open Graph tags for the title, description and image when its own tags are missing. You only need twitter:card to choose the layout, plus handles if you want them shown. This generator adds X-specific tags only when they differ." },
  ],
};

export default function Page() {
  return (
    <ToolShell copy={copy}>
      <MetaTagTool />
    </ToolShell>
  );
}
