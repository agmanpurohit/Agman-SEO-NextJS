import type { Metadata } from "next";
import { isAdmin } from "@/lib/audit/admin-auth";
import { AdminLogin } from "@/components/audit/AdminControls";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { MediaBrowser } from "@/components/admin/media/MediaBrowser";
import { listMediaItems } from "@/lib/media/db";

export const metadata: Metadata = { title: "Media library" };
export const dynamic = "force-dynamic";

export default async function MediaPage() {
  if (!(await isAdmin())) {
    return (
      <section className="wrap flex min-h-[80svh] items-center pt-[var(--header-h)]">
        <AdminLogin />
      </section>
    );
  }
  return (
    <section className="wrap pt-[calc(var(--header-h)+2.5rem)] pb-20">
      <AdminTabs active="media" title="Media library" />
      <p className="t-body mt-5 max-w-[60rem] text-sm">
        Every image uploaded to the site. Add alt text once here and it's filled in automatically whenever you insert the image. File addresses never change, so renaming or editing
        details is always safe.
      </p>
      <div className="mt-8">
        <MediaBrowser mode="manage" initial={await listMediaItems()} />
      </div>
    </section>
  );
}
