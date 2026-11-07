import { pageMeta } from "@/lib/seo";
import { ToolShell, type ToolCopy } from "@/components/tools/ToolShell";
import { KeywordDensityTool } from "@/components/tools/KeywordDensityTool";
import { toolBySlug } from "@/content/tools";

const tool = toolBySlug("keyword-density-checker");
const DESCRIPTION = "Paste text or enter a URL to see how often each word and phrase appears. Spot keyword stuffing, check your focus keyword and export the results.";

export const metadata = pageMeta({ title: "Keyword Density Checker: Free Online Tool", description: DESCRIPTION, path: tool.href, socialTitle: "Free keyword density checker" });

const copy: ToolCopy = {
  slug: "keyword-density-checker",
  h1: "Keyword Density Checker",
  lead: "Find out which words and phrases your page really repeats. Paste your copy or check a live URL, then see counts, density and whether your focus keyword shows up where it should.",
  description: DESCRIPTION,
  features: ["Paste text or fetch a live URL", "One, two and three-word phrases", "Stop-word filter", "Focus keyword density", "Title, meta description and H1 check", "CSV export"],
  steps: [
    { t: "Add your content", d: "Paste a draft, or switch to “Check a URL” and enter any public page. We pull the main text and skip menus, headers and footers." },
    { t: "Read the table", d: "Switch between single words and two or three-word phrases. The bars show which terms dominate, and anything unusually high turns orange." },
    { t: "Check your keyword", d: "Type your target phrase, or click a row, to see how often it's used and whether it's in the title, meta description and H1." },
  ],
  about: {
    heading: "Density is a sanity check, not a target.",
    body: (
      <>
        <p>
          There's no magic percentage that makes a page rank. Google stopped rewarding repetition years ago, and pages that force the same phrase into every sentence read badly and can be treated as
          keyword stuffing. What a density check is good for is spotting <strong>imbalance</strong>: a service page where your main term barely appears, or a blog post where one phrase crowds out
          everything else.
        </p>
        <p>
          The phrase view is the most useful part. Two and three-word phrases show the topics a page actually covers, which is closer to how search engines and AI answer engines understand content.
          If the phrases at the top don't match what you want to rank for, the page probably needs rewriting, not more keywords.
        </p>
        <p>
          Density here is the share of all words on the page taken up by a word or phrase. As a rough guide, most well-written pages keep their main keyword somewhere between 0.5% and 2.5%. Go above 3%
          and it usually starts to sound forced. For a full picture of a page, including headings, links and technical issues, run the <a href="/seo-audit">free website SEO audit</a>.
        </p>
      </>
    ),
  },
  faq: [
    { q: "What is a good keyword density for SEO?", a: "There isn't an official number. Most natural, well-written pages land between about 0.5% and 2.5% for their main keyword. Rather than aiming for a figure, make sure the keyword appears in the title, the H1, the first paragraph and a subheading, then write naturally and use related terms." },
    { q: "How is keyword density calculated?", a: "Density is the number of times a word or phrase appears, multiplied by the number of words in it, divided by the total word count, times 100. So a two-word phrase used 10 times in a 1,000-word article has a density of 2%." },
    { q: "Can keyword density hurt my rankings?", a: "Very high density can. If a phrase is repeated so often that the text reads unnaturally, Google may see it as keyword stuffing, which goes against its spam policies. Low density rarely hurts on its own, but it can mean the page doesn't make its topic clear." },
    { q: "Why does the URL check show different text from my page?", a: "We read the HTML your server sends, and remove navigation, headers, footers, forms and scripts so only the main content is counted. Content that only appears after JavaScript runs won't be included. You can edit the extracted text before analysing it." },
    { q: "Do you store the text I paste?", a: "Yes. The analysis runs in your browser, but what you enter (or the URL you check) is saved with your IP address and approximate location, so I can see how the tools are used and stop abuse. It is never shared or sold, and it is deleted automatically after 12 months. Email me if you want it removed sooner." },
  ],
};

export default function Page() {
  return (
    <ToolShell copy={copy}>
      <KeywordDensityTool />
    </ToolShell>
  );
}
