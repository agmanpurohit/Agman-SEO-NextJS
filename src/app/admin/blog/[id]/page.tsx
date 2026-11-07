import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/audit/admin-auth";
import { getPostById, listCategories } from "@/lib/blog/db";
import { AdminLogin } from "@/components/audit/AdminControls";
import { PostEditor } from "@/components/admin/PostEditor";

export const metadata: Metadata = { title: "Edit post", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return (
      <section className="wrap flex min-h-[80svh] items-center pt-[var(--header-h)]">
        <AdminLogin />
      </section>
    );
  }
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const post = await getPostById(id);
  if (!post) notFound();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _i, contentHtml, toc, wordCount, readingMinutes, seoScore, createdAt, updatedAt, ...input } = post;
  return (
    <section className="wrap pt-[var(--header-h)]">
      <PostEditor key={post.id} id={post.id} initial={input} categories={await listCategories()} />
    </section>
  );
}
