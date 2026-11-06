/**
 * Home page copy. Every figure here is taken from the CV or from records Agman approved
 * for publication. Edit text freely; keep numbers tied to a real source.
 */
export const hero = {
  eyebrow: "SEO · GEO · AEO — Dubai, UAE",
  intro:
    "I'm an SEO and digital marketing specialist based in Dubai. I grow organic traffic, shape content that AI answer engines can understand and cite, and build the WordPress fixes myself instead of waiting in a dev queue.",
  primaryCta: { label: "See the work", href: "/work" },
  secondaryCta: { label: "Download CV" },
};

export const approach = {
  label: "The approach",
  statement:
    "Every website is read twice. Once by a person deciding whether to trust it, and once by a machine deciding whether to show it. I came to search through computer applications, full-stack development and ethical hacking, so I look at a site the way a crawler does: what it can reach, what it understands, and what it ignores. Today that machine isn't only Google. It's ChatGPT, Perplexity and Gemini too, and my job is to make sure all of them understand what a business does and who it's for.",
  principles: [
    {
      title: "Structure before content",
      body: "Architecture, internal links and schema are the parts visitors never see, and they decide what search engines understand. I fix those first.",
    },
    {
      title: "Built, not briefed",
      body: "When a fix needs code, I write it. I've built WordPress plugins for custom schema and sitemaps rather than leaving them on a developer's to-do list.",
    },
    {
      title: "Measured in outcomes",
      body: "Rankings are a means. The point is traffic that converts: enquiries, booked appointments and leads a sales team can actually call.",
    },
  ],
};

export type Discipline = {
  id: "search" | "ai" | "local" | "paid" | "build";
  index: string;
  title: string;
  kicker: string;
  body: string;
  items: string[];
  proof: string;
};

export const disciplines: Discipline[] = [
  {
    id: "search",
    index: "01",
    title: "Search & Organic Growth",
    kicker: "Technical · On-page · Off-page",
    body: "SEO that starts underneath the page: crawl paths, site architecture, internal linking and structured data, then content and authority on top. Built for traffic that compounds rather than spikes.",
    items: ["Technical SEO audits", "Site architecture", "Internal linking", "Schema markup", "Core Web Vitals", "International SEO & hreflang", "Ecommerce SEO", "Link building & digital PR"],
    proof: "+120% organic traffic in about three months for a dental & healthcare site.",
  },
  {
    id: "ai",
    index: "02",
    title: "AI Search Optimization",
    kicker: "GEO · AEO",
    body: "Search now ends in an answer as often as a link. I structure content and entities so generative engines and answer boxes can extract it, trust it and attribute it, without writing for robots at the expense of people.",
    items: ["Generative Engine Optimization", "Answer Engine Optimization", "Entity & topical clarity", "Structured data", "AI-assisted SEO workflows", "Prompt engineering"],
    proof: "Wrote SEO, GEO and AEO content for a multi-country finance site serving the USA, Canada and Australia.",
  },
  {
    id: "local",
    index: "03",
    title: "Local Search",
    kicker: "Google Business Profile · Location pages",
    body: "For clinics and service businesses, the map pack is the shop window. Complete profiles, location-intent pages and consistent citations turn nearby searches into calls, visits and bookings.",
    items: ["Google Business Profile optimization", "Local keyword research", "Location landing pages", "Citations & listings", "Review and profile hygiene"],
    proof: "25+ Google Business Profiles managed for businesses in the USA and Canada.",
  },
  {
    id: "paid",
    index: "04",
    title: "Paid Media",
    kicker: "Google Ads · Meta Ads",
    body: "Search, Display and Remarketing on Google; Facebook and Instagram on Meta. Campaigns are structured around lead generation, with conversion tracking in place before the first dollar is spent.",
    items: ["Search, Display & Remarketing", "Facebook & Instagram campaigns", "Audience targeting", "Ad copy & creative testing", "Negative keyword management", "Conversion tracking"],
    proof: "Freelance Google Ads accounts averaging 4–7% CTR and 5–8% conversion rate.",
  },
  {
    id: "build",
    index: "05",
    title: "Web Development",
    kicker: "WordPress · WooCommerce · Custom plugins",
    body: "Fast, responsive WordPress sites with SEO designed in before launch, not patched on afterwards. When an off-the-shelf plugin falls short, I write my own.",
    items: ["WordPress development", "WooCommerce", "Custom WordPress plugins", "HTML & CSS", "Responsive builds", "Site speed"],
    proof: "Built a custom sitemap plugin that is still in use at the agency where I wrote it.",
  },
];

/** Verified achievements. Context lines say where each number comes from. */
export const signals = [
  { value: 120, prefix: "+", suffix: "%", label: "Organic traffic growth", context: "Dental & healthcare site, in about three months" },
  { value: 191, prefix: "+", suffix: "%", label: "Organic clicks, Canada market", context: "Multi-country financial services site, quarter on quarter" },
  { value: 100, prefix: "", suffix: "+", label: "Dental websites made SEO-ready", context: "Before launch, within six months" },
  { value: 25, prefix: "", suffix: "+", label: "Client websites at once", context: "End-to-end SEO at a digital agency" },
  { value: 25, prefix: "", suffix: "+", label: "Google Business Profiles", context: "Optimized for clients in the USA and Canada" },
  { value: 30, prefix: "", suffix: "+", label: "Quality backlinks", context: "Earned in the first month on a new domain" },
];

export const closing = {
  label: "Next step",
  headline: ["Need someone who can", "rank it and build it?"],
  body: "I'm looking for a full-time SEO or digital marketing role in Dubai or anywhere in the UAE, and I can start immediately. I also take on a small number of freelance SEO, web and paid media projects.",
  primary: { label: "Let's talk", href: "/contact" },
};
