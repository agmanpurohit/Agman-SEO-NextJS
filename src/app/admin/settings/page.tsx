import type { Metadata } from "next";
import { isAdmin } from "@/lib/audit/admin-auth";
import { AdminLogin } from "@/components/audit/AdminControls";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getSiteSettings } from "@/lib/site/settings";
import { getSetting } from "@/lib/site/db";
import { DEFAULT_SETTINGS } from "@/lib/site/settings-shared";

export const metadata: Metadata = { title: "Site settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  if (!(await isAdmin())) {
    return (
      <section className="wrap flex min-h-[80svh] items-center pt-[var(--header-h)]">
        <AdminLogin />
      </section>
    );
  }
  const [settings, saved] = await Promise.all([getSiteSettings(), getSetting("site")]);
  return (
    <section className="wrap pt-[calc(var(--header-h)+2.5rem)] pb-20">
      <AdminTabs active="settings" title="Site settings" />
      <p className="t-body mt-5 max-w-[60rem] text-sm">Details used across the whole site. Saving updates every page straight away; no code or deploy needed.</p>
      <div className="mt-6">
        <SettingsForm initial={settings} defaults={DEFAULT_SETTINGS} isCustom={!!saved} />
      </div>
    </section>
  );
}
