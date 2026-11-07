import type { Metadata } from "next";
import { isAdmin } from "@/lib/audit/admin-auth";
import { listCategories } from "@/lib/blog/db";
import { emptyPost } from "@/lib/blog/types";
import { AdminLogin } from "@/components/audit/AdminControls";
import { PostEditor } from "@/components/admin/PostEditor";

export const metadata: Metadata = { title: "New post" };
export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  if (!(await isAdmin())) {
    return (
      <section className="wrap flex min-h-[80svh] items-center pt-[var(--header-h)]">
        <AdminLogin />
      </section>
    );
  }
  return (
    <section className="wrap pt-[var(--header-h)]">
      <PostEditor initial={emptyPost()} categories={await listCategories()} />
    </section>
  );
}
