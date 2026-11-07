import { pageMeta } from "@/lib/seo";
import { ToolShell, type ToolCopy } from "@/components/tools/ToolShell";
import { SchemaTool } from "@/components/tools/SchemaTool";
import { toolBySlug } from "@/content/tools";

const tool = toolBySlug("schema-markup-generator");
const DESCRIPTION = "Generate JSON-LD structured data for articles, local businesses, products, FAQs, events, breadcrumbs and more, with Google's required fields checked.";

export const metadata = pageMeta({ title: "Schema Markup Generator (JSON-LD)", description: DESCRIPTION, path: tool.href, socialTitle: "Free JSON-LD schema markup generator" });

const copy: ToolCopy = {
  slug: "schema-markup-generator",
  h1: "Schema Markup Generator",
  lead: "Create valid JSON-LD structured data without writing code. Pick a type, fill in the fields, and the generator builds the markup and tells you which fields Google requires.",
  description: DESCRIPTION,
  features: ["Article, LocalBusiness, Organization, Person, Product, FAQ, Breadcrumb, Event and WebSite schema", "Required-field checks", "Opening hours converted automatically", "Clean, pruned JSON-LD", "Copy or download"],
  steps: [
    { t: "Choose a type", d: "Pick the schema that matches the page: LocalBusiness for a clinic's contact page, Article for a blog post, Product for a product page, and so on." },
    { t: "Fill in the details", d: "Fields marked * are required by Google for rich results. Empty fields are left out of the code, so it stays clean." },
    { t: "Add it and test", d: "Paste the code into the page, publish, then run Google's Rich Results Test to confirm the page is eligible." },
  ],
  about: {
    heading: "Structured data tells machines what a page is about.",
    body: (
      <>
        <p>
          Schema markup is a standard vocabulary for describing things on a page, such as a business, an article, a product or an event. Search engines use it to understand content with more
          certainty, and it's what makes rich results possible: star ratings, prices, event dates, breadcrumbs and business details shown directly in Google.
        </p>
        <p>
          It matters even more now that AI answer engines summarise the web. Clear structured data helps them get your opening hours, prices and authorship right instead of guessing. For local
          businesses, a complete <strong>LocalBusiness</strong> block with the same name, address and phone number as your Google Business Profile is one of the simplest technical wins available.
        </p>
        <p>
          Two rules keep you out of trouble. Only mark up information that visitors can see on the page, and don't add review stars unless real reviews are shown. Schema that doesn't match the page can
          be ignored or lead to a manual action. Want to know which pages on your site are missing structured data? The <a href="/seo-audit">free SEO audit</a> checks every crawled page.
        </p>
      </>
    ),
  },
  faq: [
    { q: "What is JSON-LD?", a: "JSON-LD is a way of adding structured data to a page inside a script tag, separate from the visible HTML. It's the format Google recommends because it's easy to add, update and validate without touching your page layout." },
    { q: "Where do I paste schema markup?", a: "Anywhere in the page's HTML, usually in the head or just before the closing body tag. On WordPress you can use a plugin like Rank Math or Yoast, or a header-and-footer code plugin, to add it to specific pages." },
    { q: "Does schema markup improve rankings?", a: "Not directly. Google says structured data isn't a ranking factor on its own. But it can earn rich results, which take up more space and often get more clicks, and it helps search engines and AI tools understand your content accurately." },
    { q: "Which schema type should a local business use?", a: "Use the most specific LocalBusiness subtype that fits, such as Dentist, MedicalClinic, LegalService or Restaurant. Include your name, address, phone number, opening hours, coordinates and links to your social and directory profiles." },
    { q: "Why isn't my FAQ schema showing in Google?", a: "Since 2023 Google shows FAQ rich results mainly for well-known government and health websites. FAQ markup is still valid and still helps machines understand the page, but most sites won't see the expandable questions in search results." },
  ],
};

export default function Page() {
  return (
    <ToolShell copy={copy}>
      <SchemaTool />
    </ToolShell>
  );
}
