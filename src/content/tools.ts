/**
 * Free SEO tools: one list drives the header menu, the /free-seo-tools hub, related-tool
 * links, the sitemap and llms.txt-style summaries. Copy is written for people first.
 */
export type ToolSlug =
  | "seo-audit"
  | "keyword-density-checker"
  | "meta-tag-generator"
  | "robots-txt-generator"
  | "schema-markup-generator"
  | "serp-snippet-preview"
  | "sitemap-generator";

export type Tool = {
  slug: ToolSlug;
  href: string;
  /** Menu / card name. */
  name: string;
  /** One line for menus and cards. */
  short: string;
  /** What category of job it does, shown as a label. */
  kind: string;
};

export const TOOLS_HUB = { href: "/free-seo-tools", label: "Free SEO Tools" } as const;

export const tools: readonly Tool[] = [
  { slug: "seo-audit", href: "/seo-audit", name: "Website SEO Audit", short: "Crawl up to 100 pages and get a prioritised fix list.", kind: "Audit" },
  { slug: "keyword-density-checker", href: "/free-seo-tools/keyword-density-checker", name: "Keyword Density Checker", short: "See which words and phrases a page actually leans on.", kind: "Content" },
  { slug: "meta-tag-generator", href: "/free-seo-tools/meta-tag-generator", name: "Meta Tag Generator", short: "Write title, description, Open Graph and Twitter tags.", kind: "On-page" },
  { slug: "serp-snippet-preview", href: "/free-seo-tools/serp-snippet-preview", name: "SERP Snippet Preview", short: "Check how your result looks in Google before you publish.", kind: "On-page" },
  { slug: "schema-markup-generator", href: "/free-seo-tools/schema-markup-generator", name: "Schema Markup Generator", short: "Build valid JSON-LD for rich results in a few clicks.", kind: "Structured data" },
  { slug: "robots-txt-generator", href: "/free-seo-tools/robots-txt-generator", name: "Robots.txt Generator", short: "Control crawlers and AI bots without breaking indexing.", kind: "Technical" },
  { slug: "sitemap-generator", href: "/free-seo-tools/sitemap-generator", name: "XML Sitemap Generator", short: "Crawl a site or paste URLs and download sitemap.xml.", kind: "Technical" },
];

export const toolBySlug = (slug: ToolSlug) => tools.find((t) => t.slug === slug)!;
