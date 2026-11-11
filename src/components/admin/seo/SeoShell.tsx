import Link from "next/link";
import type { ReactNode } from "react";
import { isAdmin } from "@/lib/audit/admin-auth";
import { AdminLogin } from "@/components/audit/AdminControls";
import { AdminTabs } from "@/components/admin/AdminTabs";

export type SeoSection = "pages" | "robots" | "sitemap" | "redirects";
const SECTIONS: { key: SeoSection; href: string; label: string; hint: string }[] = [
  { key: "pages", href: "/admin/seo", label: "Pages", hint: "Titles, descriptions, canonicals, indexing and schema for every page" },
  { key: "robots", href: "/admin/seo/robots", label: "Robots.txt", hint: "What crawlers may access" },
  { key: "sitemap", href: "/admin/seo/sitemap", label: "Sitemap", hint: "Which URLs are listed for search engines" },
  { key: "redirects", href: "/admin/seo/redirects", label: "Redirects", hint: "Send old URLs to new ones" },
];

/** Layout for the SEO manager: sign-in gate, admin tabs, then the section switcher. */
export async function SeoShell({ section, title, intro, children }: { section: SeoSection; title: string; intro?: ReactNode; children: ReactNode }) {
  if (!(await isAdmin())) {
    return (
      <section className="wrap flex min-h-[80svh] items-center pt-[var(--header-h)]">
        <AdminLogin />
      </section>
    );
  }
  return (
    <section className="wrap pt-[calc(var(--header-h)+2.5rem)] pb-20">
      <AdminTabs active="seo" title={title} />
      <nav aria-label="SEO sections" className="mt-6 flex flex-wrap gap-2 border-b border-line pb-4">
        {SECTIONS.map((s) => (
          <Link
            key={s.key}
            href={s.href}
            aria-current={section === s.key ? "page" : undefined}
            title={s.hint}
            className={`rounded-md px-3.5 py-2 text-sm transition-colors ${section === s.key ? "bg-ink-3 text-bone" : "text-bone-dim hover:bg-ink-2 hover:text-bone"}`}
          >
            {s.label}
          </Link>
        ))}
      </nav>
      {intro && <div className="t-body mt-5 max-w-[60rem] text-sm">{intro}</div>}
      <div className="mt-8">{children}</div>
    </section>
  );
}

export const adminInput = "w-full rounded border border-line-2 bg-ink-2 px-3 py-2.5 text-sm text-bone outline-none transition-colors placeholder:text-mute focus:border-bone";
