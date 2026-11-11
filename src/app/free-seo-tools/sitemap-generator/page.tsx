import { pageMeta } from "@/lib/seo";
import { ToolShell, type ToolCopy } from "@/components/tools/ToolShell";
import { SitemapTool } from "@/components/tools/SitemapTool";
import { toolBySlug } from "@/content/tools";
import { withSeo } from "@/lib/site/seo";

const tool = toolBySlug("sitemap-generator");
const DESCRIPTION = "Crawl your website or paste a list of URLs to build a clean XML sitemap. Skips noindex, redirected and broken pages. Download sitemap.xml free.";

export const generateMetadata = () => withSeo(pageMeta({ title: "Free XML Sitemap Generator", description: DESCRIPTION, path: tool.href, socialTitle: "Free XML sitemap generator with site crawl" }));

const copy: ToolCopy = {
  slug: "sitemap-generator",
  h1: "XML Sitemap Generator",
  lead: "Crawl your site, or paste your URLs, and get a sitemap.xml with only the pages that belong in it. Redirects, broken links, noindex pages and duplicates are left out automatically.",
  description: DESCRIPTION,
  features: ["Crawls up to 250 pages", "Respects robots.txt", "Skips noindex, redirected, broken and canonicalised pages", "Paste-a-list mode", "Optional lastmod, changefreq and priority", "Download sitemap.xml"],
  steps: [
    { t: "Crawl or paste", d: "Enter your homepage and we follow internal links the way a search engine would. Or paste a list of URLs if you already have one." },
    { t: "Review the list", d: "Untick any page you don't want listed. The “left out” panel shows which pages were skipped and why, which often reveals problems worth fixing." },
    { t: "Download and submit", d: "Download sitemap.xml, upload it to your site's root, add it to robots.txt and submit it in Google Search Console." },
  ],
  about: {
    heading: "A sitemap is a list of pages you want found.",
    body: (
      <>
        <p>
          An XML sitemap gives search engines a direct list of the URLs on your site that you'd like indexed. It doesn't guarantee indexing, but it helps new pages get discovered faster and helps
          crawlers find pages that aren't well linked internally. Large sites, new sites and sites with deep page structures benefit most.
        </p>
        <p>
          The most common mistake is listing everything. A sitemap full of redirects, 404s, noindex pages and duplicate URLs sends mixed signals, and Search Console will flag it. This generator only
          keeps pages that return a 200 status, allow indexing and point their canonical tag at themselves, so the file reflects what you actually want in Google.
        </p>
        <p>
          Google ignores the <strong>priority</strong> and <strong>changefreq</strong> fields, so they're off by default. <strong>lastmod</strong> is used when it's accurate, so only set it to today if
          pages really changed today. Most content management systems can generate a sitemap automatically, and that's the better long-term option. Use this tool for static sites, custom builds, quick
          checks and audits. Then make sure your <a href="/free-seo-tools/robots-txt-generator">robots.txt</a> points to it.
        </p>
      </>
    ),
  },
  faq: [
    { q: "How many URLs can a sitemap contain?", a: "A single sitemap file can list up to 50,000 URLs and be up to 50 MB uncompressed. Bigger sites split their URLs across several sitemaps and list them in a sitemap index file. This tool crawls up to 250 pages at a time." },
    { q: "Why were some of my pages left out?", a: "Pages are skipped when they're blocked by robots.txt, redirect elsewhere, return an error, are marked noindex, or have a canonical tag pointing to a different URL. None of those belong in a sitemap. The “left out” list shows the reason for each one." },
    { q: "Does Google use priority and changefreq?", a: "No. Google has said it ignores both. It does use lastmod when the dates are consistently accurate. Bing may still read changefreq, which is why the option is there." },
    { q: "Where should I upload my sitemap?", a: "Usually at the root of your domain, such as https://yourdomain.com/sitemap.xml. Then add a Sitemap line to robots.txt and submit the URL in Google Search Console and Bing Webmaster Tools." },
    { q: "Does the crawler see pages built with JavaScript?", a: "It reads the HTML your server returns and follows normal links in it. Links that only appear after JavaScript runs won't be found. If your site relies on client-side rendering, paste your URLs instead, or make sure key links are in the HTML, since search engines prefer that too." },
  ],
};

export default function Page() {
  return (
    <ToolShell copy={copy}>
      <SitemapTool />
    </ToolShell>
  );
}
