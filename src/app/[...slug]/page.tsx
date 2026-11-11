import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLivePage, listLivePages } from "@/lib/pages/db";
import { SLUG_RE, RESERVED, pagePath } from "@/lib/pages/types";
import { pageMeta } from "@/lib/seo";
import { withSeo } from "@/lib/site/seo";
import { BuilderPageView } from "@/components/pages/BuilderPageView";
import { PageSchema } from "@/components/seo/PageSchema";

/**
 * Pages made in Admin → Pages. Every other route on the site is more specific and wins, so
 * this only answers URLs that no coded page uses. Unknown URLs get the normal 404 page.
 */
export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    return (await listLivePages()).map((p) => ({ slug: p.slug.split("/") }));
  } catch {
    return [];
  }
}

async function load(parts: string[]) {
  const slug = parts.map((p) => decodeURIComponent(p)).join("/");
  if (!SLUG_RE.test(slug) || RESERVED.includes(slug.split("/")[0])) return null;
  try {
    return await getLivePage(slug);
  } catch (e) {
    console.error("builder page load failed", e);
    return null;
  }
}

const describe = (p: { metaDescription: string; title: string }) => p.metaDescription || p.title;

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const page = await load((await params).slug);
  if (!page) return { title: "Page not found", robots: { index: false } };
  const path = pagePath(page.slug);
  const base = pageMeta({
    title: page.metaTitle || page.title,
    absoluteTitle: !!page.metaTitle,
    description: describe(page),
    path,
    image: page.ogImage ? { url: page.ogImage, alt: page.title } : undefined,
  });
  if (page.noindex) base.robots = { index: false, follow: true };
  return withSeo(base, path);
}

export default async function BuilderRoute({ params }: { params: Promise<{ slug: string[] }> }) {
  const page = await load((await params).slug);
  if (!page) notFound();
  const path = pagePath(page.slug);
  return (
    <>
      <BuilderPageView page={page} path={path} description={describe(page)} />
      <PageSchema path={path} />
    </>
  );
}
