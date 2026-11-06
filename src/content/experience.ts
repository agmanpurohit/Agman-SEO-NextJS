/**
 * Career history, capabilities, tools, education and certifications.
 * Source: CV. Wording is rewritten for the web; meaning and facts are unchanged.
 */
export type Position = { title: string; start: string; end: string };

export type Role = {
  slug: string;
  company: string;
  descriptor: string;
  location?: string;
  kind: "employment" | "freelance";
  positions: Position[];
  summary: string;
  highlights: { value: string; label: string }[];
  points: string[];
  skills: string[];
};

/** Most recent first. */
export const roles: Role[] = [
  {
    slug: "ncs-gx",
    company: "NCS GX",
    descriptor: "Accounting & financial services",
    location: "Ahmedabad, India",
    kind: "employment",
    positions: [{ title: "SEO Executive", start: "May 2026", end: "Sep 2026" }],
    summary:
      "One domain, four audiences. I rebuilt the structure of a financial-services site serving the USA, Canada, Australia and a global market, and wrote for both Google and AI search.",
    highlights: [
      { value: "+191%", label: "Organic clicks, Canada" },
      { value: "30+", label: "Backlinks in month one" },
    ],
    points: [
      "Led a full website restructure: site architecture, internal linking and navigation, to improve crawlability and user experience.",
      "Implemented hreflang across country subdirectories (/us/, /ca/, /au/) on a single domain.",
      "Researched keywords and search intent for accounting topics, including crypto taxation and crypto accounting.",
      "Wrote SEO, GEO and AEO content with clear sourcing and accurate financial terminology.",
      "Ran off-page work across business listings, citations and white-hat link acquisition, securing 30+ quality backlinks in the first month.",
      "Built a custom WordPress plugin that adds page-specific JSON-LD schema.",
    ],
    skills: ["International SEO", "Hreflang", "GEO / AEO", "Link building", "Schema / JSON-LD", "WordPress"],
  },
  {
    slug: "medianv",
    company: "MediaNV",
    descriptor: "Digital marketing agency",
    location: "Ahmedabad, India",
    kind: "employment",
    positions: [{ title: "SEO Executive", start: "Apr 2025", end: "May 2026" }],
    summary:
      "Agency pace, agency scale. I ran end-to-end SEO for 25+ client websites at the same time, most of them dental and healthcare practices in the USA and Canada.",
    highlights: [
      { value: "+120%", label: "Organic traffic, ~3 months" },
      { value: "100+", label: "Dental sites SEO-ready" },
      { value: "25+", label: "Google Business Profiles" },
    ],
    points: [
      "Managed SEO for 25+ client websites in parallel, covering organic traffic, rankings and lead generation.",
      "Restructured site architecture and internal linking on a dental & healthcare site, which led to a 120% increase in organic traffic.",
      "Built on-page and technical SEO into 100+ dental websites during development, within six months, so each one launched ready to rank.",
      "Ran technical audits with SEMrush, Ahrefs, Screaming Frog, Search Console and Google Analytics to fix crawl, indexing and performance issues.",
      "Handled WooCommerce and ecommerce SEO: category and product pages, product schema, faceted navigation and duplicate content.",
      "Optimized 25+ Google Business Profiles for clients in the USA and Canada.",
      "Wrote a WordPress plugin that generates a custom sitemap. The agency still uses it.",
      "Mentored new team members on SEO, AI-assisted workflows and prompt engineering.",
    ],
    skills: ["Technical SEO", "Local SEO", "Ecommerce SEO", "Site architecture", "WordPress", "Team mentoring"],
  },
  {
    slug: "diya-infotech",
    company: "Diya Infotech",
    descriptor: "",
    location: "Ahmedabad, India",
    kind: "employment",
    positions: [
      { title: "SEO Executive", start: "Mar 2024", end: "Mar 2025" },
      { title: "Process Associate", start: "Apr 2023", end: "Mar 2024" },
    ],
    summary:
      "Where it started. I joined in process operations, then moved into the SEO team in March 2024 and learned the craft on live projects.",
    highlights: [],
    points: [
      "Carried out on-page, technical and off-page SEO to improve rankings and organic visibility.",
      "Optimized pages through keyword research, content updates, internal linking and schema markup.",
      "Managed social media accounts in support of SEO campaigns and brand visibility.",
      "Worked with developers, designers and writers to implement SEO correctly across projects.",
    ],
    skills: ["On-page SEO", "Keyword research", "Schema markup", "Social media"],
  },
];

/** Freelance work runs alongside employment. Dates and client industries are not published yet. */
export const freelance = {
  title: "Freelance",
  descriptor: "Independent projects, alongside employment",
  summary:
    "Outside my full-time roles I take on independent projects across SEO, website development and paid media, from campaign planning and audience targeting to creative testing and ongoing optimization.",
  services: ["SEO", "Website development", "Google Ads", "Meta Ads"],
  paid: [
    {
      platform: "Google Ads",
      scope: "Search, Display & Remarketing · lead generation and customer acquisition",
      metrics: [
        { value: "$2K–5K", label: "Monthly budgets" },
        { value: "4–7%", label: "Average CTR" },
        { value: "$0.80–1.50", label: "Average CPC" },
        { value: "5–8%", label: "Conversion rate" },
      ],
    },
    {
      platform: "Meta Ads",
      scope: "Facebook & Instagram · lead generation, traffic and brand awareness",
      metrics: [
        { value: "$1.5K–3K", label: "Monthly budgets" },
        { value: "2–3.5%", label: "Average CTR" },
        { value: "$0.30–0.70", label: "Average CPC" },
        { value: "$3–8", label: "Cost per lead" },
      ],
    },
  ],
};

export const capabilities = [
  {
    name: "Search Engine Optimization",
    outcome: "More qualified visitors from search, without paying for each click.",
    items: ["Technical SEO", "On-page", "Off-page", "Site architecture", "Ecommerce SEO", "International SEO"],
  },
  {
    name: "AI Search Optimization",
    outcome: "A brand that AI assistants can describe accurately and point people towards.",
    items: ["GEO", "AEO", "Entity clarity", "Structured data", "LLM-aware content"],
  },
  {
    name: "Local SEO",
    outcome: "Calls, visits and bookings from people searching nearby.",
    items: ["Google Business Profile", "Location pages", "Citations", "Local keyword research"],
  },
  {
    name: "Paid Advertising",
    outcome: "Leads on demand, with spend tied to measurable conversions.",
    items: ["Google Ads", "Meta Ads", "Audience targeting", "Creative testing", "Conversion tracking"],
  },
  {
    name: "Website Development",
    outcome: "Fast sites that are easy for search engines to read from the day they launch.",
    items: ["WordPress", "WooCommerce", "Custom plugins", "HTML", "CSS"],
  },
  {
    name: "Analytics & Reporting",
    outcome: "Decisions made on data, and reports a client can understand.",
    items: ["GA4", "Search Console", "Tag Manager", "Microsoft Clarity", "CRO", "Competitor analysis"],
  },
];

export const tools = [
  { name: "Google Analytics 4", group: "Analytics" },
  { name: "Google Search Console", group: "Analytics" },
  { name: "Google Tag Manager", group: "Analytics" },
  { name: "Microsoft Clarity", group: "Analytics" },
  { name: "Ahrefs", group: "SEO" },
  { name: "SEMrush", group: "SEO" },
  { name: "Screaming Frog", group: "SEO" },
  { name: "Google Business Profile", group: "SEO" },
  { name: "Google Ads", group: "Advertising" },
  { name: "Meta Ads Manager", group: "Advertising" },
  { name: "WordPress", group: "Build" },
  { name: "WooCommerce", group: "Build" },
  { name: "HTML & CSS", group: "Build" },
  { name: "ChatGPT", group: "AI" },
  { name: "Claude", group: "AI" },
  { name: "Gemini", group: "AI" },
  { name: "Perplexity", group: "AI" },
] as const;

export const education = {
  degree: "Bachelor of Computer Applications (BCA)",
  school: "Jai Narayan Vyas University, Jodhpur",
  years: "2017 – 2020",
};

export const certifications = [
  { name: "SEO Training Masterclass", issuer: "Udemy", date: "Feb 2025", group: "Marketing" },
  { name: "Full Stack Developer", issuer: "Grras Solutions (P) Ltd, Ahmedabad", date: "Jun 2023", group: "Technical background" },
  { name: "Certified Penetration Testing Expert", issuer: "Pristine InfoSolutions Pvt. Ltd.", date: "Apr 2022", group: "Technical background" },
  { name: "Certified Information Security & Ethical Hacking", issuer: "Pristine InfoSolutions Pvt. Ltd.", date: "Sep 2021", group: "Technical background" },
];
