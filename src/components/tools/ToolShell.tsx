import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { TLink } from "@/components/ui/TLink";
import { Reveal } from "@/components/ui/motion";
import { ButtonLink } from "@/components/ui/Buttons";
import { breadcrumbJsonLd, webPageJsonLd, absUrl } from "@/lib/seo";
import { site } from "@/content/site";
import { tools, toolBySlug, TOOLS_HUB, type ToolSlug } from "@/content/tools";
import { services } from "@/content/services";
import { ServicesStrip } from "@/components/services/ServicesStrip";
import { PageSchema } from "@/components/seo/PageSchema";
import { getSite } from "@/lib/site/settings";

export type ToolCopy = {
  slug: ToolSlug;
  /** H1 on the page. */
  h1: string;
  /** Short line under the H1. */
  lead: string;
  /** Same text as the meta description; used in structured data. */
  description: string;
  steps: { t: string; d: string }[];
  about: { heading: string; body: ReactNode };
  faq: { q: string; a: string }[];
  features: string[];
};

/**
 * Layout shared by every free tool page: hero, the interactive tool, how-to steps, an
 * explainer, FAQs, related tools and the structured data (WebApplication, FAQPage,
 * BreadcrumbList, WebPage). The tool is a client component passed as children; all the
 * text around it is server-rendered so search engines and AI agents can read it.
 */
export async function ToolShell({ copy, children }: { copy: ToolCopy; children: ReactNode }) {
  const live = await getSite();
  const tool = toolBySlug(copy.slug);
  const related = tools.filter((t) => t.slug !== copy.slug);

  const appLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    url: absUrl(tool.href),
    description: copy.description,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "SEO tool",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: copy.features.join(", "),
    creator: { "@id": `${site.url}/#person` },
    inLanguage: "en",
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: copy.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: TOOLS_HUB.label, path: TOOLS_HUB.href }, { name: tool.name, path: tool.href }])} />
      <JsonLd data={webPageJsonLd({ name: copy.h1, description: copy.description, path: tool.href })} />
      <JsonLd data={appLd} />
      <JsonLd data={faqLd} />
      <PageSchema path={tool.href} />

      <section className="pt-[calc(var(--header-h)+2.5rem)] md:pt-[calc(var(--header-h)+4rem)]">
        <div className="wrap">
          <nav aria-label="Breadcrumb" className="t-label flex flex-wrap items-center gap-2">
            <TLink href="/" className="hover:!text-bone">
              Home
            </TLink>
            <span aria-hidden="true">/</span>
            <TLink href={TOOLS_HUB.href} className="hover:!text-bone">
              {TOOLS_HUB.label}
            </TLink>
            <span aria-hidden="true">/</span>
            <span className="ember" aria-current="page">
              {tool.name}
            </span>
          </nav>
          <h1 className="mt-6 max-w-[18ch] text-[clamp(2.3rem,5.6vw,5.4rem)] leading-[0.98] font-extrabold tracking-[-0.04em]">{copy.h1}</h1>
          <p className="t-lead mt-6 max-w-[44rem] text-bone-dim">{copy.lead}</p>
          <p className="t-label mt-6 flex flex-wrap gap-x-5 gap-y-1">
            <span>
              <span className="ember">●</span> Free
            </span>
            <span>No sign-up</span>
            <span>Runs in your browser</span>
          </p>
        </div>
      </section>

      <section aria-label={`${tool.name} tool`} className="wrap mt-10 md:mt-14">
        {children}
        <p className="mt-4 max-w-[52rem] text-xs leading-relaxed text-mute">
          Privacy: what you enter in this tool is saved with your IP address and approximate location, so I can see how the tools are used and stop abuse. It&apos;s never shared or sold, and
          it&apos;s deleted automatically after 12 months. To have it removed sooner, email{" "}
          <a href={`mailto:${live.email}`} className="text-bone-dim underline underline-offset-2 hover:text-bone">
            {live.email}
          </a>
          .
        </p>
      </section>

      <section aria-labelledby="how-title" className="section">
        <div className="wrap grid-12 gap-y-8">
          <p className="t-label col-span-4 md:col-span-3">
            <span className="ember">A</span> — How to use it
          </p>
          <div className="col-span-4 md:col-span-9">
            <h2 id="how-title" className="t-h2">
              How to use the {tool.name.toLowerCase()}
            </h2>
            <Reveal as="ol" childrenStagger className="mt-10 grid gap-8 md:grid-cols-3">
              {copy.steps.map((s, i) => (
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

      <section aria-labelledby="about-title" className="section border-t border-line">
        <div className="wrap grid-12 gap-y-8">
          <p className="t-label col-span-4 md:col-span-3">
            <span className="ember">B</span> — Why it matters
          </p>
          <div className="col-span-4 md:col-span-9">
            <h2 id="about-title" className="t-h2 max-w-[22ch]">
              {copy.about.heading}
            </h2>
            <div className="t-body mt-8 max-w-[52rem] space-y-4 [&_strong]:text-bone [&_a]:text-bone [&_a]:underline [&_a]:decoration-ember [&_a]:underline-offset-4">{copy.about.body}</div>
          </div>
        </div>
      </section>

      <section aria-labelledby="faq-title" className="section border-t border-line">
        <div className="wrap grid-12 gap-y-8">
          <p className="t-label col-span-4 md:col-span-3">
            <span className="ember">C</span> — Questions
          </p>
          <div className="col-span-4 md:col-span-9">
            <h2 id="faq-title" className="t-h2">
              Frequently asked questions
            </h2>
            <div className="mt-8 border-t border-line">
              {copy.faq.map((f) => (
                <details key={f.q} className="group border-b border-line py-5">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-lg font-medium text-bone md:text-xl">
                    {f.q}
                    <span aria-hidden="true" className="mt-1 text-ember transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="t-body mt-3 max-w-[52rem]">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ServicesStrip title="Rather have it done for you?" intro="I offer this as part of my services for Indian businesses." highlight={services.filter((sv) => sv.tools.includes(copy.slug)).map((sv) => sv.slug)} />

      <section aria-labelledby="more-title" className="section border-t border-line">
        <div className="wrap">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 id="more-title" className="t-h2">
              More free SEO tools
            </h2>
            <ButtonLink href={TOOLS_HUB.href} variant="ghost">
              All tools
            </ButtonLink>
          </div>
          <ul className="mt-10 grid gap-px border-y border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {related.map((t) => (
              <li key={t.slug} className="bg-ink">
                <TLink href={t.href} className="group flex h-full flex-col p-6 transition-colors hover:bg-ink-2 md:p-8" data-cursor="Open">
                  <span className="t-label ember">{t.kind}</span>
                  <span className="mt-4 text-xl font-semibold tracking-tight text-bone md:text-2xl">{t.name}</span>
                  <span className="t-body mt-2 text-sm">{t.short}</span>
                  <span className="t-label mt-6 !text-bone transition-transform group-hover:translate-x-1">Open tool →</span>
                </TLink>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
