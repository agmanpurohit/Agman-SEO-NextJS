import { JsonLd } from "@/components/seo/JsonLd";
import { TLink } from "@/components/ui/TLink";
import { Reveal } from "@/components/ui/motion";
import { ButtonLink } from "@/components/ui/Buttons";
import { Closing } from "@/components/home/Closing";
import { ServiceArt } from "./ServiceArt";
import { RichText, plainText } from "./RichText";
import { breadcrumbJsonLd, webPageJsonLd, absUrl } from "@/lib/seo";
import { site } from "@/content/site";
import { tools } from "@/content/tools";
import { services, servicePath, marketPath, type Market, type Service, type ServiceCopy } from "@/content/services";
import { PageSchema } from "@/components/seo/PageSchema";

/**
 * One service page for one market. All text is server-rendered for search engines and AI
 * crawlers. Structure: answer-first hero, direct definition (AEO), market context, what's
 * included, process, verified proof, who it suits, related free tools, FAQs, then links to
 * every other service in the market.
 */
export function ServicePage({ market, service, copy }: { market: Market; service: Service; copy: ServiceCopy }) {
  const path = servicePath(market.slug, service.slug);
  const url = absUrl(path);
  const image = `${path}/opengraph-image`;
  const others = services.filter((s) => s.slug !== service.slug);
  const relatedTools = service.tools.map((t) => tools.find((x) => x.slug === t)!).filter(Boolean);

  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: copy.h1,
    serviceType: service.name,
    description: copy.metaDescription,
    url,
    image: absUrl(image),
    provider: { "@id": `${site.url}/#person` },
    areaServed: { "@type": "Country", name: market.name, identifier: market.code },
    availableChannel: { "@type": "ServiceChannel", serviceUrl: absUrl("/contact"), availableLanguage: ["English", "Hindi"] },
    audience: { "@type": "BusinessAudience", geographicArea: { "@type": "Country", name: market.name } },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${service.name} services`,
      itemListElement: copy.includes.items.map((it) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: it.t, description: plainText(it.d) } })),
    },
    keywords: [copy.keywords.primary, ...copy.keywords.secondary].join(", "),
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [copy.answer, ...copy.faq].map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: plainText(f.a) } })),
  };

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: `Services in ${market.name}`, path: marketPath(market.slug) }, { name: service.name, path }])} />
      <JsonLd data={webPageJsonLd({ name: copy.metaTitle, description: copy.metaDescription, path, image })} />
      <JsonLd data={serviceLd} />
      <JsonLd data={faqLd} />
      <PageSchema path={path} />

      {/* Hero */}
      <section className="pt-[calc(var(--header-h)+2rem)] md:pt-[calc(var(--header-h)+3.5rem)]">
        <div className="wrap grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            <nav aria-label="Breadcrumb" className="t-label flex flex-wrap items-center gap-2">
              <TLink href="/" className="hover:!text-bone">
                Home
              </TLink>
              <span aria-hidden="true">/</span>
              <TLink href={marketPath(market.slug)} className="hover:!text-bone">
                {market.name}
              </TLink>
              <span aria-hidden="true">/</span>
              <span className="ember" aria-current="page">
                {service.name}
              </span>
            </nav>
            <h1 className="mt-6 text-[clamp(2.3rem,5.4vw,5rem)] leading-[0.98] font-extrabold tracking-[-0.04em]">{copy.h1}</h1>
            <p className="t-lead mt-6 max-w-[40rem] text-bone-dim">{copy.lead}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/contact" cursor="Talk">
                Discuss your project
              </ButtonLink>
              <ButtonLink href="/seo-audit" variant="ghost">
                Free SEO audit
              </ButtonLink>
            </div>
            <p className="t-label mt-8 flex flex-wrap gap-x-5 gap-y-1">
              <span>
                <span className="ember">●</span> 3 years of SEO in Ahmedabad
              </span>
              <span>Remote across {market.name}</span>
              <span>Verified results</span>
            </p>
          </div>
          <Reveal>
            <ServiceArt id={service.art} className="drop-shadow-[0_30px_60px_rgba(0,0,0,0.45)]" />
          </Reveal>
        </div>
      </section>

      {/* Direct answer (AEO / GEO) */}
      <section aria-labelledby="answer-title" className="wrap mt-12 md:mt-16">
        <div className="border-l-2 border-ember bg-ink-2/60 p-6 md:p-10">
          <h2 id="answer-title" className="t-h3">
            {copy.answer.q}
          </h2>
          <p className="t-body mt-4 max-w-[60rem] text-[1.05rem] text-bone">{copy.answer.a}</p>
        </div>
      </section>

      {/* Market context */}
      <section aria-labelledby="context-title" className="svc-section">
        <div className="wrap grid-12 gap-y-8">
          <p className="t-label col-span-4 md:col-span-3">
            <span className="ember">A</span> — {market.name}
          </p>
          <div className="col-span-4 md:col-span-9">
            <h2 id="context-title" className="t-h2 max-w-[22ch]">
              {copy.context.heading}
            </h2>
            <div className="t-body mt-8 max-w-[52rem] space-y-5 text-[1.02rem]">
              {copy.context.paragraphs.map((p, i) => (
                <p key={i}>
                  <RichText text={p} />
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What's included */}
      <section aria-labelledby="includes-title" className="svc-section border-t border-line">
        <div className="wrap">
          <p className="t-label">
            <span className="ember">B</span> — Scope
          </p>
          <h2 id="includes-title" className="t-h2 mt-4">
            {copy.includes.heading}
          </h2>
          <Reveal as="ul" childrenStagger className="mt-10 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
            {copy.includes.items.map((it, i) => (
              <li key={it.t} className="flex flex-col bg-ink p-6 md:p-7">
                <span className="t-label ember">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-4 text-lg font-semibold text-bone md:text-xl">{it.t}</h3>
                <p className="t-body mt-2 text-sm">
                  <RichText text={it.d} />
                </p>
              </li>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Process */}
      <section aria-labelledby="process-title" className="svc-section pt-0">
        <div className="wrap grid-12 gap-y-8">
          <p className="t-label col-span-4 md:col-span-3">
            <span className="ember">C</span> — How it works
          </p>
          <div className="col-span-4 md:col-span-9">
            <h2 id="process-title" className="t-h2">
              How I work, step by step
            </h2>
            <Reveal as="ol" childrenStagger className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {copy.process.map((s, i) => (
                <li key={s.t} className="border-t border-line pt-5">
                  <span className="t-label ember">Step {i + 1}</span>
                  <h3 className="t-h3 mt-3 !text-xl">{s.t}</h3>
                  <p className="t-body mt-2 text-sm">{s.d}</p>
                </li>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* Proof */}
      <section aria-labelledby="proof-title" className="svc-section border-t border-line">
        <div className="wrap">
          <div className="grid-12 gap-y-6">
            <p className="t-label col-span-4 md:col-span-3">
              <span className="ember">D</span> — Proof
            </p>
            <div className="col-span-4 md:col-span-9">
              <h2 id="proof-title" className="t-h2">
                {copy.proof.heading}
              </h2>
              <p className="t-body mt-4 max-w-[46rem]">{copy.proof.intro}</p>
            </div>
          </div>
          <Reveal as="ul" childrenStagger className="mt-10 grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-3">
            {copy.proof.points.map((p) => (
              <li key={p.label} className="bg-ink p-6 md:p-8">
                <p className="text-[clamp(2.4rem,4.6vw,3.6rem)] leading-none font-light tracking-tight text-bone">{p.value}</p>
                <p className="t-label mt-4 !text-bone">{p.label}</p>
                <p className="t-body mt-2 text-sm">{p.context}</p>
              </li>
            ))}
          </Reveal>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {service.caseSlug && (
              <TLink href={`/work?case=${service.caseSlug}`} className="link-u text-bone">
                Read the related case study →
              </TLink>
            )}
            <TLink href="/work" className="link-u text-bone-dim hover:text-bone">
              All case studies
            </TLink>
            <TLink href="/experience" className="link-u text-bone-dim hover:text-bone">
              My experience
            </TLink>
          </div>
        </div>
      </section>

      {/* Fit + locations */}
      <section aria-labelledby="fit-title" className="svc-section pt-0">
        <div className="wrap grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div>
            <h2 id="fit-title" className="t-h3">
              {copy.fit.heading}
            </h2>
            <ul className="mt-6 flex flex-wrap gap-2">
              {copy.fit.items.map((it) => (
                <li key={it} className="rounded-full border border-line-2 px-4 py-2 text-sm text-bone-dim">
                  {it}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="t-h3">Where I work in {market.name}</h2>
            <p className="t-body mt-4 text-sm">
              Remote work with {market.adjective} businesses in {market.cities.slice(0, -1).join(", ")} and {market.cities.at(-1)}, and anywhere else in the country. Calls on Google Meet or WhatsApp, in your working hours.
            </p>
            {relatedTools.length > 0 && (
              <>
                <p className="t-label mt-8">Free tools for this</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {relatedTools.map((t) => (
                    <li key={t.slug}>
                      <TLink href={t.href} className="inline-flex items-center gap-2 rounded-full border border-line-2 px-4 py-2 text-sm text-bone transition-colors hover:border-ember hover:text-ember">
                        {t.name} <span aria-hidden="true">↗</span>
                      </TLink>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-title" className="svc-section border-t border-line">
        <div className="wrap grid-12 gap-y-8">
          <p className="t-label col-span-4 md:col-span-3">
            <span className="ember">E</span> — Questions
          </p>
          <div className="col-span-4 md:col-span-9">
            <h2 id="faq-title" className="t-h2">
              {service.name} in {market.name}: FAQs
            </h2>
            <div className="mt-8 border-t border-line">
              {copy.faq.map((f) => (
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

      {/* Every other service in this market */}
      <section aria-labelledby="more-title" className="svc-section border-t border-line">
        <div className="wrap">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 id="more-title" className="t-h2">
              More services in {market.name}
            </h2>
            <ButtonLink href={marketPath(market.slug)} variant="ghost">
              All services
            </ButtonLink>
          </div>
          <ServiceGrid market={market} list={others} />
        </div>
      </section>

      <Closing label="Start a project" headline={["Ready to grow", "your business?"]} body={`Send a few lines about your website and goals. I'll reply with honest next steps for ${service.name.toLowerCase()} in ${market.name}, usually within a working day.`} />
    </>
  );
}

/** Linked cards for a list of services (used on service pages and the market hub). */
export function ServiceGrid({ market, list, art = false }: { market: Market; list: readonly Service[]; art?: boolean }) {
  return (
    <ul className="mt-10 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
      {list.map((s) => (
        <li key={s.slug} className="bg-ink">
          <TLink href={servicePath(market.slug, s.slug)} className="group flex h-full flex-col p-6 transition-colors hover:bg-ink-2 md:p-8" data-cursor="Open">
            {art && (
              <span className="mb-6 block overflow-hidden rounded-[14px] transition-transform duration-500 group-hover:-translate-y-1">
                <ServiceArt id={s.art} />
              </span>
            )}
            <span className="t-label ember">{s.kind}</span>
            <span className="mt-4 text-xl font-semibold tracking-tight text-bone md:text-2xl">
              {s.name} <span className="text-mute">in {market.name}</span>
            </span>
            <span className="t-body mt-2 text-sm">{s.short}</span>
            <span className="t-label mt-auto pt-6 !text-bone transition-transform duration-300 group-hover:translate-x-1">View service →</span>
          </TLink>
        </li>
      ))}
    </ul>
  );
}
