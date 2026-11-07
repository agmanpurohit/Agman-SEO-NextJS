import Link from "next/link";
import { AdminLogout, ClearCacheButton } from "@/components/audit/AdminControls";

/** Shared header for the admin area: section tabs + sign out. */
export function AdminTabs({ active, title, actions }: { active: "leads" | "blog"; title: string; actions?: React.ReactNode }) {
  const tab = (key: string, href: string, label: string) => (
    <Link
      href={href}
      aria-current={active === key ? "page" : undefined}
      className={`rounded-full border px-4 py-2 text-sm transition-colors ${active === key ? "border-bone bg-bone text-ink" : "border-line-2 text-bone-dim hover:border-bone hover:text-bone"}`}
    >
      {label}
    </Link>
  );
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="t-label ember mr-2">Admin</span>
          {tab("leads", "/admin", "Audit leads")}
          {tab("blog", "/admin/blog", "Blog")}
        </div>
        <h1 className="t-h2 mt-4">{title}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {actions}
        <ClearCacheButton />
        <AdminLogout />
      </div>
    </div>
  );
}
