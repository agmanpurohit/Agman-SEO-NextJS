import { pageMeta, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHero } from "@/components/ui/PageHero";
import { Timeline } from "@/components/experience/Timeline";
import { Reveal, SplitReveal } from "@/components/ui/motion";
import { ButtonA } from "@/components/ui/Buttons";
import { Closing } from "@/components/home/Closing";
import { capabilities, tools, education, certifications } from "@/content/experience";
import { site } from "@/content/site";

export const metadata = pageMeta({
  title: "Experience — SEO Executive & Digital Marketing",
  description:
    "Agman Rajpurohit's career in SEO and digital marketing: NCS GX, MediaNV and Diya Infotech, plus freelance Google Ads, Meta Ads and web projects. Capabilities, tools, education and certifications.",
  path: "/experience",
});

const toolGroups = Array.from(new Set(tools.map((t) => t.group)));

export default function ExperiencePage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Experience", path: "/experience" }])} />
      <PageHero
        index="02"
        title="Experience"
        display={
          <>
            From the first audit to <span className="ember">four markets</span> on one domain.
          </>
        }
        aside={
          <div className="flex flex-col gap-4">
            <p className="t-label">{site.availability} · Dubai, UAE</p>
            <div>
              <ButtonA href={site.cv} download arrow="down" variant="primary" cursor="PDF">
                Download CV
              </ButtonA>
            </div>
          </div>
        }
      >
        <p>
          I moved into SEO in March 2024 and have worked inside live accounts ever since: an agency portfolio of 25+ sites, more than a hundred
          dental builds, and a financial-services domain serving four markets. Here&apos;s what each role asked of me and what it left behind.
        </p>
      </PageHero>

      <Timeline />

      {/* Capabilities */}
      <section aria-labelledby="cap-title" className="section border-t border-line">
        <div className="wrap grid-12 gap-y-8">
          <p className="t-label col-span-4 md:col-span-3">
            <span className="ember">B</span> — Capabilities
          </p>
          <SplitReveal as="h2" id="cap-title" className="t-h2 col-span-4 md:col-span-9">
            What each skill is actually for.
          </SplitReveal>
        </div>
        <Reveal as="ul" childrenStagger className="wrap mt-10 grid grid-cols-1 gap-px border-y border-line bg-line md:mt-14 md:grid-cols-2 xl:grid-cols-3">
          {capabilities.map((c, i) => (
            <li key={c.name} className="group flex flex-col bg-ink p-6 transition-colors duration-500 hover:bg-ink-2 md:p-10">
              <span className="t-label ember">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="t-h3 mt-6">{c.name}</h3>
              <p className="mt-3 text-lg text-bone">{c.outcome}</p>
              <ul className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-8">
                {c.items.map((it) => (
                  <li key={it} className="t-label">
                    {it}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </Reveal>
      </section>

      {/* Tools */}
      <section aria-labelledby="tools-title" className="section pt-0">
        <div className="wrap grid-12 gap-y-8">
          <p className="t-label col-span-4 md:col-span-3">
            <span className="ember">C</span> — Tools
          </p>
          <div className="col-span-4 md:col-span-9">
            <SplitReveal as="h2" id="tools-title" className="t-h2">
              The stack I use every week.
            </SplitReveal>
            <div className="mt-12 flex flex-col">
              {toolGroups.map((g) => (
                <Reveal key={g} className="grid grid-cols-1 gap-3 border-t border-line py-6 md:grid-cols-[10rem_1fr]">
                  <h3 className="t-label pt-2">{g}</h3>
                  <ul className="flex flex-wrap gap-x-2 gap-y-2">
                    {tools
                      .filter((t) => t.group === g)
                      .map((t) => (
                        <li
                          key={t.name}
                          className="rounded-full border border-line-2 px-4 py-2 text-[clamp(1rem,1.4vw,1.25rem)] text-bone transition-[border-color,background-color,color] duration-300 hover:border-ember hover:bg-ember hover:text-ink"
                        >
                          {t.name}
                        </li>
                      ))}
                  </ul>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Education & certifications */}
      <section aria-labelledby="edu-title" className="section border-t border-line">
        <div className="wrap grid-12 gap-y-12">
          <p className="t-label col-span-4 md:col-span-3">
            <span className="ember">D</span> — Education &amp; certifications
          </p>
          <div className="col-span-4 md:col-span-9">
            <h2 id="edu-title" className="sr-only">
              Education and certifications
            </h2>
            <Reveal className="border-b border-line pb-10">
              <p className="t-label">{education.years}</p>
              <h3 className="t-h3 mt-3">{education.degree}</h3>
              <p className="t-body mt-1">{education.school}</p>
            </Reveal>

            <Reveal as="ul" childrenStagger className="flex flex-col">
              {certifications
                .filter((c) => c.group === "Marketing")
                .map((c) => (
                  <li key={c.name} className="grid grid-cols-[1fr_auto] gap-4 border-b border-line py-6">
                    <div>
                      <h3 className="text-xl font-medium">{c.name}</h3>
                      <p className="t-body text-sm">{c.issuer}</p>
                    </div>
                    <span className="t-label pt-1.5">{c.date}</span>
                  </li>
                ))}
            </Reveal>

            <Reveal className="mt-16">
              <h3 className="t-label mb-2 !text-bone">Technical background</h3>
              <p className="t-body max-w-[40rem]">
                A computer-applications degree, full-stack training and security certifications. They sit behind the marketing work: they&apos;re why I
                read a site&apos;s code, server responses and structure as comfortably as its copy.
              </p>
              <ul className="mt-6 flex flex-col">
                {certifications
                  .filter((c) => c.group === "Technical background")
                  .map((c) => (
                    <li key={c.name} className="grid grid-cols-[1fr_auto] gap-4 border-t border-line py-4 text-bone-dim">
                      <div>
                        <span className="text-bone">{c.name}</span>
                        <span className="block text-sm">{c.issuer}</span>
                      </div>
                      <span className="t-label pt-1">{c.date}</span>
                    </li>
                  ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      <Closing
        label="Hiring?"
        headline={["Looking for an SEO who", "can start on Monday?"]}
        body="I'm available immediately for full-time SEO and digital marketing roles in Dubai and across the UAE. Send the role over, or download my CV and share it with your team."
      />
    </>
  );
}
