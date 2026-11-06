export type Category = "technical" | "onpage" | "content" | "performance" | "mobile" | "links" | "images" | "schema";
export type Status = "passed" | "warning" | "error" | "na" | "not_tested";
export type Severity = "critical" | "high" | "medium" | "low";

export const CATEGORY_META: Record<Category, { label: string; weight: number }> = {
  technical: { label: "Technical SEO", weight: 25 },
  onpage: { label: "On-Page SEO", weight: 20 },
  content: { label: "Content SEO", weight: 20 },
  performance: { label: "Performance", weight: 15 },
  mobile: { label: "Mobile SEO", weight: 10 },
  links: { label: "Internal Linking", weight: 5 },
  images: { label: "Image SEO", weight: 3 },
  schema: { label: "Structured Data", weight: 2 },
};
export const CATEGORIES = Object.keys(CATEGORY_META) as Category[];

/** One affected item: a URL plus an optional short note (e.g. the duplicate title). */
export type Affected = { url: string; note?: string };

export type Finding = {
  checkId: string;
  category: Category;
  status: Status;
  severity: Severity;
  title: string;
  summary: string;
  affected: Affected[];
  details?: Record<string, unknown>;
};

export type ImageInfo = { src: string; alt: string | null; width: string | null; height: string | null; loading: string | null; srcset: boolean };
export type LinkInfo = { href: string; text: string; nofollow: boolean; internal: boolean };

/** Everything extracted from one crawled HTML page. No page script is ever executed. */
export type PageData = {
  url: string;
  finalUrl: string;
  status: number;
  depth: number;
  redirects: { url: string; status: number }[];
  contentType: string;
  bytes: number;
  timeMs: number;
  isHtml: boolean;
  error?: string;
  xRobots?: string;
  lang?: string | null;
  title?: string | null;
  titleCount?: number;
  metaDescription?: string | null;
  metaDescriptionCount?: number;
  metaRobots?: string | null;
  canonical?: string | null;
  canonicalCount?: number;
  viewport?: string | null;
  h1: string[];
  h2: string[];
  h3: string[];
  headingOrder: number[];
  wordCount: number;
  textRatio: number;
  textHash?: string;
  /** First ~4,000 characters of main body text (lowercased), for topic checks. */
  textSample?: string;
  readability?: number | null;
  paragraphs: number;
  longParagraphs: number;
  images: ImageInfo[];
  links: LinkInfo[];
  hreflang: { lang: string; href: string }[];
  og: Record<string, string>;
  twitter: Record<string, string>;
  jsonLd: { types: string[]; valid: boolean; error?: string }[];
  microdataTypes: string[];
  mixedContent: string[];
  relNext?: string | null;
  relPrev?: string | null;
  scriptCount: number;
  jsAppShell: boolean;
  dateModified?: string | null;
  hasForms: boolean;
  hasContactInfo: boolean;
  smallFontHints: number;
};

export type SiteInfo = {
  origin: string;
  host: string;
  https: boolean;
  httpRedirectsToHttps?: boolean | null;
  wwwVariant?: { url: string; status: number; finalUrl: string; consistent: boolean } | null;
  homeStatus?: number;
  homeRedirects?: { url: string; status: number }[];
  robots?: { found: boolean; status: number; disallowAll: boolean; sitemaps: string[]; size: number; error?: string };
  sitemaps?: { url: string; ok: boolean; status: number; urlCount: number; error?: string; isIndex: boolean }[];
  sitemapUrls?: number;
  notFoundTest?: { status: number; url: string } | null;
  pagespeed?: {
    mobile?: PageSpeedResult | { error: string };
    desktop?: PageSpeedResult | { error: string };
  };
  imageChecks?: { src: string; bytes: number; type: string; status: number }[];
  blockedByRobots?: number;
};

export type PageSpeedResult = {
  url: string;
  strategy: "mobile" | "desktop";
  score: number | null;
  metrics: Record<string, { value: number | null; display: string; score: number | null }>;
  field?: Record<string, { p75: number; category: string }>;
  opportunities: { id: string; title: string; display: string; savingsMs?: number; savingsBytes?: number }[];
  diagnostics: { id: string; title: string; display: string }[];
  /** Lighthouse audit ids that scored ≥ 0.9. */
  passedAudits?: string[];
};

export type AuditStats = {
  discovered: number;
  crawled: number;
  analysed: number;
  skipped: number;
  failed: number;
  limitReached: boolean;
  /** Discovered URLs that aren't web pages (images, PDFs…) — excluded from coverage. */
  nonPages?: number;
  issues?: number;
};

export type Scores = {
  overall: number | null;
  categories: Record<Category, { score: number | null; tested: number; passed: number; warnings: number; errors: number }>;
  counts: { critical: number; high: number; medium: number; low: number; passed: number; notTested: number };
};

export const STAGES = [
  "Validating website",
  "Checking website accessibility",
  "Discovering website pages",
  "Crawling internal URLs",
  "Analysing technical SEO",
  "Analysing on-page SEO",
  "Analysing content quality",
  "Checking website performance",
  "Analysing mobile SEO",
  "Checking images and structured data",
  "Calculating SEO scores",
  "Generating audit results",
] as const;
