import { SplitReveal, Reveal } from "@/components/ui/motion";
import { SectionLabel } from "@/components/ui/Buttons";
import { AuditForm, AuditBadges } from "@/components/audit/AuditForm";
import { TLink } from "@/components/ui/TLink";
import { CATEGORIES, CATEGORY_META } from "@/lib/audit/types";
import { auditTool } from "@/content/site";

/** Homepage entry point for the free SEO audit tool. */
export function AuditTeaser() {
  return (
    <section aria-labelledby="audit-teaser-title" className="section relative border-t border-line">
      <div className="wrap grid-12 gap-y-10">
        <div className="col-span-4 md:col-span-12">
          <SectionLabel index="06">Free tool</SectionLabel>
        </div>
        <div className="col-span-4 md:col-span-7">
          <SplitReveal as="h2" id="audit-teaser-title" className="t-h2">
            Free Website SEO Audit Tool
          </SplitReveal>
          <Reveal as="p" className="t-lead mt-5 max-w-[36rem] text-bone-dim">
            Enter your URL and get a real crawl of your site, scored across eight areas, with the exact pages to fix and how to fix them.
          </Reveal>
          <Reveal className="mt-8 max-w-[44rem]">
            <AuditForm size="md" />
            <AuditBadges className="mt-2" />
          </Reveal>
        </div>
        <Reveal as="ul" childrenStagger y={20} className="col-span-4 grid grid-cols-2 gap-px self-start border border-line bg-line md:col-span-4 md:col-start-9">
          {CATEGORIES.map((c) => (
            <li key={c} className="bg-ink p-4">
              <span className="t-label">{CATEGORY_META[c].weight}%</span>
              <span className="mt-1 block text-sm font-medium text-bone">{CATEGORY_META[c].label}</span>
            </li>
          ))}
          <li className="col-span-2 bg-ink p-4">
            <TLink href={auditTool.href} className="link-u t-label !text-bone">
              How the audit works →
            </TLink>
          </li>
        </Reveal>
      </div>
    </section>
  );
}
