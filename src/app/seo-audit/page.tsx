import { pageMeta, breadcrumbJsonLd, webPageJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { AuditHero } from "@/components/audit/AuditHero";
import { Reveal, SplitReveal } from "@/components/ui/motion";
import { CHECKS } from "@/lib/audit/checks-meta";
import { CATEGORIES, CATEGORY_META } from "@/lib/audit/types";
import { site } from "@/content/site";
import { ServicesStrip } from "@/components/services/ServicesStrip";
import { withSeo } from "@/lib/site/seo";
import { PageSchema } from "@/components/seo/PageSchema";
import { getSite } from "@/lib/site/settings";

const TITLE = "Free Website SEO Audit Tool";
const DESCRIPTION =
  "Run a free SEO check on your website. It crawls up to 100 pages, flags technical, on-page, speed and mobile issues, and tells you how to fix them.";

export const generateMetadata = () => withSeo(pageMeta({ title: TITLE, description: DESCRIPTION, path: "/seo-audit", socialTitle: "Free SEO audit: see what's holding your site back" }));

const CAT_COPY: Record<string, string> = {
  technical: "HTTPS, redirects, status codes, robots.txt, sitemaps, canonicals, indexability, orphan pages, hreflang and JavaScript rendering.",
  onpage: "Titles, meta descriptions, headings, Open Graph, anchor text and the signals each page sends about its topic.",
  content: "Thin and duplicate content, readability, structure, topic relevance and the trust pages visitors look for.",
  performance: "Real Google PageSpeed Insights results for mobile and desktop: LCP, INP, CLS, TBT and the biggest savings.",
  mobile: "Viewport, legible text, tap targets, responsive images and real-user mobile experience where Google has data.",
  links: "How authority flows through the site: link totals, dead ends, weakly linked pages and key pages’ depth.",
  images: "ALT text, dimensions, file size, modern formats, lazy loading and descriptive filenames.",
  schema: "JSON-LD and microdata detection and syntax validation for Organization, LocalBusiness, Article, Product and more.",
};

const STEPS = [
  { t: "Enter your URL", d: "Just the address — no account, no email up front." },
  { t: "We crawl and test", d: `Up to 100 pages, following your robots.txt, plus Google PageSpeed tests. Progress is live, not simulated.` },
  { t: "Fix what matters", d: "Every issue lists the affected URLs, why it matters and how to fix it, prioritised into a 7- and 30-day plan." },
];

const appLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Free Website SEO Audit Tool",
  url: `${site.url}/seo-audit`,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  creator: { "@id": `${site.url}/#person` },
  isAccessibleForFree: true,
  browserRequirements: "Requires JavaScript",
  featureList: CATEGORIES.map((c) => CATEGORY_META[c].label).join(", "),
  description: "Crawls up to 100 pages of a website and checks technical SEO, on-page SEO, content, speed, mobile, images, internal links and structured data.",
};

export default async function SeoAuditPage() {
  const live = await getSite();
  return (
    <>
      <PageSchema path={"/seo-audit"} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Free SEO Tools", path: "/free-seo-tools" }, { name: "Website SEO Audit", path: "/seo-audit" }])} />
      <JsonLd data={appLd} />
      <JsonLd data={webPageJsonLd({ name: TITLE, description: DESCRIPTION, path: "/seo-audit" })} />
      <AuditHero />

      <section aria-labelledby="checks-title" className="section border-t border-line">
        <div className="wrap grid-12 gap-y-8">
          <p className="t-label col-span-4 md:col-span-3">
            <span className="ember">A</span> — What we check
          </p>
          <div className="col-span-4 md:col-span-9">
            <SplitReveal as="h2" id="checks-title" className="t-h2 max-w-[20ch]">
              {`${CHECKS.length} checks across eight areas of SEO.`}
            </SplitReveal>
          </div>
        </div>
        <Reveal as="ul" childrenStagger className="wrap mt-10 grid grid-cols-1 gap-px border-y border-line bg-line sm:grid-cols-2 xl:grid-cols-4 md:mt-14">
          {CATEGORIES.map((c) => (
            <li key={c} className="flex flex-col bg-ink p-6 md:p-8">
              <div className="flex items-baseline justify-between">
                <span className="t-label ember">{CATEGORY_META[c].weight}% of score</span>
                <span className="t-label">{CHECKS.filter((x) => x.category === c).length} checks</span>
              </div>
              <h3 className="t-h3 mt-5">{CATEGORY_META[c].label}</h3>
              <p className="t-body mt-3 text-sm">{CAT_COPY[c]}</p>
            </li>
          ))}
        </Reveal>
      </section>

      <section aria-labelledby="how-title" className="section pt-0">
        <div className="wrap grid-12 gap-y-8">
          <p className="t-label col-span-4 md:col-span-3">
            <span className="ember">B</span> — How it works
          </p>
          <div className="col-span-4 md:col-span-9">
            <SplitReveal as="h2" id="how-title" className="t-h2">
              Three steps, about two minutes.
            </SplitReveal>
            <Reveal as="ol" childrenStagger className="mt-10 grid gap-8 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.t} className="border-t border-line pt-5">
                  <span className="t-label ember">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="t-h3 mt-3">{s.t}</h3>
                  <p className="t-body mt-2">{s.d}</p>
                </li>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      <section aria-labelledby="method-title" className="section border-t border-line">
        <div className="wrap grid-12 gap-y-8">
          <p className="t-label col-span-4 md:col-span-3">
            <span className="ember">C</span> — Scoring methodology
          </p>
          <div className="col-span-4 md:col-span-9">
            <SplitReveal as="h2" id="method-title" className="t-h2">
              Transparent scoring, no black box.
            </SplitReveal>
            <Reveal className="mt-8 grid gap-10 md:grid-cols-2">
              <div className="t-body space-y-4">
                <p>
                  Every check has a written rule and a severity. A passed check earns its full weight, a warning earns half and an error earns nothing. Severity sets the weight:
                  critical 10, high 6, medium 3, low 1.
                </p>
                <p>
                  Checks we couldn’t run — for example performance when Google PageSpeed is unavailable — are marked <em>Not tested</em> and left out of the score, never counted as a pass or a
                  fail. Related issues are scored once, so one problem can’t drag several categories down.
                </p>
                <p className="border-l border-ember pl-4 text-bone">This is an independent website SEO audit score, not a Google ranking score.</p>
              </div>
              <table className="w-full text-sm">
                <caption className="t-label mb-3 text-left">Category weights</caption>
                <tbody>
                  {CATEGORIES.map((c) => (
                    <tr key={c} className="border-b border-line">
                      <th scope="row" className="py-2.5 text-left font-normal text-bone">
                        {CATEGORY_META[c].label}
                      </th>
                      <td className="py-2.5 text-right t-mono text-bone-dim">{CATEGORY_META[c].weight}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Reveal>
          </div>
        </div>
      </section>

      <section aria-labelledby="privacy-title" className="section pt-0">
        <div className="wrap grid-12 gap-y-6">
          <p className="t-label col-span-4 md:col-span-3">
            <span className="ember">D</span> — Privacy &amp; fair use
          </p>
          <div className="t-body col-span-4 space-y-3 md:col-span-9">
            <h2 id="privacy-title" className="t-h3 text-bone">
              What happens to your data
            </h2>
            <p>
              We only fetch public pages over the web, the way a search engine does, identified as <span className="t-mono text-bone">AgmanSEOAuditBot</span>. We respect robots.txt, never run your
              site’s JavaScript on our servers, limit request speed and stop at 100 pages.
            </p>
            <p>
              You can see your results without giving any details. If you request the PDF report, your name and email are stored with the audit so the report can be sent and so Agman
              can follow up about it. Marketing emails are only sent if you tick the separate opt-in. To have your data deleted, email{" "}
              <a href={`mailto:${live.email}`} className="link-u text-bone">
                {live.email}
              </a>
              .
            </p>
          </div>
        </div>
      </section>
      <ServicesStrip title="Want the issues fixed for you?" intro="The audit shows the problems. These services fix them." highlight={["technical-seo", "seo-specialist", "local-seo"]} />
    </>
  );
}
