import { pageMeta, breadcrumbJsonLd, webPageJsonLd, absUrl } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { TLink } from "@/components/ui/TLink";
import { Reveal } from "@/components/ui/motion";
import { ButtonLink } from "@/components/ui/Buttons";
import { Closing } from "@/components/home/Closing";
import { ServiceArt } from "@/components/services/ServiceArt";
import { ServiceGrid } from "@/components/services/ServicePage";
import { RichText, plainText } from "@/components/services/RichText";
import { markets, services, servicePath, marketPath } from "@/content/services";
import { india } from "@/content/services/india";
import { site } from "@/content/site";
import { withSeo } from "@/lib/site/seo";
import { PageSchema } from "@/components/seo/PageSchema";

const market = markets.india;
const hub = india.hub;
const PATH = marketPath(market.slug);

export const generateMetadata = async () =>
  withSeo({
  ...pageMeta({ title: hub.metaTitle, description: hub.metaDescription, path: PATH, socialTitle: hub.socialTitle, image: { url: `${PATH}/opengraph-image`, alt: `${hub.h1}, Agman Rajpurohit` } }),
  keywords: [hub.keywords.primary, ...hub.keywords.secondary],
  });

const listLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: `SEO and digital marketing services in ${market.name}`,
  numberOfItems: services.length,
  itemListElement: services.map((s, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Service",
      "@id": `${absUrl(servicePath(market.slug, s.slug))}#service`,
      name: india.services[s.slug].h1,
      url: absUrl(servicePath(market.slug, s.slug)),
      description: india.services[s.slug].metaDescription,
      provider: { "@id": `${site.url}/#person` },
      areaServed: { "@type": "Country", name: market.name },
    },
  })),
};
const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [hub.answer, ...hub.faq].map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: plainText(f.a) } })),
};

export default function IndiaServicesPage() {
  return (
    <>
      <PageSchema path={PATH} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: `Services in ${market.name}`, path: PATH }])} />
      <JsonLd data={webPageJsonLd({ type: "CollectionPage", name: hub.metaTitle, description: hub.metaDescription, path: PATH, image: `${PATH}/opengraph-image` })} />
      <JsonLd data={listLd} />
      <JsonLd data={faqLd} />

      <section className="pt-[calc(var(--header-h)+2rem)] md:pt-[calc(var(--header-h)+3.5rem)]">
        <div className="wrap grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            <nav aria-label="Breadcrumb" className="t-label flex flex-wrap items-center gap-2">
              <TLink href="/" className="hover:!text-bone">
                Home
              </TLink>
              <span aria-hidden="true">/</span>
              <span className="ember" aria-current="page">
                Services in {market.name}
              </span>
            </nav>
            <h1 className="mt-6 text-[clamp(2.3rem,5.4vw,5rem)] leading-[0.98] font-extrabold tracking-[-0.04em]">{hub.h1}</h1>
            <p className="t-lead mt-6 max-w-[40rem] text-bone-dim">{hub.lead}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/contact" cursor="Talk">
                Discuss your project
              </ButtonLink>
              <ButtonLink href="/seo-audit" variant="ghost">
                Free SEO audit
              </ButtonLink>
            </div>
          </div>
          <Reveal>
            <ServiceArt id="digital" className="drop-shadow-[0_30px_60px_rgba(0,0,0,0.45)]" />
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="answer-title" className="wrap mt-12 md:mt-16">
        <div className="border-l-2 border-ember bg-ink-2/60 p-6 md:p-10">
          <h2 id="answer-title" className="t-h3">
            {hub.answer.q}
          </h2>
          <p className="t-body mt-4 max-w-[60rem] text-[1.05rem] text-bone">{hub.answer.a}</p>
        </div>
      </section>

      <section aria-labelledby="services-title" className="svc-section">
        <div className="wrap">
          <p className="t-label">
            <span className="ember">A</span> — {services.length} services
          </p>
          <h2 id="services-title" className="t-h2 mt-4 max-w-[24ch]">
            What I can do for {market.adjective} businesses
          </h2>
          <ServiceGrid market={market} list={services} art />
        </div>
      </section>

      <section aria-labelledby="why-title" className="svc-section border-t border-line">
        <div className="wrap grid-12 gap-y-8">
          <p className="t-label col-span-4 md:col-span-3">
            <span className="ember">B</span> — Why me
          </p>
          <div className="col-span-4 md:col-span-9">
            <h2 id="why-title" className="t-h2">
              Why work with me
            </h2>
            <Reveal as="ul" childrenStagger className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
              {hub.why.map((w) => (
                <li key={w.t} className="border-t border-line pt-5">
                  <h3 className="t-h3 !text-xl">{w.t}</h3>
                  <p className="t-body mt-2">
                    <RichText text={w.d} />
                  </p>
                </li>
              ))}
            </Reveal>
            <p className="t-body mt-10 text-sm">
              Working remotely with businesses in {market.cities.slice(0, -1).join(", ")} and {market.cities.at(-1)}. See the{" "}
              <TLink href="/work" className="link-u text-bone">
                case studies
              </TLink>
              , my{" "}
              <TLink href="/experience" className="link-u text-bone">
                experience
              </TLink>
              , the{" "}
              <TLink href="/free-seo-tools" className="link-u text-bone">
                free SEO tools
              </TLink>{" "}
              or the{" "}
              <TLink href="/blog" className="link-u text-bone">
                blog
              </TLink>
              .
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="faq-title" className="svc-section border-t border-line">
        <div className="wrap grid-12 gap-y-8">
          <p className="t-label col-span-4 md:col-span-3">
            <span className="ember">C</span> — Questions
          </p>
          <div className="col-span-4 md:col-span-9">
            <h2 id="faq-title" className="t-h2">
              Frequently asked questions
            </h2>
            <div className="mt-8 border-t border-line">
              {hub.faq.map((f) => (
                <details key={f.q} className="group border-b border-line py-5">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-lg font-medium text-bone md:text-xl">
                    <h3 className="font-medium">{f.q}</h3>
                    <span aria-hidden="true" className="mt-1 text-ember transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="t-body mt-3 max-w-[52rem]">
                    <RichText text={f.a} />
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Closing label="Start a project" headline={["Ready to grow", "your business?"]} body="Tell me about your website, your market and what a good month looks like. I'll reply with honest next steps, usually within a working day." />
    </>
  );
}
