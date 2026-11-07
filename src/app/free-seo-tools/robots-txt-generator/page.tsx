import { pageMeta } from "@/lib/seo";
import { ToolShell, type ToolCopy } from "@/components/tools/ToolShell";
import { RobotsTool } from "@/components/tools/RobotsTool";
import { toolBySlug } from "@/content/tools";

const tool = toolBySlug("robots-txt-generator");
const DESCRIPTION = "Create a robots.txt file in minutes. Block admin and search pages, choose which AI crawlers can read your site, add your sitemap and download.";

export const metadata = pageMeta({ title: "Robots.txt Generator with AI Bot Controls", description: DESCRIPTION, path: tool.href, socialTitle: "Robots.txt generator, including AI crawlers" });

const copy: ToolCopy = {
  slug: "robots-txt-generator",
  h1: "Robots.txt Generator",
  lead: "Build a robots.txt file that keeps crawlers out of the pages that waste their time, lets you decide which AI bots can read your content, and warns you before you block something important.",
  description: DESCRIPTION,
  features: ["Ready-made rules for WordPress, search, cart and filters", "Custom allow and disallow paths", "AI training and AI search bot controls", "Sitemap and crawl-delay lines", "Mistake warnings", "Download robots.txt"],
  steps: [
    { t: "Pick what to block", d: "Start from “allow crawling”, then switch on the areas that don't need to be crawled, like internal search results or the checkout." },
    { t: "Decide on AI bots", d: "Choose whether AI companies can use your content for training, and separately whether AI search tools can read and cite your pages." },
    { t: "Download and upload", d: "Download the file and upload it to the root of your domain, so it opens at yoursite.com/robots.txt. Then test it in Search Console." },
  ],
  about: {
    heading: "A small file that can switch off your whole site.",
    body: (
      <>
        <p>
          Robots.txt tells crawlers which parts of a site they may visit. Used well, it stops search engines wasting time on endless filter combinations, internal search pages and private areas, so they
          spend more of it on the pages you want ranked. Used badly, a single <strong>Disallow: /</strong> left over from a staging site can take an entire business out of Google.
        </p>
        <p>
          One thing robots.txt can't do is keep a page out of the index. If other sites link to a blocked URL, Google can still list it, just without a description. To remove a page from search results,
          let it be crawled and add a <strong>noindex</strong> tag instead. Also avoid blocking CSS and JavaScript files: Google needs them to see your pages the way visitors do.
        </p>
        <p>
          AI crawlers come in two kinds. <strong>Training bots</strong> such as GPTBot and Google-Extended collect text to train models. <strong>Search bots</strong> such as OAI-SearchBot and
          PerplexityBot fetch pages to answer questions and link to sources. Many businesses block the first group and allow the second, so they still show up in AI answers. If you also need a sitemap,
          the <a href="/free-seo-tools/sitemap-generator">XML sitemap generator</a> can build one.
        </p>
      </>
    ),
  },
  faq: [
    { q: "Where do I put my robots.txt file?", a: "In the root folder of your domain, so it's available at https://yourdomain.com/robots.txt. Each subdomain needs its own file. Search engines won't look for it anywhere else." },
    { q: "Does robots.txt stop a page from being indexed?", a: "No. It only controls crawling. A blocked page can still appear in Google if other pages link to it. Use a noindex meta tag or X-Robots-Tag header, and leave the page crawlable so Google can see that instruction." },
    { q: "Should I block AI crawlers like GPTBot?", a: "It depends on your goals. Blocking training bots stops your content being used to train future models but doesn't affect Google rankings. Blocking AI search bots such as OAI-SearchBot or PerplexityBot means those tools can't show or cite your pages, which can cost you visibility." },
    { q: "Does Google respect crawl-delay?", a: "No. Google ignores the Crawl-delay line and manages its crawl rate automatically. Bing and Yandex do respect it. Only add it if your server genuinely struggles with crawler traffic." },
    { q: "How do I test my robots.txt?", a: "After uploading it, open the robots.txt report in Google Search Console to check that Google fetched it without errors. You can also use the URL Inspection tool to confirm an important page isn't blocked." },
  ],
};

export default function Page() {
  return (
    <ToolShell copy={copy}>
      <RobotsTool />
    </ToolShell>
  );
}
