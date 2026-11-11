import { nav, site } from "@/content/site";
import { markets, services, servicePath, marketPath } from "@/content/services";
import { TLink } from "@/components/ui/TLink";
import { Logo } from "@/components/brand/Logo";
import { LocalTime } from "@/components/ui/LocalTime";
import { getSite } from "@/lib/site/settings";

export async function Footer() {
  const live = await getSite();
  const year = new Date().getFullYear();
  return (
    <footer className="relative border-t border-line">
      <div className="wrap grid-12 gap-y-12 pt-20 pb-10 md:pt-28">
        <div className="col-span-4 md:col-span-4">
          <p className="t-label mb-5">Contact</p>
          <a href={`mailto:${live.email}`} className="link-u text-[clamp(1.25rem,2.4vw,2rem)] font-medium break-all text-bone" data-cursor="Email">
            {live.email}
          </a>
          <ul className="mt-8 flex flex-col gap-3">
            {live.locations.map((l) => (
              <li key={l.city} className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="t-label w-28 !text-bone">
                  {l.city}, {l.country}
                </span>
                <a href={l.phoneHref} className="link-u t-mono text-sm text-bone-dim hover:text-bone">
                  {l.phone}
                </a>
                <LocalTime timeZone={l.timezone} className="t-mono text-xs text-mute" />
              </li>
            ))}
          </ul>
        </div>

        {/* Every service page is linked from every page, so crawlers can reach all of them. */}
        <nav aria-label="Services in India" className="col-span-4 md:col-span-3 md:col-start-6">
          <p className="t-label mb-5">
            <TLink href={marketPath("india")} className="hover:!text-bone">
              Services · {markets.india.name}
            </TLink>
          </p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-1">
            {services.map((s) => (
              <li key={s.slug}>
                <TLink href={servicePath("india", s.slug)} className="link-u text-bone-dim hover:text-bone">
                  {s.name}
                </TLink>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Footer" className="col-span-2 md:col-span-2 md:col-start-9">
          <p className="t-label mb-5">Pages</p>
          <ul className="flex flex-col gap-2">
            {nav.map((n) => (
              <li key={n.href}>
                <TLink href={n.href} className="link-u text-bone-dim hover:text-bone">
                  {n.label}
                </TLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="col-span-2 md:col-span-2">
          <p className="t-label mb-5">Elsewhere</p>
          <ul className="flex flex-col gap-2">
            <li>
              <a href={live.linkedin} target="_blank" rel="noopener noreferrer" className="link-u text-bone-dim hover:text-bone">
                LinkedIn ↗
              </a>
            </li>
            {live.locations[0].whatsapp && (
              <li>
                <a href={live.locations[0].whatsapp} target="_blank" rel="noopener noreferrer" className="link-u text-bone-dim hover:text-bone">
                  WhatsApp ↗
                </a>
              </li>
            )}
            <li>
              <a href={site.cv} download className="link-u text-bone-dim hover:text-bone">
                Download CV ↓
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="wrap pb-6" aria-hidden="true">
        <Logo variant="word" title={null} className="w-full text-bone/[0.08]" accent={false} />
      </div>

      <div className="wrap flex flex-col gap-2 border-t border-line py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="t-label">© {year} {site.name}</p>
        <p className="t-label">
          {site.role} · Dubai, UAE
        </p>
      </div>
    </footer>
  );
}
