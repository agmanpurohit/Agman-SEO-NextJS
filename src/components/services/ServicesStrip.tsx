import { TLink } from "@/components/ui/TLink";
import { markets, services, servicePath, marketPath, type ServiceSlug } from "@/content/services";

/**
 * Compact block of links to the India service pages, placed on existing pages (work,
 * experience, blog, tools, contact) so the old and new pages are all connected.
 * `highlight` puts the most relevant services first.
 */
export function ServicesStrip({ title = "Hire me for this in India", intro, highlight = [], className = "" }: { title?: string; intro?: string; highlight?: ServiceSlug[]; className?: string }) {
  const m = markets.india;
  const list = [...services].sort((a, b) => Number(highlight.includes(b.slug)) - Number(highlight.includes(a.slug)));
  return (
    <section aria-label={`Services in ${m.name}`} className={`border-t border-line ${className}`}>
      <div className="wrap py-14 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="t-label">
              <span className="ember">●</span> Services · {m.name}
            </p>
            <h2 className="t-h3 mt-3">{title}</h2>
            {intro && <p className="t-body mt-2 max-w-[44rem] text-sm">{intro}</p>}
          </div>
          <TLink href={marketPath(m.slug)} className="t-label !text-bone transition-colors hover:!text-ember">
            All services in {m.name} →
          </TLink>
        </div>
        <ul className="mt-6 flex flex-wrap gap-2">
          {list.map((s) => (
            <li key={s.slug}>
              <TLink
                href={servicePath(m.slug, s.slug)}
                className={`inline-flex items-center rounded-full border px-4 py-2 text-sm transition-colors hover:border-ember hover:text-ember ${highlight.includes(s.slug) ? "border-ember/60 text-bone" : "border-line-2 text-bone-dim"}`}
              >
                {s.name}
              </TLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
