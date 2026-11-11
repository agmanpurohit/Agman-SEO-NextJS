/**
 * Service pages for Indian businesses (/india/…). Written in Agman's voice.
 * Every number comes from the CV or published case studies (src/content/work.ts) and is
 * labelled with where it came from. Most of that work was for clients in the USA, Canada
 * and Australia, delivered from Ahmedabad, and the copy says so plainly.
 * Links use [label](/path) and are rendered as internal links.
 */
import type { MarketCopy } from "./index";

const P = "/india";

export const india: MarketCopy = {
  hub: {
    metaTitle: "SEO & Digital Marketing Services in India",
    metaDescription:
      "SEO, local SEO, GEO, AEO, Google Ads, Meta Ads and websites for Indian businesses, from a specialist with three years of hands-on SEO in Ahmedabad.",
    socialTitle: "SEO and digital marketing services for Indian businesses",
    h1: "SEO & Digital Marketing Services in India",
    lead: "I help Indian businesses get found on Google, Google Maps and in AI answers, then turn that attention into enquiries. One specialist, one point of contact, and the technical work done myself.",
    answer: {
      q: "What SEO and digital marketing services do you offer in India?",
      a: "I offer SEO, technical SEO, local SEO, generative engine optimization (GEO), answer engine optimization (AEO), Google Ads, Meta Ads and SEO-friendly WordPress development for Indian businesses. I worked in SEO in Ahmedabad from 2023 to 2026 and now work with clients across India remotely from Dubai.",
    },
    keywords: {
      primary: "SEO and digital marketing services in India",
      secondary: ["freelance SEO specialist India", "digital marketing consultant India", "hire SEO expert India", "SEO services for small business India", "SEO consultant Ahmedabad"],
    },
    why: [
      { t: "I've worked in the Indian market", d: "Three years in Ahmedabad, at an IT company, a digital agency and a finance firm. I know how Indian agencies work, and where the shortcuts usually get taken." },
      { t: "One person does the work", d: "No account manager passing notes to a junior. The person who audits your site is the person who fixes it, writes the plugin and reports back." },
      { t: "Search, AI and ads in one plan", d: "SEO, Google Maps, AI answers and paid ads affect each other. I plan them together so you don't pay three vendors to compete with each other." },
      { t: "Numbers you can check", d: "Every result on this site comes from Search Console, GA4 or client records, with screenshots on the [work page](/work). No made-up percentages." },
    ],
    faq: [
      { q: "Do you work with businesses anywhere in India?", a: "Yes. I work remotely with businesses across India, including Ahmedabad, Mumbai, Delhi NCR, Bengaluru, Pune, Hyderabad, Chennai and Jaipur. Calls happen on Google Meet or WhatsApp at times that suit Indian working hours." },
      { q: "Are you an agency?", a: "No. I'm an independent SEO and digital marketing specialist. You deal with me directly, and I do the work myself, including the technical and WordPress side." },
      { q: "Which service should I start with?", a: "If you rely on walk-ins or calls from your city, start with [local SEO](/india/local-seo). If your website gets little traffic, start with an [SEO audit](/seo-audit) and [technical SEO](/india/technical-seo). If you need leads this month, [Google Ads](/india/google-ads) runs alongside SEO while it builds." },
      { q: "How do you price your work?", a: "Pricing depends on the size of the site, the competition and what you need done. After a short call and a look at your website, I send a written scope with a fixed monthly or project fee. There are no long lock-in contracts." },
      { q: "Can I see results from your past work?", a: "Yes. The [work page](/work) has case studies with Search Console and GA4 screenshots, including +120% organic traffic for a dental site in about three months and a clinic that reached the top of Google's local pack." },
    ],
  },

  services: {
    "seo-specialist": {
      slug: "seo-specialist",
      metaTitle: "Freelance SEO Specialist in India",
      metaDescription:
        "Hire a freelance SEO specialist for your Indian business: audits, technical fixes, content and links by one person, with results you can verify.",
      socialTitle: "A freelance SEO specialist for Indian businesses",
      h1: "SEO Specialist in India",
      lead: "Hands-on SEO for Indian businesses that want more enquiries from Google, not just a monthly PDF. I audit, fix, write and build the links myself.",
      answer: {
        q: "What does an SEO specialist do?",
        a: "An SEO specialist makes a website easier for search engines to crawl, understand and rank. That means fixing technical problems, improving page content and structure, building internal and external links, and tracking results in Google Search Console and GA4 so the work is tied to traffic and enquiries.",
      },
      keywords: {
        primary: "SEO specialist in India",
        secondary: ["freelance SEO specialist India", "hire SEO expert India", "SEO consultant India", "SEO expert for small business", "affordable SEO services India"],
      },
      context: {
        heading: "Why most SEO in India doesn't move the needle",
        paragraphs: [
          "A lot of SEO sold in India is a package: a fixed number of backlinks, a few blog posts and a report full of rankings for keywords nobody searches. It looks busy, but it rarely touches the reasons a site isn't ranking. Those reasons are usually structural: pages Google can't reach, thin category pages, duplicate URLs, slow mobile pages, or titles that don't match what people type.",
          "Indian search behaviour adds its own layer. Most searches happen on a phone, often mixing English with Hindi or a regional language, and many are local (“near me”, a neighbourhood, a city). A page written for a generic global audience misses most of that. I plan keywords around how your customers actually search, then build pages that answer those searches properly.",
          "I spent three years doing SEO from Ahmedabad, for agency clients and in-house, before moving to Dubai. If you want to see the kind of work I do before we talk, run a [free SEO audit](/seo-audit) of your site, or read the [case studies](/work).",
        ],
      },
      includes: {
        heading: "What's included",
        items: [
          { t: "Full SEO audit", d: "Crawl, indexing, speed, mobile, content and links, with every issue ranked by how much it matters." },
          { t: "Keyword and intent research", d: "The searches your customers make, grouped by intent, including mixed-language and local variations." },
          { t: "On-page optimization", d: "Titles, meta descriptions, headings, content gaps and internal links on the pages that bring in money." },
          { t: "Technical fixes", d: "Redirects, canonicals, sitemaps, robots.txt, Core Web Vitals and schema, fixed on the site, not listed in a report. See [technical SEO](/india/technical-seo)." },
          { t: "Content plan", d: "Service pages, location pages and articles mapped to keywords, so every page has one clear job." },
          { t: "Link building", d: "White-hat links from relevant Indian and industry sites, business listings and digital PR. No link farms." },
          { t: "AI search readiness", d: "Content and structured data that ChatGPT, Gemini and Google AI Overviews can understand. See [GEO](/india/geo-specialist)." },
          { t: "Monthly reporting", d: "Search Console and GA4 numbers in plain language: what changed, why, and what's next." },
        ],
      },
      process: [
        { t: "Audit and baseline", d: "I crawl the site, read Search Console and GA4, and record where you stand today so progress is measurable." },
        { t: "Fix the foundations", d: "Technical and structural problems come first, because content can't rank on a site Google struggles to read." },
        { t: "Build pages that rank", d: "Improve the pages you have, create the ones you're missing, and link them together sensibly." },
        { t: "Earn authority and report", d: "Links, listings and mentions build trust, and a monthly report shows what's working." },
      ],
      proof: {
        heading: "Results from my SEO work",
        intro: "These numbers come from client projects I worked on from Ahmedabad, mostly for businesses in the USA, Canada and Australia.",
        points: [
          { value: "+120%", label: "Organic traffic", context: "Dental and healthcare site, in about three months, after restructuring site architecture and internal links." },
          { value: "+191%", label: "Organic clicks, Canada", context: "Multi-country finance site, quarter on quarter, after a full restructure and hreflang." },
          { value: "25+", label: "Client websites at once", context: "End-to-end SEO at a digital agency in Ahmedabad." },
        ],
      },
      fit: {
        heading: "Who this is for",
        items: ["Clinics, dentists and healthcare practices", "Professional services: CA firms, lawyers, consultants", "Ecommerce and WooCommerce stores", "B2B manufacturers and exporters", "Local service businesses", "Startups that need organic growth, not just ads"],
      },
      faq: [
        { q: "How long does SEO take to show results?", a: "Most sites see early movement in four to eight weeks once technical issues are fixed, and steady growth over three to six months. Competitive keywords in big cities can take longer. I show progress monthly in Search Console so you're never guessing." },
        { q: "Do you guarantee first-page rankings?", a: "No, and be careful with anyone who does. Nobody controls Google's rankings. What I can promise is honest work on the things that move rankings, and clear reporting on what changed." },
        { q: "What's the difference between hiring you and an SEO agency?", a: "With an agency you usually talk to an account manager while juniors do the work. With me, the person you talk to does the audit, the fixes, the content plan and the reporting. That keeps things fast and accountable." },
        { q: "Can you do SEO for a website in Hindi or a regional language?", a: "I can handle the technical side, structure, hreflang and keyword research for Hindi and other Indian-language sites. For writing content in those languages, I work with your writer or a native speaker and review it for SEO." },
        { q: "Do you also handle Google Maps and local searches?", a: "Yes. If your customers come from your city, [local SEO](/india/local-seo) and Google Business Profile work usually give the fastest return, and I often run it alongside wider SEO." },
      ],
    },

    "digital-marketing": {
      slug: "digital-marketing",
      metaTitle: "Digital Marketing Services in India",
      metaDescription:
        "Digital marketing for Indian businesses: SEO, Google Maps, Google Ads, Meta Ads and AI search planned as one strategy, by a consultant who does the work.",
      socialTitle: "Digital marketing for Indian businesses, planned as one strategy",
      h1: "Digital Marketing Services in India",
      lead: "SEO, local search, Google Ads, Meta Ads and AI search, planned together around one goal: more enquiries for your business, at a cost per lead you're happy with.",
      answer: {
        q: "What is included in digital marketing services?",
        a: "Digital marketing services usually cover search engine optimization (SEO), local SEO and Google Business Profile, paid ads on Google and Meta (Facebook and Instagram), content, and analytics. A good plan decides which channels to use first based on your goal, budget and how your customers search, then tracks every enquiry back to its source.",
      },
      keywords: {
        primary: "digital marketing services in India",
        secondary: ["digital marketing consultant India", "freelance digital marketer India", "online marketing for small business India", "performance marketing India", "lead generation services India"],
      },
      context: {
        heading: "Fewer channels, done properly",
        paragraphs: [
          "Most small and mid-sized Indian businesses I've seen try a bit of everything: a social media agency, a separate SEO vendor, someone boosting posts, and nobody checking which of it brings in customers. The channels end up competing for the same budget and nobody owns the result.",
          "I start from the other end. What does a good lead look like for you, what's it worth, and where are those people searching? For a clinic in Ahmedabad that's usually Google Maps and search. For a D2C brand it might be Instagram first and SEO second. For a B2B exporter it's often Google Search and content that answers buyers' technical questions.",
          "Then I set up tracking in GA4 and Tag Manager before spending on anything, so every channel is judged on enquiries, not likes or impressions. The individual services are described on their own pages: [SEO](/india/seo-specialist), [local SEO](/india/local-seo), [Google Ads](/india/google-ads), [Meta Ads](/india/meta-ads) and [AI search (GEO)](/india/geo-specialist).",
        ],
      },
      includes: {
        heading: "What's included",
        items: [
          { t: "Channel strategy", d: "Which channels to use, in what order and with what budget, based on your goal and margins." },
          { t: "Tracking setup", d: "GA4, Google Tag Manager, conversion events and call and WhatsApp click tracking, done before launch." },
          { t: "SEO and content", d: "Organic visibility that keeps working after the ad budget stops." },
          { t: "Local search", d: "Google Business Profile, reviews and location pages for businesses that serve a city or area." },
          { t: "Paid campaigns", d: "Google Ads and Meta Ads for demand you need now, with spend tied to leads." },
          { t: "Landing pages", d: "Fast pages built to convert, on your WordPress site or a new one. See [web development](/india/web-development)." },
          { t: "Monthly review", d: "One report across all channels: what each one cost, what it brought in, and what changes next month." },
        ],
      },
      process: [
        { t: "Goal and numbers", d: "We agree what a lead is worth and what a good month looks like." },
        { t: "Tracking first", d: "Analytics and conversion tracking go live before any campaign does." },
        { t: "Launch the right mix", d: "Quick wins (ads, Google Maps) alongside slower compounding work (SEO, content)." },
        { t: "Shift budget to what works", d: "Each month, money moves towards the channels bringing in enquiries." },
      ],
      proof: {
        heading: "Results across channels",
        intro: "From client projects I've worked on, mostly for businesses in the USA and Canada.",
        points: [
          { value: "1.09M", label: "Search impressions", context: "Multi-location dental group, with organic search becoming the group's leading channel." },
          { value: "5–8%", label: "Google Ads conversion rate", context: "Average across my freelance lead-generation accounts." },
          { value: "$3–8", label: "Meta Ads cost per lead", context: "Average across freelance Facebook and Instagram lead campaigns." },
        ],
      },
      fit: {
        heading: "Who this is for",
        items: ["Small businesses that need one person to plan it all", "Clinics and healthcare providers", "Ecommerce and D2C brands", "Real estate and education businesses", "B2B companies selling to India or abroad", "Founders tired of agencies that report likes instead of leads"],
      },
      faq: [
        { q: "What should a small business in India spend on digital marketing?", a: "It depends on your margins and how fast you need leads. SEO and local SEO are a fixed monthly effort with no per-click cost. Paid ads need a separate media budget, and I usually suggest starting small, proving the cost per lead, then scaling what works." },
        { q: "Do you manage social media posting?", a: "I focus on channels that bring enquiries: search, Google Maps, paid ads and AI search. I don't run daily organic posting, but I run Meta Ads and can work alongside whoever manages your social accounts." },
        { q: "Is SEO or Google Ads better for a new business?", a: "Usually both, for different reasons. [Google Ads](/india/google-ads) brings enquiries from week one while [SEO](/india/seo-specialist) builds traffic you don't pay for per click. As organic grows, ad spend can come down." },
        { q: "Will I own my accounts and data?", a: "Always. Your Google Ads, Meta, GA4, Search Console and Business Profile accounts stay in your name. I'm added as a manager and can be removed any time." },
        { q: "How do you report results?", a: "Once a month, in plain language: leads by channel, cost per lead, what changed and what I'm doing next. You can also see live numbers in GA4 whenever you want." },
      ],
    },

    "technical-seo": {
      slug: "technical-seo",
      metaTitle: "Technical SEO Services in India",
      metaDescription:
        "Technical SEO for Indian websites: crawling, indexing, Core Web Vitals, site structure, redirects and schema, audited and fixed on your site, not just reported.",
      socialTitle: "Technical SEO audits and fixes for Indian websites",
      h1: "Technical SEO Services in India",
      lead: "If Google can't crawl, render or understand your site, nothing else in SEO works. I find those problems and fix them on the site, including the code.",
      answer: {
        q: "What is technical SEO?",
        a: "Technical SEO is the work that helps search engines crawl, render, index and understand a website. It covers site structure and internal links, robots.txt and XML sitemaps, redirects and canonical tags, page speed and Core Web Vitals, mobile usability, duplicate content and structured data (schema markup).",
      },
      keywords: {
        primary: "technical SEO services in India",
        secondary: ["technical SEO audit", "technical SEO consultant India", "website crawling and indexing issues", "Core Web Vitals optimization", "schema markup services"],
      },
      context: {
        heading: "The problems nobody sees until traffic drops",
        paragraphs: [
          "Technical issues are invisible to visitors, which is why they last for years. A WordPress theme that creates five URLs for every product. A staging site that got indexed. Filters that generate thousands of thin pages. A migration that lost its redirects. Each one quietly wastes crawl budget or splits your rankings.",
          "Indian sites have a few common patterns: heavy page builders and sliders that are slow on budget phones, cheap shared hosting with slow server response, plugins stacked on top of each other, and ecommerce filters that Google crawls endlessly. These show up clearly in a crawl and in Core Web Vitals data.",
          "I come from computer applications and full-stack development, so I don't stop at listing issues. I fix redirects, templates, schema and sitemaps myself, and when WordPress needs something a plugin can't do, I write the plugin. You can check your own site first with the [free SEO audit](/seo-audit), or generate a clean [robots.txt](/free-seo-tools/robots-txt-generator) and [XML sitemap](/free-seo-tools/sitemap-generator).",
        ],
      },
      includes: {
        heading: "What's included",
        items: [
          { t: "Crawl and indexing audit", d: "Screaming Frog crawl compared with Search Console's index report, to find pages Google ignores or shouldn't see." },
          { t: "Site architecture", d: "Category structure, URL patterns and internal links reorganised so important pages are close to the homepage." },
          { t: "Redirects and canonicals", d: "Broken links, redirect chains, duplicate URLs and canonical conflicts cleaned up." },
          { t: "Core Web Vitals", d: "LCP, INP and CLS improved for real mobile users: images, scripts, fonts and caching." },
          { t: "robots.txt and XML sitemaps", d: "Crawlers pointed at the right pages, with clean sitemaps that only list indexable URLs." },
          { t: "Structured data", d: "Organization, LocalBusiness, Product, Article, FAQ and Breadcrumb schema, validated and error-free." },
          { t: "International and multilingual", d: "Hreflang for country or language versions, like /in/ and /ae/ or English and Hindi." },
          { t: "Migration support", d: "Redirect maps and checks before and after a redesign or platform change, so rankings survive the move." },
        ],
      },
      process: [
        { t: "Crawl and measure", d: "Full crawl, Search Console, server logs where available, and Core Web Vitals field data." },
        { t: "Prioritise", d: "Every issue gets an impact and an effort score, so the fixes that matter most go first." },
        { t: "Fix on the site", d: "I implement the changes directly, or work with your developer with exact instructions." },
        { t: "Verify", d: "Re-crawl, request indexing and watch Search Console until the fixes show up in Google's data." },
      ],
      proof: {
        heading: "Results from technical work",
        intro: "From projects I worked on from Ahmedabad, for clients in the USA, Canada and Australia.",
        points: [
          { value: "+58%", label: "New users", context: "Automotive parts ecommerce store, after rebuilding a large catalogue around crawlability." },
          { value: "+191%", label: "Organic clicks, Canada", context: "Finance site with /us/, /ca/ and /au/ folders, after a restructure and hreflang." },
          { value: "100+", label: "Sites SEO-ready before launch", context: "Dental websites built with technical SEO in place, within six months." },
        ],
      },
      fit: {
        heading: "Who this is for",
        items: ["Ecommerce stores with large catalogues", "Sites that lost traffic after a redesign or migration", "WordPress sites slowed down by plugins and builders", "Multi-language or multi-country sites", "Businesses with pages that won't get indexed", "Developers who want an SEO second opinion"],
      },
      faq: [
        { q: "How long does a technical SEO audit take?", a: "For most business websites, about a week. Very large ecommerce sites take longer. You get a prioritised list of issues with clear fixes, not a 200-page export." },
        { q: "Can you fix the issues, or just report them?", a: "I fix them. Redirects, templates, schema, sitemaps, robots.txt, speed and WordPress changes are part of the service. If you have an in-house developer, I give them exact tickets instead." },
        { q: "Why are my pages “crawled but not indexed”?", a: "Usually because Google sees them as low value or duplicate: thin content, near-identical pages, weak internal links or conflicting canonicals. The fix depends on which, and that's exactly what the audit finds." },
        { q: "Does page speed really affect rankings?", a: "Core Web Vitals are a ranking signal, but a modest one. The bigger effect is on people: slow pages on mobile data lose visitors before they see your offer. Fixing speed helps both." },
        { q: "Do you work on Shopify and custom sites, or only WordPress?", a: "WordPress and WooCommerce are my strongest platforms, and I also audit Shopify and custom-built sites. For custom code I work with your developers on implementation." },
      ],
    },

    "local-seo": {
      slug: "local-seo",
      metaTitle: "Local SEO Services in India",
      metaDescription:
        "Local SEO for Indian businesses: Google Business Profile, Google Maps ranking, reviews, citations and location pages that turn nearby searches into calls.",
      socialTitle: "Local SEO and Google Maps ranking for Indian businesses",
      h1: "Local SEO Services in India",
      lead: "When someone in your city searches for what you do, your business should be in the map results with good reviews and a phone number one tap away.",
      answer: {
        q: "What is local SEO?",
        a: "Local SEO is the work that helps a business appear in Google Maps and local search results for people nearby. It includes optimizing the Google Business Profile, getting and replying to reviews, keeping the business name, address and phone number consistent across listings, building location pages on the website, and adding LocalBusiness schema.",
      },
      keywords: {
        primary: "local SEO services in India",
        secondary: ["Google Business Profile optimization India", "Google Maps ranking", "local SEO for clinics", "near me SEO", "Google My Business expert India"],
      },
      context: {
        heading: "The map pack is where local customers decide",
        paragraphs: [
          "For a clinic, salon, coaching centre, showroom or restaurant, most new customers now start on Google Maps. They search “dentist near me” or “physiotherapist in Satellite Ahmedabad”, look at the three businesses Google shows on the map, check the stars and photos, and call one. If you're not in those three, you're mostly invisible.",
          "In Indian cities the competition is dense and messy: duplicate listings, keyword-stuffed business names, fake reviews and listings with the wrong pin. Doing it properly still works. That means a complete Business Profile, the right categories, real photos, a steady flow of genuine reviews, consistent details on directories like Justdial and IndiaMART, and a website with a proper page for each location you serve.",
          "I've optimized more than 25 Google Business Profiles and helped a dental clinic reach the top of the local pack for a high-volume keyword. You can read that [local pack case study](/work?case=dental-clinic-local-pack). If you have several branches, location pages and [LocalBusiness schema](/free-seo-tools/schema-markup-generator) matter even more.",
        ],
      },
      includes: {
        heading: "What's included",
        items: [
          { t: "Google Business Profile optimization", d: "Categories, services, description, hours, photos, products, Q&A and posts, set up the way Google expects." },
          { t: "Local keyword research", d: "How people in your area search, including neighbourhood names, “near me” and mixed-language queries." },
          { t: "Location pages", d: "A strong page for each area or branch, with real local detail, not copy-paste pages with the city name swapped." },
          { t: "Citations and listings", d: "Consistent name, address and phone on Justdial, IndiaMART, Sulekha, Bing Places, Apple Maps and industry directories." },
          { t: "Review strategy", d: "A simple system to ask happy customers for reviews, and templates for replying to every one." },
          { t: "LocalBusiness schema", d: "Structured data that confirms your address, hours, phone and map location to search engines." },
          { t: "Tracking calls and directions", d: "Profile insights and GA4 events, so you see how many calls, WhatsApp messages and direction requests come in." },
        ],
      },
      process: [
        { t: "Local audit", d: "Your profile, competitors in the map pack, citations and reviews, compared side by side." },
        { t: "Fix the profile and site", d: "Business Profile, location pages and schema updated in the first weeks." },
        { t: "Build local signals", d: "Citations, reviews and local links, added steadily rather than all at once." },
        { t: "Track the phone ringing", d: "Calls, directions and website visits reported monthly." },
      ],
      proof: {
        heading: "Results from local SEO work",
        intro: "From clinics and local businesses I worked with from Ahmedabad, mostly in Canada and the USA.",
        points: [
          { value: "+140%", label: "New patient appointments", context: "Dental clinic that went from near-invisible to first in the local pack within three months." },
          { value: "+124%", label: "Traffic in month one", context: "Medical aesthetics clinic, with new client appointments up 84% by month three." },
          { value: "25+", label: "Business Profiles optimized", context: "For clinics and service businesses at a digital agency." },
        ],
      },
      fit: {
        heading: "Who this is for",
        items: ["Dentists, clinics and hospitals", "Salons, spas and gyms", "Coaching centres and schools", "Restaurants and cafés", "Showrooms and retail stores", "Multi-branch businesses across Indian cities"],
      },
      faq: [
        { q: "How long does it take to rank on Google Maps?", a: "Profile fixes can show results within a few weeks. Reaching the top three in a competitive area usually takes two to four months of steady work on reviews, citations and your website." },
        { q: "Do I need a website for local SEO?", a: "You can rank on Maps without one, but a website with a strong page for your location makes it much easier and gives Google more reasons to trust you. If you don't have one, I can [build one](/india/web-development)." },
        { q: "Can you remove fake negative reviews?", a: "Only Google can remove reviews, and only if they break its policies. I help you report the ones that do, and reply professionally to the rest. Over time, a steady flow of genuine reviews matters more than any single bad one." },
        { q: "Should I add keywords to my business name on Google?", a: "No. Stuffing keywords into the name breaks Google's guidelines and can get the profile suspended. Use your real business name and put keywords where they belong: categories, services and your website." },
        { q: "Do you handle businesses with several branches?", a: "Yes. Each branch gets its own Business Profile, its own location page and consistent citations, all managed together." },
      ],
    },

    "geo-specialist": {
      slug: "geo-specialist",
      metaTitle: "GEO Specialist in India for AI Search",
      metaDescription:
        "Generative engine optimization for Indian businesses. Get your brand understood, mentioned and cited in ChatGPT, Gemini, Perplexity and Google AI Overviews.",
      socialTitle: "Get your business cited in ChatGPT, Gemini and AI Overviews",
      h1: "GEO Specialist in India",
      lead: "People now ask ChatGPT, Gemini and Google's AI Overviews which business to choose. Generative engine optimization makes sure those answers know who you are and point to you.",
      answer: {
        q: "What is generative engine optimization (GEO)?",
        a: "Generative engine optimization (GEO) is the practice of making a business easy for AI tools like ChatGPT, Google Gemini, Perplexity and Google AI Overviews to understand, trust and cite. It combines clear, factual content, consistent information about the business across the web, structured data, and pages that answer real questions directly.",
      },
      keywords: {
        primary: "GEO specialist India",
        secondary: ["generative engine optimization", "AI search optimization India", "how to rank in ChatGPT", "Google AI Overviews optimization", "LLM SEO"],
      },
      context: {
        heading: "AI answers are the new first page",
        paragraphs: [
          "When someone asks an AI assistant “best CA firm in Ahmedabad for startups” or “which CRM suits a small Indian business”, they don't get ten blue links. They get a short answer that names a few businesses and sometimes cites sources. If your business isn't in that answer, the conversation is over before it reaches your website.",
          "AI tools build those answers from what they can read and trust: your own website, your Google Business Profile, directories, reviews, news mentions, and forums like Reddit and Quora. GEO is about making all of that clear and consistent, so the models describe you correctly and have good reasons to mention you.",
          "I wrote SEO, GEO and AEO content for a finance website serving four countries. Its impressions on Google's AI search features grew from 6,450 to 48,300 in a quarter (see the [case study](/work?case=multi-market-financial-services)). GEO works best on top of solid [SEO](/india/seo-specialist) and [answer engine optimization](/india/answer-engine-optimization), which is why I plan them together.",
        ],
      },
      includes: {
        heading: "What's included",
        items: [
          { t: "AI visibility check", d: "What ChatGPT, Gemini, Perplexity and AI Overviews currently say about you and your competitors, for the questions your buyers ask." },
          { t: "Entity clarity", d: "Your business name, services, locations and people described consistently across your site, Google and key directories." },
          { t: "Answer-first content", d: "Pages that state facts clearly, answer questions in the first lines and back claims with sources." },
          { t: "Structured data", d: "Organization, Person, Service, FAQ and LocalBusiness schema, so machines don't have to guess." },
          { t: "Citation building", d: "Mentions on the sites AI tools rely on: industry directories, reviews, news and community answers." },
          { t: "Crawler access", d: "robots.txt set so AI search crawlers can read your site. Use the [robots.txt generator](/free-seo-tools/robots-txt-generator) to check yours." },
          { t: "Monthly AI tracking", d: "The same set of prompts checked every month, so you can see whether you're being mentioned more." },
        ],
      },
      process: [
        { t: "Ask the machines", d: "Run the questions your customers ask through the main AI tools and record who gets named." },
        { t: "Fix the facts", d: "Make your website and listings say the same clear things about who you are and what you do." },
        { t: "Publish what AI quotes", d: "Answer-first pages, comparisons and FAQs that are easy to extract and attribute." },
        { t: "Earn mentions", d: "Get your business discussed on the sources AI tools read, then re-check the answers." },
      ],
      proof: {
        heading: "Results from AI search work",
        intro: "From a finance website I worked on from Ahmedabad, serving the USA, Canada, Australia and a global audience.",
        points: [
          { value: "7.5×", label: "AI feature impressions", context: "Global impressions on Google's AI search features, 6,450 to 48,300 in a quarter." },
          { value: "23.3K", label: "AI impressions, Canada", context: "Up from 3,660 in the previous quarter." },
          { value: "+191%", label: "Organic clicks, Canada", context: "Over the same period, from the same content and restructure." },
        ],
      },
      fit: {
        heading: "Who this is for",
        items: ["Professional services firms: CA, legal, consulting", "SaaS and tech companies", "Healthcare providers and clinics", "Education and coaching brands", "Ecommerce brands in competitive categories", "Anyone whose buyers research before they call"],
      },
      faq: [
        { q: "Is GEO different from SEO?", a: "It builds on SEO. SEO gets your pages ranked; GEO makes sure AI tools understand your business and choose to mention or cite it in their answers. Most of the groundwork overlaps, but GEO puts more weight on clear facts, consistency across the web and third-party mentions." },
        { q: "Can you guarantee my business will appear in ChatGPT?", a: "No one can. AI answers change with every model update and every question. What I can do is make your business the clearest, best-supported option, and track how often it gets mentioned month by month." },
        { q: "Should I block AI crawlers from my website?", a: "Usually not if you want AI visibility. Blocking AI search crawlers like OAI-SearchBot or PerplexityBot stops those tools from citing you. Some businesses block training crawlers but allow search crawlers; I'll help you choose." },
        { q: "How do I know if AI tools mention my business?", a: "I track a fixed set of questions across ChatGPT, Gemini, Perplexity and Google AI Overviews every month and report which brands get named. Search Console also shows impressions from AI features for some sites." },
        { q: "Does GEO work for local businesses?", a: "Yes. AI tools lean heavily on Google Business Profile, reviews and directories for local questions, so [local SEO](/india/local-seo) and GEO support each other." },
      ],
    },

    "answer-engine-optimization": {
      slug: "answer-engine-optimization",
      metaTitle: "Answer Engine Optimization (AEO) India",
      metaDescription:
        "AEO services for Indian businesses: content shaped to win featured snippets, People Also Ask, voice search and AI answers, with FAQ and HowTo structured data.",
      socialTitle: "Answer engine optimization for featured snippets and voice search",
      h1: "Answer Engine Optimization (AEO) Services in India",
      lead: "Win the answer, not just a ranking. AEO shapes your content so Google, voice assistants and AI tools can lift a clear answer from your page and credit you for it.",
      answer: {
        q: "What is answer engine optimization (AEO)?",
        a: "Answer engine optimization (AEO) is the practice of structuring content so search engines, voice assistants and AI tools can pull a direct answer from it. It focuses on clear question-and-answer formatting, concise definitions, lists and tables, FAQ and HowTo structured data, and covering the follow-up questions people ask.",
      },
      keywords: {
        primary: "answer engine optimization services India",
        secondary: ["AEO services", "featured snippet optimization", "voice search optimization India", "People Also Ask optimization", "FAQ schema"],
      },
      context: {
        heading: "Search is turning into questions and answers",
        paragraphs: [
          "A growing share of searches end without a click on a normal result. People read the featured snippet, expand a People Also Ask box, hear an answer from Google Assistant, or get a summary in AI Overviews. In India, voice search in English, Hindi and Hinglish makes this even more common on phones.",
          "Those answers come from pages that make the answer easy to find: a question as a heading, a direct reply in the first sentence or two, then the detail. Steps as numbered lists, comparisons as tables, definitions in plain words. Most business websites bury the answer in the fourth paragraph, so Google takes it from someone else.",
          "AEO is how I write and restructure content anyway. You can see it on this site: every service page opens with a direct answer, and every page has a short FAQ with matching [FAQ schema](/free-seo-tools/schema-markup-generator). It works hand in hand with [GEO](/india/geo-specialist) for AI tools and with classic [SEO](/india/seo-specialist).",
        ],
      },
      includes: {
        heading: "What's included",
        items: [
          { t: "Question research", d: "The real questions your customers ask, from People Also Ask, Search Console, forums and sales calls." },
          { t: "Snippet-ready content", d: "Pages restructured so each question has a clear heading and a direct, quotable answer." },
          { t: "Lists, steps and tables", d: "Processes, comparisons and pricing factors formatted the way Google likes to show them." },
          { t: "FAQ sections", d: "Useful FAQs on key pages, written for people first, with FAQPage schema." },
          { t: "Voice search", d: "Conversational phrasing and short answers that read well aloud, including Hinglish query patterns." },
          { t: "Structured data", d: "FAQ, HowTo, Article and Breadcrumb schema validated in Google's Rich Results Test." },
          { t: "Snippet tracking", d: "Which featured snippets and PAA boxes you win or lose each month." },
        ],
      },
      process: [
        { t: "Find the questions", d: "Map the questions behind your keywords and who currently owns each answer." },
        { t: "Rewrite for answers", d: "Restructure existing pages before writing new ones, since that's usually faster." },
        { t: "Mark it up", d: "Add and validate the right structured data for each page type." },
        { t: "Track and refine", d: "Watch snippet wins in Search Console and tighten answers that lose out." },
      ],
      proof: {
        heading: "Results from content and structure work",
        intro: "From client projects I worked on from Ahmedabad, mostly for businesses in the USA and Canada.",
        points: [
          { value: "1.09M", label: "Search impressions", context: "Multi-location dental group, using topical clusters and structured on-page optimization." },
          { value: "23 → 10.8", label: "Average position", context: "Same dental group, as answers and topic coverage improved." },
          { value: "7.5×", label: "AI feature impressions", context: "Finance site, after content was rewritten answer-first." },
        ],
      },
      fit: {
        heading: "Who this is for",
        items: ["Clinics answering patient questions", "Finance, tax and legal advisors", "Education and coaching providers", "SaaS and software companies", "Ecommerce brands with buying-guide content", "Publishers and blogs"],
      },
      faq: [
        { q: "What's the difference between AEO and SEO?", a: "SEO aims to rank a page. AEO aims to have your page supply the answer itself: in a featured snippet, a People Also Ask box, a voice reply or an AI summary. AEO is a layer on top of SEO, not a replacement." },
        { q: "Do featured snippets still bring clicks?", a: "Fewer than before for simple facts, but they build trust and often win clicks for anything that needs more detail. For many business queries, being the quoted answer is also what gets you named in AI responses." },
        { q: "Does FAQ schema still help?", a: "Google now shows FAQ rich results mainly for government and health sites, so the expandable questions rarely appear. The schema still helps search engines and AI tools understand your content, and the visible FAQs help visitors." },
        { q: "How do you optimize for voice search in India?", a: "By answering questions in short, natural sentences, covering the conversational and mixed-language ways people ask, and making sure your local details are correct for “near me” voice queries." },
        { q: "Can you do AEO on my existing blog?", a: "Yes, and that's usually the best place to start. Restructuring articles that already rank on page one or two often wins snippets faster than writing new posts." },
      ],
    },

    "google-ads": {
      slug: "google-ads",
      metaTitle: "Google Ads Expert & PPC Manager in India",
      metaDescription:
        "Google Ads management for Indian businesses: Search, Display and Remarketing campaigns built for leads, with tracking set up before any money is spent.",
      socialTitle: "Google Ads management built around leads",
      h1: "Google Ads Expert in India",
      lead: "Search, Display and Remarketing campaigns set up for one thing: enquiries at a cost you can live with. Tracking goes in first, so you can see exactly what you're paying for.",
      answer: {
        q: "What does a Google Ads expert do?",
        a: "A Google Ads expert plans, builds and manages paid campaigns on Google Search, Display, YouTube and remarketing. The work includes keyword and audience research, campaign structure, ad copy, landing page advice, conversion tracking, bid strategy, negative keywords and weekly optimization to lower the cost per lead.",
      },
      keywords: {
        primary: "Google Ads expert in India",
        secondary: ["Google Ads management India", "PPC specialist India", "Google Ads for lead generation", "freelance Google Ads manager", "search ads consultant"],
      },
      context: {
        heading: "Why so many Google Ads accounts waste money",
        paragraphs: [
          "The most common problems I see in Indian Google Ads accounts are the same every time: broad keywords with no negatives, so ads show for job searches and free downloads; no conversion tracking, so Google's bidding has nothing to learn from; ads sending everyone to the homepage; and Smart campaigns left running on autopilot.",
          "I build accounts the other way round. Conversion tracking for form fills, calls and WhatsApp clicks goes in first through Google Tag Manager. Campaigns are split by intent, keyword lists are tight, negative keyword lists are maintained weekly, and every ad points to a page that matches the search.",
          "Google Ads works best alongside [SEO](/india/seo-specialist): ads bring enquiries now, while organic traffic builds and gradually takes over some of the spend. Search term data from ads also tells me which keywords are worth targeting organically. You can preview your ad copy lengths with the [SERP snippet preview](/free-seo-tools/serp-snippet-preview).",
        ],
      },
      includes: {
        heading: "What's included",
        items: [
          { t: "Account audit or setup", d: "A review of your existing account, or a clean build from scratch, in your own Google Ads account." },
          { t: "Conversion tracking", d: "Form, call and WhatsApp conversions through Google Tag Manager and GA4, tested before launch." },
          { t: "Keyword and audience research", d: "High-intent keywords, match types, negative lists and remarketing audiences." },
          { t: "Search, Display and Remarketing", d: "Campaigns structured by intent, with Performance Max only where it actually fits." },
          { t: "Ad copy and extensions", d: "Responsive search ads, sitelinks, callouts and call extensions written to match each ad group." },
          { t: "Landing page advice", d: "Changes that raise conversion rate, or a new landing page built for the campaign." },
          { t: "Weekly optimization", d: "Search terms, bids, budgets and ads reviewed every week, not once a month." },
        ],
      },
      process: [
        { t: "Audit and tracking", d: "Fix or set up conversion tracking so every enquiry is measured." },
        { t: "Build tight campaigns", d: "Group keywords by intent and write ads that match them." },
        { t: "Launch small", d: "Start with a controlled budget and prove the cost per lead." },
        { t: "Scale what converts", d: "Move budget to the keywords and audiences that bring real enquiries." },
      ],
      proof: {
        heading: "Results from my Google Ads accounts",
        intro: "Averages across freelance lead-generation accounts I've managed, with monthly budgets of $2K–5K.",
        points: [
          { value: "4–7%", label: "Average CTR", context: "Across Search, Display and Remarketing campaigns." },
          { value: "5–8%", label: "Conversion rate", context: "Leads and enquiries, tracked through conversion tags." },
          { value: "$0.80–1.50", label: "Average CPC", context: "Across the same freelance accounts." },
        ],
      },
      fit: {
        heading: "Who this is for",
        items: ["Clinics and healthcare providers", "Real estate developers and brokers", "Education, coaching and admissions", "Home services and repairs", "B2B and industrial suppliers", "Ecommerce stores running Shopping and remarketing"],
      },
      faq: [
        { q: "How much should I spend on Google Ads in India?", a: "Enough to get meaningful data, usually enough for at least 20–30 clicks a day in your main campaign. The right number depends on your city, industry and cost per click. I'll suggest a starting budget after looking at keyword costs for your market." },
        { q: "Is your fee separate from the ad budget?", a: "Yes. The ad budget is paid directly to Google from your own account. My management fee is separate and agreed upfront." },
        { q: "How soon will I get leads?", a: "Usually within the first week or two once campaigns are live. The first month is about learning which keywords and ads convert; costs typically come down from month two." },
        { q: "Should I run Google Ads if I'm already doing SEO?", a: "Often, yes. Ads cover keywords you don't rank for yet, and search term data shows which keywords are worth targeting in [SEO](/india/seo-specialist). Over time you can reduce ad spend on terms you rank well for." },
        { q: "Do you manage YouTube and Performance Max?", a: "Yes, when they suit the goal. For most lead-generation businesses, well-built Search campaigns come first. Performance Max works better once conversion tracking is solid and there's enough data." },
      ],
    },

    "meta-ads": {
      slug: "meta-ads",
      metaTitle: "Meta Ads Expert in India (FB & Instagram)",
      metaDescription:
        "Facebook and Instagram ads for Indian businesses: lead generation and awareness campaigns with proper tracking, creative testing and a clear cost per lead.",
      socialTitle: "Facebook and Instagram ads that bring in leads",
      h1: "Meta Ads Expert in India",
      lead: "Facebook and Instagram campaigns that reach the right people in your city or across India, test creatives properly and get judged on leads, not likes.",
      answer: {
        q: "What does a Meta Ads expert do?",
        a: "A Meta Ads expert plans and manages paid campaigns on Facebook, Instagram, Messenger and WhatsApp through Meta Ads Manager. The work covers audience targeting, creative and copy testing, lead forms or landing pages, Meta Pixel and Conversions API tracking, budget management and reporting on cost per lead.",
      },
      keywords: {
        primary: "Meta Ads expert in India",
        secondary: ["Facebook ads expert India", "Instagram ads services India", "Facebook ads for lead generation", "Meta Ads management", "Instagram marketing for small business"],
      },
      context: {
        heading: "Instagram is where Indian buyers scroll",
        paragraphs: [
          "Google catches people who are already searching. Meta reaches people before they search: someone scrolling Instagram in Ahmedabad who didn't know they needed teeth aligners, a home interior designer or a new coaching class until they saw your ad. For many Indian consumer businesses, Instagram is the biggest source of new enquiries.",
          "It's also easy to waste money there. Boosted posts with no objective, audiences that are too broad, one creative running for months, and leads that never get followed up. I set up campaigns with a clear objective, proper tracking through the Meta Pixel and Conversions API, several creatives to test, and lead forms or WhatsApp click-to-chat that your team can respond to quickly.",
          "Meta works best with a search channel behind it. People who see your ad often Google you before they call, so your [Google Business Profile](/india/local-seo) and website need to look as good as the ad. For high-intent searches, pair it with [Google Ads](/india/google-ads).",
        ],
      },
      includes: {
        heading: "What's included",
        items: [
          { t: "Account and tracking setup", d: "Business Manager, Meta Pixel and Conversions API, with events tested before launch." },
          { t: "Audience strategy", d: "Location, interest and lookalike audiences, plus remarketing to website visitors and video viewers." },
          { t: "Campaign structure", d: "Lead, traffic, messaging or awareness objectives chosen for your goal, with budgets set sensibly." },
          { t: "Creative testing", d: "Several images, videos and hooks tested side by side, with winners scaled and losers paused." },
          { t: "Lead forms and WhatsApp", d: "Instant forms with qualifying questions, or click-to-WhatsApp ads for businesses that sell in chat." },
          { t: "Landing pages", d: "Fast, focused pages when you need more than a form. See [web development](/india/web-development)." },
          { t: "Reporting", d: "Cost per lead and lead quality each month, not just reach and impressions." },
        ],
      },
      process: [
        { t: "Goal and tracking", d: "Agree what counts as a lead and make sure Meta can see it." },
        { t: "Audiences and creative", d: "Build test audiences and a first batch of creatives." },
        { t: "Test", d: "Run the tests long enough to learn, then cut what doesn't work." },
        { t: "Scale", d: "Increase budget steadily on the audiences and creatives that bring good leads." },
      ],
      proof: {
        heading: "Results from my Meta Ads accounts",
        intro: "Averages across freelance Facebook and Instagram accounts I've managed, with monthly budgets of $1.5K–3K.",
        points: [
          { value: "$3–8", label: "Cost per lead", context: "Lead-generation campaigns on Facebook and Instagram." },
          { value: "2–3.5%", label: "Average CTR", context: "Across lead, traffic and awareness campaigns." },
          { value: "$0.30–0.70", label: "Average CPC", context: "Across the same accounts." },
        ],
      },
      fit: {
        heading: "Who this is for",
        items: ["Clinics, aesthetics and dental practices", "D2C and ecommerce brands", "Real estate projects", "Coaching, courses and education", "Restaurants and events", "Local services that sell over WhatsApp"],
      },
      faq: [
        { q: "Are Facebook ads still worth it in India?", a: "Yes, especially on Instagram, where most of the attention is now. They work best for products and services people buy on impulse or discover visually, and for building remarketing audiences." },
        { q: "What budget do I need for Meta Ads?", a: "You can start with a modest daily budget, but you need enough to let each test spend for several days. I'll suggest a starting figure based on your goal and city." },
        { q: "Lead forms or a landing page: which is better?", a: "Lead forms usually bring more leads at a lower cost; landing pages usually bring fewer but better-qualified ones. I often test both and add qualifying questions to forms to filter out casual sign-ups." },
        { q: "Do you make the ad creatives?", a: "I write the ad copy, plan the hooks and brief what each creative should show. Design and video can come from your team, a designer or simple formats I put together for testing." },
        { q: "Why are my Facebook leads poor quality?", a: "Usually because the form is too easy, the audience too broad or the offer unclear. Adding a couple of qualifying questions and sending leads to WhatsApp or a call quickly makes a big difference." },
      ],
    },

    "web-development": {
      slug: "web-development",
      metaTitle: "SEO-Friendly Website Development in India",
      metaDescription:
        "Fast, SEO-friendly WordPress and WooCommerce websites for Indian businesses, with technical SEO, schema and tracking built in before launch.",
      socialTitle: "SEO-friendly websites, built to rank from launch",
      h1: "SEO-Friendly Website Development in India",
      lead: "Fast WordPress and WooCommerce websites with SEO designed in from the first wireframe, so your new site launches ready to rank instead of needing fixes later.",
      answer: {
        q: "What is an SEO-friendly website?",
        a: "An SEO-friendly website is built so search engines can crawl and understand it from day one. It has a clear page structure and URLs, one H1 per page, fast load times on mobile, proper title tags and meta descriptions, internal links, an XML sitemap, correct robots.txt, structured data and no duplicate or thin pages.",
      },
      keywords: {
        primary: "SEO-friendly website development India",
        secondary: ["WordPress developer India", "WooCommerce development India", "custom WordPress plugin development", "fast website for small business", "website redesign without losing SEO"],
      },
      context: {
        heading: "Most websites are built first and fixed for SEO later",
        paragraphs: [
          "The usual way a business website gets made in India: a designer builds something attractive with a heavy theme and a page builder, it launches, and six months later someone notices it doesn't rank. Then the SEO person has to fight the theme, the slow sliders, the missing headings and the duplicate URLs it created.",
          "I've done it the other way, at scale. At a digital agency I made more than 100 dental websites SEO-ready during development, before they launched. Structure, headings, URLs, schema, sitemaps and speed were all decided before the first page went live. I also built a site from scratch for a studio that had no web presence at all; it now ranks first on Google for several of its main keywords ([case study](/work?case=tattoo-studio-from-zero)).",
          "My background is in computer applications and full-stack development, so when WordPress needs something a plugin can't do, I write the plugin. Two of mine are in production: one for page-level JSON-LD schema and one for custom XML sitemaps. If you're redesigning an existing site, I map every old URL to a new one so you keep the rankings you've earned. See also [technical SEO](/india/technical-seo).",
        ],
      },
      includes: {
        heading: "What's included",
        items: [
          { t: "Page structure and sitemap planning", d: "Every page mapped to a keyword and a purpose before design starts." },
          { t: "WordPress and WooCommerce builds", d: "Lightweight themes, minimal plugins and clean, responsive layouts." },
          { t: "Speed and Core Web Vitals", d: "Optimized images, caching, lazy loading and good scores on real mobile phones." },
          { t: "On-page SEO built in", d: "Titles, meta descriptions, headings, image alt text and internal links set up on every page." },
          { t: "Schema and sitemaps", d: "Organization, LocalBusiness, Product, Article and FAQ schema, plus a clean XML sitemap." },
          { t: "Tracking", d: "GA4, Search Console and Tag Manager installed, with form, call and WhatsApp events." },
          { t: "Custom plugins", d: "When an off-the-shelf plugin falls short, a small custom one that does exactly what you need." },
          { t: "Redesign migrations", d: "301 redirect maps and pre and post-launch checks so rankings survive the move." },
        ],
      },
      process: [
        { t: "Plan", d: "Keywords, page structure and content outline agreed before any design." },
        { t: "Design and build", d: "Responsive pages built on a fast, lean WordPress setup." },
        { t: "SEO and QA", d: "Technical checks, schema validation, speed tests and tracking tests before launch." },
        { t: "Launch and monitor", d: "Submit to Search Console, watch indexing and fix anything that comes up." },
      ],
      proof: {
        heading: "Results from sites I've built",
        intro: "From projects I worked on from Ahmedabad, for clients in the USA and Canada.",
        points: [
          { value: "100+", label: "Sites SEO-ready at launch", context: "Dental websites with on-page and technical SEO built in during development, within six months." },
          { value: "#1", label: "On Google for several keywords", context: "Studio website and Google Business Profile built from scratch, for a business with no web presence." },
          { value: "2", label: "Custom plugins in production", context: "A JSON-LD schema plugin and a custom XML sitemap plugin, still in use." },
        ],
      },
      fit: {
        heading: "Who this is for",
        items: ["New businesses that need their first proper website", "Clinics and professional services", "WooCommerce and ecommerce stores", "Businesses redesigning an older site", "Agencies that need an SEO-first developer", "Anyone whose current site is slow or won't rank"],
      },
      faq: [
        { q: "Do you build on WordPress only?", a: "WordPress and WooCommerce are what I build on most, because they're flexible, easy for you to edit and good for SEO when set up properly. For other platforms I can advise and handle the SEO side." },
        { q: "Will I be able to edit the website myself?", a: "Yes. Pages, blog posts, products and images are editable in the WordPress dashboard, and I show you how. You won't need me for everyday changes." },
        { q: "Can you redesign my site without losing Google rankings?", a: "Yes, if it's planned properly. I crawl the old site, map every URL to its new version with 301 redirects, keep or improve the content on pages that rank, and monitor Search Console after launch." },
        { q: "How fast will my website be?", a: "I aim for pages that load quickly on an average mobile connection and pass Core Web Vitals. The exact numbers depend on hosting and content, and I'll recommend hosting that suits your traffic." },
        { q: "Do you write the website content?", a: "I plan the structure and SEO for every page and can write or edit the copy. Many clients write the first draft themselves and I shape it for search and conversions." },
      ],
    },
  },
};
