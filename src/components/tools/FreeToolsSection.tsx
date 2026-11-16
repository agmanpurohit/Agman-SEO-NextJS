import { TLink } from "@/components/ui/TLink";
import { tools, TOOLS_HUB } from "@/content/tools";

/**
 * Every free SEO tool as a grid of linked cards. Built from the shared tools list, so it
 * appears on every blog post automatically and picks up new tools without any edits.
 * The audit leads (wider card); the rest follow in list order.
 */
export function FreeToolsSection({ title = "Free SEO tools to put this into practice", intro = "No sign-up needed. Check your own site with the same tools I use for client work." }: { title?: string; intro?: string }) {
  return (
    <section aria-labelledby="free-tools-title" className="border-t border-line">
      <div className="wrap py-14 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="t-label">
              <span className="ember">●</span> {TOOLS_HUB.label}
            </p>
            <h2 id="free-tools-title" className="t-h3 mt-3">
              {title}
            </h2>
            {intro && <p className="t-body mt-2 max-w-[44rem] text-sm">{intro}</p>}
          </div>
          <TLink href={TOOLS_HUB.href} className="t-label !text-bone transition-colors hover:!text-ember">
            All free tools →
          </TLink>
        </div>

        <ul className="mt-8 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((t, i) => {
            const lead = i === 0;
            return (
              <li key={t.slug} className={`bg-ink ${lead ? "sm:col-span-2" : ""}`}>
                <TLink href={t.href} className="group flex h-full flex-col p-5 transition-colors hover:bg-ink-2 md:p-6" data-cursor="Open">
                  <span className="t-label ember">{t.kind}</span>
                  <span className={`mt-3 font-semibold tracking-tight text-bone ${lead ? "text-xl md:text-2xl" : "text-lg"}`}>{t.name}</span>
                  <span className="t-body mt-1.5 text-sm">{t.short}</span>
                  <span className="t-label mt-auto pt-5 !text-bone transition-transform duration-300 group-hover:translate-x-1">{lead ? "Run a free audit →" : "Open tool →"}</span>
                </TLink>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
