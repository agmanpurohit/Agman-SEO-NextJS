/**
 * Services, defined once and published per country market (/india/<service>, later /uae/…).
 * The registry here is country-neutral; each market has its own copy file (./india.ts) with
 * the page text, FAQs and target keywords for that audience.
 */
import type { ToolSlug } from "@/content/tools";

export type ServiceSlug =
  | "seo-specialist"
  | "digital-marketing"
  | "technical-seo"
  | "local-seo"
  | "geo-specialist"
  | "answer-engine-optimization"
  | "google-ads"
  | "meta-ads"
  | "web-development";

export type ArtId = "seo" | "digital" | "technical" | "local" | "geo" | "aeo" | "google-ads" | "meta-ads" | "web";

export type Service = {
  slug: ServiceSlug;
  /** Menu and card name. */
  name: string;
  /** One line for menus and cards. */
  short: string;
  /** Group label shown on cards. */
  kind: "Search" | "AI search" | "Paid media" | "Build" | "Strategy";
  art: ArtId;
  /** Free tools that relate to this service (linked from the page). */
  tools: ToolSlug[];
  /** Case study on /work that best shows this kind of work. */
  caseSlug?: string;
};

export const services: readonly Service[] = [
  { slug: "seo-specialist", name: "SEO Specialist", short: "Hands-on SEO from audit to rankings, done by one person you can talk to.", kind: "Search", art: "seo", tools: ["seo-audit", "keyword-density-checker", "serp-snippet-preview"], caseSlug: "dental-architecture-restructure" },
  { slug: "technical-seo", name: "Technical SEO", short: "Crawling, indexing, speed, structure and schema, fixed at the source.", kind: "Search", art: "technical", tools: ["seo-audit", "robots-txt-generator", "sitemap-generator", "schema-markup-generator"], caseSlug: "auto-parts-ecommerce" },
  { slug: "local-seo", name: "Local SEO", short: "Google Maps, Business Profile and “near me” searches that bring in calls.", kind: "Search", art: "local", tools: ["seo-audit", "schema-markup-generator"], caseSlug: "dental-clinic-local-pack" },
  { slug: "geo-specialist", name: "GEO Specialist", short: "Get your business named and cited in ChatGPT, Gemini and AI Overviews.", kind: "AI search", art: "geo", tools: ["schema-markup-generator", "seo-audit"], caseSlug: "multi-market-financial-services" },
  { slug: "answer-engine-optimization", name: "AEO Services", short: "Content shaped to win featured snippets, voice answers and People Also Ask.", kind: "AI search", art: "aeo", tools: ["schema-markup-generator", "serp-snippet-preview"], caseSlug: "dental-group-topical-authority" },
  { slug: "google-ads", name: "Google Ads", short: "Search, Display and Remarketing campaigns built around real leads.", kind: "Paid media", art: "google-ads", tools: ["serp-snippet-preview", "keyword-density-checker"], caseSlug: "freelance-paid-media" },
  { slug: "meta-ads", name: "Meta Ads", short: "Facebook and Instagram campaigns for leads, traffic and enquiries.", kind: "Paid media", art: "meta-ads", tools: ["meta-tag-generator"], caseSlug: "freelance-paid-media" },
  { slug: "web-development", name: "Web Development", short: "Fast WordPress sites with SEO built in before launch, not patched on later.", kind: "Build", art: "web", tools: ["meta-tag-generator", "schema-markup-generator", "sitemap-generator"], caseSlug: "tattoo-studio-from-zero" },
  { slug: "digital-marketing", name: "Digital Marketing", short: "SEO, ads, local and AI search planned together, around one goal.", kind: "Strategy", art: "digital", tools: ["seo-audit", "meta-tag-generator"], caseSlug: "dental-group-topical-authority" },
];

export const serviceBySlug = (slug: string) => services.find((s) => s.slug === slug);

export type MarketSlug = "india";
export type Market = {
  slug: MarketSlug;
  name: string;
  /** e.g. "Indian businesses" */
  adjective: string;
  /** ISO country code for schema.org areaServed. */
  code: string;
  cities: string[];
};

export const markets: Record<MarketSlug, Market> = {
  india: {
    slug: "india",
    name: "India",
    adjective: "Indian",
    code: "IN",
    cities: ["Ahmedabad", "Mumbai", "Delhi NCR", "Bengaluru", "Pune", "Hyderabad", "Chennai", "Jaipur", "Surat", "Jodhpur"],
  },
};

export const servicePath = (market: MarketSlug, slug: ServiceSlug) => `/${market}/${slug}`;
export const marketPath = (market: MarketSlug) => `/${market}`;

/** Everything a service page needs to say for one market. Text may contain [label](/path) links. */
export type ServiceCopy = {
  slug: ServiceSlug;
  metaTitle: string;
  metaDescription: string;
  socialTitle: string;
  h1: string;
  /** Short line under the H1. */
  lead: string;
  /** A direct answer for AI answer engines and featured snippets. */
  answer: { q: string; a: string };
  keywords: { primary: string; secondary: string[] };
  context: { heading: string; paragraphs: string[] };
  includes: { heading: string; items: { t: string; d: string }[] };
  process: { t: string; d: string }[];
  proof: { heading: string; intro: string; points: { value: string; label: string; context: string }[] };
  fit: { heading: string; items: string[] };
  faq: { q: string; a: string }[];
};

export type MarketCopy = {
  hub: {
    metaTitle: string;
    metaDescription: string;
    socialTitle: string;
    h1: string;
    lead: string;
    answer: { q: string; a: string };
    keywords: { primary: string; secondary: string[] };
    why: { t: string; d: string }[];
    faq: { q: string; a: string }[];
  };
  services: Record<ServiceSlug, ServiceCopy>;
};
