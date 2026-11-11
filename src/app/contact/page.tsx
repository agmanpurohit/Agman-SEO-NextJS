import { pageMeta, breadcrumbJsonLd, webPageJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHero } from "@/components/ui/PageHero";
import { ContactForm } from "@/components/contact/ContactForm";
import { Reveal } from "@/components/ui/motion";
import { LocalTime } from "@/components/ui/LocalTime";
import { site } from "@/content/site";
import { ServicesStrip } from "@/components/services/ServicesStrip";
import { withSeo } from "@/lib/site/seo";
import { PageSchema } from "@/components/seo/PageSchema";

const TITLE = "Hire an SEO Specialist in Dubai";
const DESCRIPTION =
  "Hiring for SEO in the UAE, or need help with your website? Send a message, call or WhatsApp me. I'm based in Dubai and available to start now.";

export const generateMetadata = () => withSeo(pageMeta({ title: TITLE, description: DESCRIPTION, path: "/contact", socialTitle: "Contact Agman Rajpurohit" }));

const contactPage = webPageJsonLd({ type: "ContactPage", name: TITLE, description: DESCRIPTION, path: "/contact" });

export default function ContactPage() {
  return (
    <>
      <PageSchema path={"/contact"} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])} />
      <JsonLd data={contactPage} />
      <PageHero
        index="06"
        title="Contact"
        display={
          <>
            Have a role to fill, or a site that <span className="ember">should</span> rank?
          </>
        }
      >
        <p>
          Recruiters, hiring managers and business owners: tell me what you&apos;re working on. I read every message myself and reply from my
          own inbox.
        </p>
      </PageHero>

      <section aria-label="Contact form and details" className="pb-16 md:pb-24">
        <div className="wrap grid-12 gap-y-16">
          <Reveal className="col-span-4 md:col-span-7">
            <h2 className="t-label mb-8">
              <span className="ember">A</span> — Send a message
            </h2>
            <ContactForm />
          </Reveal>

          <Reveal as="aside" className="col-span-4 md:col-span-4 md:col-start-9" aria-label="Direct contact details">
            <h2 className="t-label mb-8">
              <span className="ember">B</span> — Direct
            </h2>

            <div className="border-t border-line py-6">
              <p className="t-label">Email</p>
              <a href={`mailto:${site.email}`} className="link-u mt-2 inline-block text-xl break-all text-bone" data-cursor="Email">
                {site.email}
              </a>
            </div>

            {site.locations.map((l) => (
              <div key={l.city} className="border-t border-line py-6">
                <div className="flex items-baseline justify-between">
                  <p className="t-label">
                    {l.city}, {l.country}
                    {l.primary && <span className="ember"> · Based here</span>}
                  </p>
                  <LocalTime timeZone={l.timezone} className="t-mono text-xs text-mute" />
                </div>
                <a href={l.phoneHref} className="link-u mt-2 inline-block text-xl text-bone">
                  {l.phone}
                </a>
                {l.whatsapp && (
                  <a href={l.whatsapp} target="_blank" rel="noopener noreferrer" className="t-label mt-3 flex items-center gap-2 !text-bone hover:!text-ember">
                    <span className="h-1.5 w-1.5 rounded-full bg-ember" aria-hidden="true" />
                    Message on WhatsApp ↗
                  </a>
                )}
              </div>
            ))}

            <div className="border-t border-line py-6">
              <p className="t-label">Elsewhere</p>
              <ul className="mt-3 flex flex-col gap-2">
                <li>
                  <a href={site.linkedin} target="_blank" rel="noopener noreferrer" className="link-u text-lg text-bone">
                    LinkedIn ↗
                  </a>
                </li>
                <li>
                  <a href={site.cv} download className="link-u text-lg text-bone">
                    Download CV (PDF) ↓
                  </a>
                </li>
              </ul>
            </div>

            <div className="border-t border-line py-6">
              <p className="t-label">Availability</p>
              <p className="mt-2 text-bone">{site.availabilityLong}</p>
            </div>
          </Reveal>
        </div>
      </section>
      <ServicesStrip title="Not sure what you need?" intro="Have a look at the services first. Each page explains what is included and how I work." />
    </>
  );
}
