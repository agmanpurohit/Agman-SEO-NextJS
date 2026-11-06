/**
 * Case studies. Clients are named (with logos) where Agman has approved it; the ecommerce,
 * paid-media and remaining agency projects stay anonymous.
 * Figures come from Search Console, GA4, Google Business Profile and client records
 * supplied by Agman. Nothing is estimated. Where a field is unknown, it is left out.
 */
export type Tag =
  | "Dental & Healthcare"
  | "Local SEO"
  | "Technical SEO"
  | "International SEO"
  | "GEO / AI Search"
  | "Ecommerce"
  | "Paid Media"
  | "Web Development";

export const filters: ("All" | Tag)[] = [
  "All",
  "Dental & Healthcare",
  "Local SEO",
  "Technical SEO",
  "International SEO",
  "GEO / AI Search",
  "Ecommerce",
  "Paid Media",
  "Web Development",
];

export type Chart =
  | {
      kind: "markets";
      title: string;
      caption: string;
      rows: { market: string; before: number; after: number }[];
      unit: string;
    }
  | {
      kind: "bars";
      title: string;
      caption: string;
      rows: { label: string; value: number; display: string; highlight?: boolean }[];
    };

/** Client identity, shown with Agman's permission. `plate` is the background the logo needs to stay legible. */
export type Client = {
  name: string;
  logo: { src: string; w: number; h: number; plate: "light" | "dark"; scale?: number };
};

const clients = {
  ncsgx: { name: "NCSGX", logo: { src: "/images/clients/ncsgx.png", w: 800, h: 221, plate: "light" } },
  academy: { name: "Academy Dental", logo: { src: "/images/clients/academy-dental.png", w: 747, h: 200, plate: "light" } },
  smile: { name: "Smile Republic Orthodontics", logo: { src: "/images/clients/smile-republic.png", w: 340, h: 98, plate: "light" } },
  sunnyview: { name: "Sunnyview Dental", logo: { src: "/images/clients/sunnyview-dental.jpg", w: 480, h: 311, plate: "light" } },
  oasis: { name: "Oasis Skincare Clinic", logo: { src: "/images/clients/oasis-skincare.png", w: 228, h: 96, plate: "dark" } },
  boldBody: { name: "Bold Body Arts", logo: { src: "/images/clients/bold-body-arts.jpg", w: 1080, h: 1080, plate: "light", scale: 3 } },
} satisfies Record<string, Client>;

export type Shot = { src: string; w: number; h: number; label: string; caption: string };
/** A group of screenshots shown under one tab (a market, or a report type). */
export type Evidence = { market: string; summary: string; shots: Shot[] };

const shot = (file: string, w: number, h: number, label: string, caption: string): Shot => ({ src: `/images/work/${file}`, w, h, label, caption });

export type CaseStudy = {
  slug: string;
  /** Named client. Leave out to keep the project anonymous. */
  client?: Client;
  title: string;
  industry: string;
  type: string;
  tags: Tag[];
  services: string[];
  metric: { value: string; label: string };
  summary: string;
  challenge: string[];
  objective: string;
  strategy: string[];
  tools: string[];
  results: string[];
  contribution: string;
  charts?: Chart[];
  /** Original report screenshots, grouped under tabs. */
  evidence?: Evidence[];
  /** Also feature this case's screenshots in the "Straight from the reports" section. */
  reportsWall?: boolean;
  source: string;
  /** Word used for the generated typographic cover. */
  coverWord: string;
  featured?: boolean;
};

export const cases: CaseStudy[] = [
  {
    slug: "multi-market-financial-services",
    client: clients.ncsgx,
    title: "Four markets, one domain",
    industry: "Accounting & financial services — USA, Canada, Australia",
    type: "International SEO · GEO / AEO",
    tags: ["International SEO", "Technical SEO", "GEO / AI Search"],
    services: ["Site restructure", "Hreflang", "Technical SEO", "GEO / AEO content", "Link building"],
    metric: { value: "+191%", label: "Organic clicks, Canada" },
    summary:
      "A finance site serving four audiences from one domain, starting with almost no authority. A full restructure, hreflang and content written for both Google and AI search grew clicks in every market within a quarter.",
    challenge: [
      "One domain serving the USA, Canada, Australia and a global audience.",
      "Weak structure and internal linking were limiting crawlability.",
      "A brand-new domain with no backlink profile to speak of.",
    ],
    objective: "Grow organic and AI-search visibility in each target market and build authority from a standing start.",
    strategy: [
      "Rebuilt site architecture, internal linking and navigation.",
      "Implemented hreflang with country subdirectories: /us/, /ca/ and /au/.",
      "Researched keywords and intent for accounting, crypto accounting and taxation topics.",
      "Wrote SEO, GEO and AEO content with clear sourcing and accurate financial terminology.",
      "Built citations, business listings and white-hat links.",
      "Wrote a WordPress plugin that adds page-specific JSON-LD schema.",
    ],
    tools: ["Google Search Console", "GA4", "Ahrefs", "SEMrush", "WordPress", "JSON-LD"],
    results: [
      "Canada: organic clicks 137 → 399 (+191%), impressions 76.3K → 198K (+160%), average position 15.2 → 12.9.",
      "Global: clicks 964 → 1,940 (+101%), impressions 161K → 456K (+183%).",
      "Australia: clicks 177 → 434 (+145%), impressions 39.6K → 130K (+228%).",
      "USA: clicks 21 → 62, impressions 15K → 85.6K (+471%), average position 44.4 → 34.2.",
      "30+ quality backlinks secured in the first month.",
    ],
    contribution:
      "I led the restructure and the international setup, wrote the SEO, GEO and AEO content, ran the off-page work and built the schema plugin.",
    charts: [
      {
        kind: "markets",
        title: "Organic clicks by market",
        caption: "Search Console, Jun–Aug 2026 compared with Mar–May 2026.",
        unit: "clicks",
        rows: [
          { market: "Global", before: 964, after: 1940 },
          { market: "Australia", before: 177, after: 434 },
          { market: "Canada", before: 137, after: 399 },
          { market: "USA", before: 21, after: 62 },
        ],
      },
      {
        kind: "markets",
        title: "Impressions on AI search features",
        caption: "Search Console, same periods. Values in impressions.",
        unit: "impressions",
        rows: [
          { market: "Global", before: 6450, after: 48300 },
          { market: "Canada", before: 3660, after: 23300 },
          { market: "USA", before: 391, after: 12000 },
          { market: "Australia", before: 1750, after: 8320 },
        ],
      },
    ],
    evidence: (
      [
        ["Global", "global", "Clicks 964 → 1.94K · Impressions 161K → 456K · AI-feature impressions 6.45K → 48.3K", [662, 352], [995, 538], [991, 530], "1.1K active users · 1K new users · 1m 09s average engagement (last 28 days)"],
        ["Canada", "canada", "Clicks 137 → 399 · Impressions 76.3K → 198K · AI-feature impressions 3.66K → 23.3K", [674, 421], [1012, 535], [985, 519], "2.6K active users (+177.1%) · 2.6K new users (+160.1%) vs. the comparison period"],
        ["Australia", "australia", "Clicks 177 → 434 · Impressions 39.6K → 130K · AI-feature impressions 1.75K → 8.32K", [662, 408], [1014, 514], [1014, 537], "1.9K active users · 1.8K new users · 57s average engagement (last 28 days)"],
        ["USA", "usa", "Clicks 21 → 62 · Impressions 15K → 85.6K · AI-feature impressions 391 → 12K", [667, 372], [994, 527], [1010, 528], "2.1K active users · 2.1K new users · 52s average engagement (last 28 days)"],
      ] as const
    ).map(([market, slug, summary, ga4, gsc, ai, ga4Caption]) => ({
      market,
      summary,
      shots: [
        { src: `/images/work/fin-${slug}-gsc.png`, w: gsc[0], h: gsc[1], label: "Search Console · Performance", caption: "Last 3 months compared with the previous 3 months." },
        { src: `/images/work/fin-${slug}-ai.png`, w: ai[0], h: ai[1], label: "Search Console · Generative AI features", caption: "Impressions in AI-generated search features, same periods." },
        { src: `/images/work/fin-${slug}-ga4.png`, w: ga4[0], h: ga4[1], label: "GA4 · Reports snapshot", caption: ga4Caption },
      ],
    })),
    reportsWall: true,
    source: "Google Search Console and GA4 (original report screenshots).",
    coverWord: "Markets",
    featured: true,
  },
  {
    slug: "dental-architecture-restructure",
    title: "Rebuilding the paths search engines take",
    industry: "Dental & healthcare",
    type: "Technical SEO",
    tags: ["Dental & Healthcare", "Technical SEO"],
    services: ["Site architecture", "Internal linking", "On-page optimization"],
    metric: { value: "+120%", label: "Organic traffic in ~3 months" },
    summary:
      "The site had the right services but the wrong shape. Restructuring its architecture and internal linking more than doubled organic traffic in about three months.",
    challenge: ["The site's structure and internal linking weren't leading visitors or crawlers to its most valuable pages."],
    objective: "Make the most valuable pages easy to reach for both visitors and crawlers.",
    strategy: [
      "Rebuilt the URL and category hierarchy around services.",
      "Rewired internal links so authority flows to the pages that matter most.",
      "Optimized titles, headings, schema and content on key service pages.",
    ],
    tools: ["Screaming Frog", "Google Search Console", "Google Analytics", "SEMrush"],
    results: ["120% growth in organic traffic within about three months."],
    contribution: "I planned and carried out the restructure and on-page optimization while at MediaNV.",
    source: "Google Analytics. Delivered at MediaNV.",
    coverWord: "Structure",
    featured: true,
  },
  {
    slug: "dental-group-topical-authority",
    client: clients.academy,
    title: "Authority that scales",
    industry: "Multi-location dental group",
    type: "Technical SEO · Content",
    tags: ["Dental & Healthcare", "Technical SEO", "GEO / AI Search"],
    services: ["Topical authority", "Programmatic on-page", "CTR testing", "Crawl budget"],
    metric: { value: "1.09M", label: "Search impressions" },
    summary:
      "Topical authority clusters and programmatic on-page optimization lifted average position from 23 to 10.8 while impressions passed one million, and organic became the group's leading channel.",
    challenge: ["An average ranking position of 23, well beyond page one, and a need for growth that would last rather than spike."],
    objective: "Scale impressions and rankings together across services and locations.",
    strategy: [
      "Built topical authority clusters around core dental services.",
      "Applied programmatic on-page optimization to service and location pages.",
      "Targeted high-intent, lower-competition long-tail queries.",
      "Tested titles and meta descriptions against search intent to lift click-through.",
      "Fixed indexing inefficiencies and crawl-budget waste; expanded queries from Search Console data.",
    ],
    tools: ["Google Search Console", "GA4", "SEMrush", "Screaming Frog"],
    results: [
      "Last 6 months vs the previous 6: impressions 801K → 1.09M, clicks 4.82K → 6.77K, average position 23.1 → 10.8.",
      "43K active users (+305%) and 27K engaged sessions (+274%).",
      "15K key events / conversions (+192%).",
      "Organic became the top channel with 24K sessions, ahead of direct (10K) and paid (3.4K).",
    ],
    contribution: "I owned the SEO strategy and on-page work across the group's service and location pages.",
    charts: [
      {
        kind: "bars",
        title: "Sessions by channel",
        caption: "GA4, reporting period supplied by the client.",
        rows: [
          { label: "Organic", value: 24000, display: "24K", highlight: true },
          { label: "Direct", value: 10000, display: "10K" },
          { label: "Paid", value: 3400, display: "3.4K" },
        ],
      },
    ],
    evidence: [
      {
        market: "Search Console",
        summary: "Clicks 4.82K → 6.77K · Impressions 801K → 1.09M · Average position 23.1 → 10.8 (last 6 months vs previous 6)",
        shots: [shot("academy-gsc.png", 1829, 767, "Search Console · Performance", "Last 6 months compared with the previous 6 months.")],
      },
      {
        market: "GA4",
        summary: "43K active users (+305.8%) · 345K events (+383.4%) · 27K engaged sessions (+274.4%) · 15K key events (+192.1%)",
        shots: [
          shot("academy-ga4.png", 937, 640, "GA4 · Home overview", "Custom date range compared with the previous period."),
          shot("academy-ga4-channels.png", 971, 423, "GA4 · Acquisition by channel", "Organic Search leads new users and sessions (24K)."),
          shot("academy-ga4-activity.png", 548, 452, "GA4 · User activity over time", "30-day active users climbing through the year."),
        ],
      },
    ],
    source: "Google Search Console and GA4 (original report screenshots).",
    coverWord: "Authority",
    featured: true,
  },
  {
    slug: "orthodontics-small-market",
    client: clients.smile,
    title: "Growing past the town limits",
    industry: "Orthodontic practice — small-town market",
    type: "Local SEO",
    tags: ["Dental & Healthcare", "Local SEO", "GEO / AI Search"],
    services: ["Geo-targeted pages", "Multi-location GBP", "Local-intent keywords"],
    metric: { value: "+1600%", label: "Users" },
    summary:
      "A narrow specialty in a small market leaves little search demand. Geo-targeted pages for the surrounding communities opened up new demand: 1.26M impressions and a sixteen-fold increase in users.",
    challenge: ["Limited search demand for a narrow specialty inside a small-town market."],
    objective: "Reach patients in nearby communities, not just the practice's own town.",
    strategy: [
      "Expanded targeting to high-potential nearby communities.",
      "Built geo-targeted landing pages for those areas.",
      "Focused on service and location-intent keywords.",
      "Strengthened internal linking for location relevance.",
      "Optimized the Google Business Profile for multi-location visibility.",
    ],
    tools: ["Google Search Console", "GA4", "Google Business Profile"],
    results: [
      "1.26M impressions and 5.37K clicks; average position improved to 12.8.",
      "16K users (+1600%) and 20K sessions (+1100%).",
      "Organic led acquisition with 7.4K sessions, ahead of direct (4.7K) and paid (2.4K).",
    ],
    contribution: "I planned the local expansion and built out the location strategy and profile optimization.",
    charts: [
      {
        kind: "bars",
        title: "Sessions by channel",
        caption: "GA4, reporting period supplied by the client.",
        rows: [
          { label: "Organic", value: 7400, display: "7.4K", highlight: true },
          { label: "Direct", value: 4700, display: "4.7K" },
          { label: "Paid", value: 2400, display: "2.4K" },
        ],
      },
    ],
    evidence: [
      {
        market: "Search Console",
        summary: "5.37K clicks · 1.26M impressions · 0.4% CTR · average position 12.8 (from late March 2025)",
        shots: [shot("smile-gsc.png", 904, 461, "Search Console · Performance", "Clicks, impressions and position trending up from mid-2025.")],
      },
      {
        market: "GA4",
        summary: "User growth, acquisition channels and activity over time",
        shots: [
          shot("smile-ga4.png", 942, 416, "GA4 · Home overview", "Snapshot from a different date range than the results quoted above."),
          shot("smile-ga4-channels.png", 551, 386, "GA4 · New users by channel", "Organic Search is the largest source of new users."),
          shot("smile-ga4-activity.png", 529, 369, "GA4 · User activity over time", "30-day active users rising from mid-year."),
        ],
      },
    ],
    source: "Google Search Console and GA4 (original report screenshots).",
    coverWord: "Reach",
    featured: true,
  },
  {
    slug: "dental-clinic-local-pack",
    client: clients.sunnyview,
    title: "Into the local pack, then to the top of it",
    industry: "Dental clinic — Georgetown, Ontario",
    type: "Local SEO",
    tags: ["Dental & Healthcare", "Local SEO"],
    services: ["GBP optimization", "SEO audit", "Keyword optimization", "Link building"],
    metric: { value: "+140%", label: "New patient appointments" },
    summary:
      "The clinic was almost invisible on Google Maps. Three months later it held first position in the local pack for a high-volume keyword, and new patient appointments had more than doubled.",
    challenge: ["Very low website traffic.", "Almost no visibility on Google Business Profile.", "Very few new patient enquiries."],
    objective: "Increase local visibility and bring in new patients.",
    strategy: [
      "Optimized keywords for each dental service.",
      "Rebuilt and completed the Google Business Profile.",
      "Ran a full SEO audit and fixed the technical issues it found.",
      "Built high-quality backlinks.",
    ],
    tools: ["Google Business Profile", "Google Search Console", "Ahrefs", "SEMrush"],
    results: [
      "Website traffic up 68% in the first month.",
      "Google Business Profile impressions up 132%.",
      "New patient appointments up 140% by month three.",
      "First position in the local pack for “dentist georgetown”, up from not appearing in it at all.",
      "Search Console, last 3 months vs the same period a year earlier: clicks 373 → 623, average position 46 → 14.6.",
      "GA4, last 90 days vs the previous period: active users 1.9K (+35.8%), sessions 2.2K (+34.1%), new users 1.9K (+35.5%).",
    ],
    contribution: "I ran the audit, the profile optimization, the keyword work and the link building.",
    evidence: [
      {
        market: "Local pack",
        summary: "“dentist georgetown”: not in the local pack before, first position after",
        shots: [
          shot("sunnyview-local-pack-before.png", 656, 661, "Google Maps · Before SEO", "Not visible in the local pack for “dentist georgetown”."),
          shot("sunnyview-local-pack-after.png", 650, 648, "Google Maps · After SEO", "First position in the local pack for the same search."),
        ],
      },
      {
        market: "Search Console",
        summary: "Clicks 373 → 623 · Impressions 138K → 143K · Average position 46 → 14.6 (last 3 months vs same period last year)",
        shots: [shot("sunnyview-gsc.png", 928, 345, "Search Console · Performance", "Last 3 months compared with the same period last year.")],
      },
      {
        market: "GA4",
        summary: "Active users 1.9K (+35.8%) · Events 9.8K (+23.1%) · Sessions 2.2K (+34.1%) · New users 1.9K (+35.5%)",
        shots: [
          shot("sunnyview-ga4.png", 980, 486, "GA4 · Overview", "Last 90 days compared with the previous period."),
          shot("sunnyview-ga4-channels.png", 703, 412, "GA4 · Sessions by channel", "2,217 sessions vs 1,666 (+33.07%), Dec 2025 – Mar 2026 vs Sep – Dec 2025."),
        ],
      },
    ],
    source: "Google Business Profile, Google Search Console, GA4 and client records.",
    coverWord: "Local",
  },
  {
    slug: "aesthetics-clinic",
    client: clients.oasis,
    title: "A clinic people could finally find",
    industry: "Medical aesthetics & skincare clinic",
    type: "Local SEO",
    tags: ["Dental & Healthcare", "Local SEO"],
    services: ["GBP optimization", "SEO audit", "Keyword optimization", "Link building"],
    metric: { value: "+124%", label: "Traffic in month one" },
    summary:
      "Low traffic, a near-invisible profile and few enquiries. Within a month traffic had more than doubled; by month three new client appointments were up 84%.",
    challenge: ["Very low website traffic.", "Almost no visibility on Google Business Profile.", "Very few new client enquiries."],
    objective: "Increase visibility and attract new clients.",
    strategy: [
      "Optimized keywords for skincare services and product listings.",
      "Optimized the Google Business Profile.",
      "Ran a full SEO audit and fixed technical issues.",
      "Built high-quality backlinks.",
    ],
    tools: ["GA4", "Google Business Profile", "Ahrefs"],
    results: [
      "Website traffic up 124% in the first month.",
      "Google Business Profile impressions up 182%.",
      "New client appointments up 84% by month three.",
      "Search Console across the period shown: 3.57K clicks and 856K impressions, with a clear step up once the SEO work began.",
    ],
    contribution: "I handled the audit, profile optimization, keyword strategy and link building.",
    evidence: [
      {
        market: "Search Console",
        summary: "3.57K clicks · 856K impressions · 0.4% CTR · average position 36.7 across the period shown",
        shots: [shot("oasis-gsc.png", 937, 423, "Search Console · Performance", "Before and after the SEO work, as marked on the report.")],
      },
    ],
    source: "GA4, Google Search Console, Google Business Profile and client records.",
    coverWord: "Skin",
  },
  {
    slug: "auto-parts-ecommerce",
    title: "Thousands of products, one clear structure",
    industry: "Automotive parts retailer",
    type: "Technical SEO · Ecommerce",
    tags: ["Technical SEO", "Ecommerce"],
    services: ["Technical audit", "Site structure", "Crawlability", "Listing automation"],
    metric: { value: "+58%", label: "New users" },
    summary:
      "A large catalogue, tangled navigation and broken links, after a previous agency had produced no visible results. Rebuilding around crawlability turned it around.",
    challenge: [
      "A large website with poor structure and navigation.",
      "Thousands of product pages creating SEO issues.",
      "Broken links hurting crawlability.",
      "Previous agency work with no visible SEO results.",
    ],
    objective: "Make a large catalogue crawlable and competitive for product searches.",
    strategy: [
      "Rebuilt the site structure following SEO best practice.",
      "Developed custom automated systems for product listings.",
      "Ran a complete technical SEO audit.",
      "Fixed crawlability issues and broken links.",
    ],
    tools: ["Screaming Frog", "GA4", "Google Search Console"],
    results: [
      "Active users up 40% and new users up 58%.",
      "Event count up 25% and key events (conversions) up 47%.",
      "Top rankings for multiple competitive product keywords.",
    ],
    contribution: "I led the technical audit and restructure and built the listing automation.",
    source: "GA4.",
    coverWord: "Catalogue",
  },
  {
    slug: "tattoo-studio-from-zero",
    client: clients.boldBody,
    title: "From word of mouth to first on Google",
    industry: "Tattoo & piercing studio — Tulsa, Oklahoma",
    type: "Website development · Local SEO",
    tags: ["Web Development", "Local SEO"],
    services: ["Custom SEO website", "GBP setup", "Competitor analysis", "Conversion structure"],
    metric: { value: "#1", label: "On Google for several keywords" },
    summary:
      "No website, no Google Business Profile, entirely dependent on referrals. I built both from scratch, and the studio now ranks first for several competitive keywords.",
    challenge: ["No website and no Google Business Profile.", "Fully dependent on word of mouth.", "Limited visibility and slow growth."],
    objective: "Give the studio a presence that brings in bookings on its own.",
    strategy: [
      "Designed and built a custom, SEO-optimized website.",
      "Structured pages around conversion, with clear calls to action.",
      "Analysed local competitors.",
      "Created and verified the Google Business Profile.",
    ],
    tools: ["WordPress", "Google Business Profile", "Google Search Console"],
    results: [
      "First position on Google for several competitive keywords, including “tattoo studio near me”, “tattoo shop tulsa” and “piercing studio tulsa”.",
      "The site began ranking for relevant tattoo-related searches.",
      "A steady increase in enquiries and bookings.",
    ],
    contribution: "I designed and built the website and set up the local search presence.",
    evidence: [
      {
        market: "Google results",
        summary: "Top organic result for three local searches",
        shots: [
          shot("boldbody-serp-tattoo-studio-near-me.png", 781, 251, "Google · “tattoo studio near me”", "Bold Body Arts as the first organic result."),
          shot("boldbody-serp-tattoo-shop-tulsa.png", 781, 263, "Google · “tattoo shop tulsa”", "Bold Body Arts as the first organic result."),
          shot("boldbody-serp-piercing-studio-tulsa.png", 771, 257, "Google · “piercing studio tulsa”", "Bold Body Arts as the first organic result."),
        ],
      },
    ],
    source: "Google search results and client records.",
    coverWord: "Ink",
  },
  {
    slug: "dental-prelaunch-programme",
    title: "SEO built in, not bolted on",
    industry: "Dental — pre-launch website programme",
    type: "Technical SEO · Web",
    tags: ["Dental & Healthcare", "Technical SEO", "Web Development"],
    services: ["Architecture", "Meta tags", "Schema markup", "Performance"],
    metric: { value: "100+", label: "Sites SEO-ready in 6 months" },
    summary:
      "Fixing SEO after launch is slow and expensive. On this programme, architecture, metadata, schema and performance were handled during development, so more than 100 dental sites launched ready to rank.",
    challenge: ["A high volume of new dental websites, each needing to launch crawlable, structured and fast."],
    objective: "Make SEO part of the build process rather than a clean-up job afterwards.",
    strategy: [
      "Defined site architecture before each build.",
      "Set meta tags and schema markup during development.",
      "Checked performance before launch.",
    ],
    tools: ["WordPress", "Screaming Frog", "Google Search Console"],
    results: ["100+ dental websites delivered SEO-ready within six months."],
    contribution: "I handled on-page and technical SEO for every site in the programme, working alongside the development team at MediaNV.",
    source: "CV. Delivered at MediaNV.",
    coverWord: "Scale",
  },
  {
    slug: "custom-wordpress-plugins",
    title: "When the plugin doesn't exist, write it",
    industry: "Agency and in-house tooling",
    type: "Web development",
    tags: ["Web Development", "Technical SEO"],
    services: ["WordPress plugin development", "JSON-LD schema", "XML sitemaps"],
    metric: { value: "2", label: "Custom plugins in production" },
    summary:
      "Two WordPress plugins written to solve SEO problems directly: one generates a custom sitemap and is still used at the agency, the other adds page-specific JSON-LD schema.",
    challenge: ["Off-the-shelf plugins didn't give enough control over sitemaps and per-page structured data."],
    objective: "Give the team precise control over how search engines discover and understand each page.",
    strategy: [
      "Built a sitemap plugin that generates a custom XML sitemap (MediaNV).",
      "Built a schema plugin that attaches custom JSON-LD to each page (NCS GX).",
    ],
    tools: ["WordPress", "PHP", "JSON-LD"],
    results: ["The sitemap plugin is still in use at MediaNV."],
    contribution: "I designed and wrote both plugins.",
    source: "CV.",
    coverWord: "Code",
  },
  {
    slug: "freelance-paid-media",
    title: "Paid campaigns built for leads",
    industry: "Freelance clients",
    type: "Google Ads · Meta Ads",
    tags: ["Paid Media"],
    services: ["Campaign planning", "Audience targeting", "Ad copy & creative testing", "Conversion tracking"],
    metric: { value: "4–7%", label: "Average Google Ads CTR" },
    summary:
      "Freelance Google Ads and Meta Ads accounts focused on lead generation and customer acquisition, improved week by week through testing, negative keywords and audience refinement.",
    challenge: ["Paid budgets disappear quickly when targeting, tracking and creative aren't aligned."],
    objective: "Generate measurable leads at a cost that makes sense for the business.",
    strategy: [
      "Structured Search, Display and Remarketing campaigns on Google Ads.",
      "Segmented audiences and tested creative across Facebook and Instagram.",
      "Set up conversion tracking before scaling spend.",
      "Ran continuous A/B tests, negative keyword optimization and landing-page improvements.",
    ],
    tools: ["Google Ads", "Meta Ads Manager", "Google Analytics", "Google Tag Manager"],
    results: [
      "Google Ads: $2K–5K monthly budgets, 4–7% average CTR, $0.80–1.50 average CPC, 5–8% conversion rate.",
      "Meta Ads: $1.5K–3K monthly budgets, 2–3.5% average CTR, $0.30–0.70 average CPC, $3–8 cost per lead.",
    ],
    contribution: "I planned, built and optimized the campaigns, including targeting, copy, creative tests and tracking.",
    source: "Ad platform reporting. Typical ranges across freelance accounts.",
    coverWord: "Leads",
  },
];
