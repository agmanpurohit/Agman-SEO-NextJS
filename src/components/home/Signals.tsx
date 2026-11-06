import { Counter, Reveal, SplitReveal } from "@/components/ui/motion";
import { SectionLabel } from "@/components/ui/Buttons";
import { signals } from "@/content/home";

/** Verified results as large editorial numerals. Each says exactly where it comes from. */
export function Signals() {
  return (
    <section aria-labelledby="signals-title" className="section">
      <div className="wrap grid-12 gap-y-8">
        <div className="col-span-4 md:col-span-12">
          <SectionLabel index="03">Ranking signals</SectionLabel>
        </div>
        <SplitReveal as="h2" id="signals-title" className="t-h2 col-span-4 md:col-span-7">
          Numbers from real accounts, not projections.
        </SplitReveal>
        <Reveal as="p" className="t-body col-span-4 self-end md:col-span-4 md:col-start-9">
          Taken from Search Console, GA4, Google Business Profile and client records. Clients stay anonymous; the work speaks for itself.
        </Reveal>
      </div>

      <div className="wrap mt-10 md:mt-14">
      <Reveal as="dl" childrenStagger y={50} className="grid grid-cols-1 gap-px border-y border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {signals.map((s) => (
          <div
            key={s.label}
            className="group relative flex flex-col justify-between gap-10 bg-ink py-10 sm:px-6 lg:min-h-[22rem] lg:px-8 lg:py-12"
          >
            <dt className="order-2">
              <span className="block text-lg font-medium text-bone">{s.label}</span>
              <span className="t-body mt-1 block text-sm">{s.context}</span>
            </dt>
            <dd className="order-1 text-[clamp(4.5rem,9vw,9rem)] leading-[0.85] font-light tracking-[-0.05em] tabular-nums transition-[font-stretch] duration-700 group-hover:[font-stretch:120%]" style={{ fontStretch: "88%" }}>
              <Counter value={s.value} prefix={s.prefix} suffix={s.suffix} />
            </dd>
          </div>
        ))}
      </Reveal>
      </div>
    </section>
  );
}
