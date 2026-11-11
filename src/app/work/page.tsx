import { pageMeta, breadcrumbJsonLd, webPageJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHero } from "@/components/ui/PageHero";
import { WorkExplorer } from "@/components/work/WorkExplorer";
import { ReportsWall } from "@/components/work/ReportsWall";
import { Closing } from "@/components/home/Closing";
import { cases } from "@/content/work";
import { site } from "@/content/site";
import { ServicesStrip } from "@/components/services/ServicesStrip";
import { withSeo } from "@/lib/site/seo";
import { PageSchema } from "@/components/seo/PageSchema";

const TITLE = "SEO Case Studies and Results";
const DESCRIPTION =
  "Real SEO results for dental clinics, a four-market finance site and local businesses, with the Search Console and GA4 screenshots to prove them.";

export const generateMetadata = () => withSeo(pageMeta({ title: TITLE, description: DESCRIPTION, path: "/work", socialTitle: "SEO case studies by Agman Rajpurohit" }));

const itemList = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Case studies",
  itemListElement: cases.map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "CreativeWork",
      name: c.client ? `${c.client.name}: ${c.title}` : c.title,
      about: c.industry,
      ...(c.client ? { mentions: { "@type": "Organization", name: c.client.name } } : {}),
      abstract: c.summary,
      url: `${site.url}/work?case=${c.slug}`,
      creator: { "@id": `${site.url}/#person` },
    },
  })),
};

export default function WorkPage() {
  return (
    <>
      <PageSchema path={"/work"} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Work", path: "/work" }])} />
      <JsonLd data={itemList} />
      <JsonLd data={webPageJsonLd({ type: "CollectionPage", name: TITLE, description: DESCRIPTION, path: "/work" })} />
      <PageHero
        index="03"
        title="Work"
        display={
          <>
            Proof, <span className="ember">not</span> promises.
          </>
        }
        aside={
          <p className="t-body text-sm">
            Figures come from Search Console, GA4, Google Business Profile, ad platforms and client records, with original report screenshots where
            available. Ecommerce, paid media and some agency projects stay anonymous.
          </p>
        }
      >
        <p>
          SEO, local search, AI search, paid media and web builds, across dental and healthcare, financial services, ecommerce and local
          businesses. Open any project for the challenge, the approach and the result.
        </p>
      </PageHero>

      <WorkExplorer />

      <ReportsWall />

      <ServicesStrip title="Want results like these for your business?" intro="The same work, offered to businesses across India." highlight={["seo-specialist", "local-seo", "technical-seo"]} />
      <Closing
        label="Your project"
        headline={["Have a site that should", "be ranking by now?"]}
        body="Whether you're hiring for SEO or need a hand with a specific site, campaign or build, tell me what you're working with and I'll tell you honestly how I can help."
      />
    </>
  );
}
