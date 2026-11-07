import { pageMeta, breadcrumbJsonLd, webPageJsonLd, absUrl } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/motion";
import { TLink } from "@/components/ui/TLink";
import { tools, TOOLS_HUB } from "@/content/tools";

const TITLE = "Free SEO Tools: Audit, Schema & Meta Tags";
const DESCRIPTION = "Free SEO tools I use in client work: a full site audit, keyword density checker, meta tag and schema generators, SERP preview, robots.txt and sitemaps.";

export const metadata = pageMeta({ title: TITLE, description: DESCRIPTION, path: TOOLS_HUB.href, socialTitle: "Free SEO tools, no sign-up" });

const listLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Free SEO tools",
  numberOfItems: tools.length,
  itemListElement: tools.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, url: absUrl(t.href) })),
};

export default function FreeSeoToolsPage() {
  const [audit, ...rest] = tools;
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: TOOLS_HUB.label, path: TOOLS_HUB.href }])} />
      <JsonLd data={webPageJsonLd({ type: "CollectionPage", name: TITLE, description: DESCRIPTION, path: TOOLS_HUB.href })} />
      <JsonLd data={listLd} />

      <PageHero
        index="05"
        title="Tools"
        display={
          <>
            Free SEO tools, <span className="ember">no sign-up.</span>
          </>
        }
        aside={<p className="t-label">{tools.length} tools · All free</p>}
      >
        <h2 className="sr-only">Free SEO tools</h2>
        <p>The same checks and generators I reach for in client work, cleaned up so anyone can use them. Most run entirely in your browser, and nothing you type is stored.</p>
      </PageHero>

      <section aria-label="All tools" className="wrap pb-20 md:pb-28">
        <Reveal>
          <TLink href={audit.href} className="group grid gap-8 border border-line bg-ink-2/60 p-6 transition-colors hover:border-ember/60 md:grid-cols-[1.2fr_1fr] md:items-end md:p-10" data-cursor="Audit">
            <div>
              <p className="t-label ember">Most complete · {audit.kind}</p>
              <h3 className="mt-4 text-[clamp(2rem,4.4vw,3.8rem)] leading-none font-bold tracking-[-0.03em] text-bone">{audit.name}</h3>
              <p className="t-lead mt-4 max-w-[34rem] text-bone-dim">
                Crawls up to 100 pages and checks technical SEO, content, speed, mobile, links, images and structured data, then gives you a prioritised list of fixes.
              </p>
            </div>
            <div className="flex md:justify-end">
              <span className="btn btn-primary">
                <span>Run a free audit</span>
              </span>
            </div>
          </TLink>
        </Reveal>

        <Reveal as="ul" childrenStagger className="mt-px grid gap-px border-x border-b border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((t, i) => (
            <li key={t.slug} className="bg-ink">
              <TLink href={t.href} className="group flex h-full flex-col p-6 transition-colors hover:bg-ink-2 md:p-8" data-cursor="Open">
                <div className="flex items-baseline justify-between">
                  <span className="t-label ember">{t.kind}</span>
                  <span aria-hidden="true" className="t-mono text-xs text-mute">
                    {String(i + 2).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-6 text-2xl font-semibold tracking-tight text-bone md:text-[1.7rem]">{t.name}</h3>
                <p className="t-body mt-3 text-[0.95rem]">{t.short}</p>
                <span className="t-label mt-auto pt-8 !text-bone transition-transform duration-300 group-hover:translate-x-1">Open tool →</span>
              </TLink>
            </li>
          ))}
        </Reveal>

        <div className="mt-16 grid gap-8 md:mt-24 md:grid-cols-12">
          <h2 className="t-h3 md:col-span-4">Why give these away?</h2>
          <div className="t-body space-y-4 md:col-span-7 md:col-start-6">
            <p>
              Most SEO problems I find on client sites are simple: a title that gets cut off, a robots.txt blocking the wrong folder, a sitemap full of redirects, schema with missing fields. They're quick to
              fix once you can see them. These tools make them visible.
            </p>
            <p>
              They're free, there's no account, and there are no usage tricks to push you into a paid plan. If you find something you'd rather have someone else handle,{" "}
              <TLink href="/contact" className="link-u text-bone">
                get in touch
              </TLink>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
