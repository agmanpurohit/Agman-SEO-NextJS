import type { Metadata } from "next";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import { getLivePostBySlug, listLivePosts, resolveRedirect } from "@/lib/blog/db";
import { effectiveMetaDescription, effectiveMetaTitle } from "@/lib/blog/seo-analysis";
import { breadcrumbJsonLd, absUrl } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { TLink } from "@/components/ui/TLink";
import { ButtonLink } from "@/components/ui/Buttons";
import { Cover, PostCard, fmtDate } from "@/components/blog/PostCard";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { ShareLinks } from "@/components/blog/ShareLinks";
import { site } from "@/content/site";

export const revalidate = 3600;
export const dynamicParams = true;

const abs = (u: string | null) => (!u ? null : u.startsWith("/") ? `${site.url}${u}` : u);

export async function generateStaticParams() {
  try {
    return (await listLivePosts()).map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

async function load(slug: string) {
  if (!/^[a-z0-9-]{1,100}$/.test(slug)) return null;
  try {
    return await getLivePostBySlug(slug);
  } catch (e) {
    console.error("blog post load failed", e);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await load(slug);
  if (!post) return { title: "Article not found", robots: { index: false } };
  const title = effectiveMetaTitle(post);
  const description = effectiveMetaDescription(post);
  const url = absUrl(`/blog/${post.slug}`);
  const image = abs(post.ogImage) ?? abs(post.coverImage);
  return {
    // A custom SEO title is used exactly as written; otherwise the site name is appended.
    title: post.metaTitle ? { absolute: post.metaTitle } : title,
    description,
    keywords: [post.focusKeyword, ...post.secondaryKeywords, ...post.tags].filter(Boolean),
    alternates: { canonical: post.canonicalUrl || url },
    robots: { index: !post.noindex, follow: !post.nofollow, googleBot: { index: !post.noindex, follow: !post.nofollow, "max-image-preview": "large" } },
    authors: [{ name: site.name, url: site.url }],
    openGraph: {
      type: "article",
      url,
      title: post.ogTitle || title,
      description: post.ogDescription || description,
      siteName: site.name,
      locale: "en_AE",
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      authors: [site.url],
      section: post.category || undefined,
      tags: post.tags,
      images: image ? [{ url: image, alt: post.coverAlt || post.title }] : [{ url: "/opengraph-image", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title: post.ogTitle || title, description: post.ogDescription || description, images: image ? [image] : ["/opengraph-image"] },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await load(slug);
  if (!post) {
    const moved = await resolveRedirect(slug).catch(() => null);
    if (moved) permanentRedirect(`/blog/${moved}`);
    notFound();
  }

  const url = absUrl(`/blog/${post.slug}`);
  const all = await listLivePosts().catch(() => []);
  const others = all.filter((p) => p.id !== post.id);
  const related = [...others.filter((p) => post.category && p.category === post.category), ...others.filter((p) => !post.category || p.category !== post.category)].slice(0, 3);
  const edited = post.publishedAt && new Date(post.updatedAt).getTime() - new Date(post.publishedAt).getTime() > 86_400_000;
  const image = abs(post.coverImage);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.title.slice(0, 110),
    description: effectiveMetaDescription(post),
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Person", "@id": `${site.url}/#person`, name: site.name, url: site.url },
    publisher: { "@id": `${site.url}/#person` },
    ...(image ? { image: [image] } : {}),
    ...(post.category ? { articleSection: post.category } : {}),
    keywords: [post.focusKeyword, ...post.secondaryKeywords, ...post.tags].filter(Boolean).join(", ") || undefined,
    wordCount: post.wordCount,
    timeRequired: `PT${post.readingMinutes}M`,
    inLanguage: "en",
    isPartOf: { "@id": `${absUrl("/blog")}#blog` },
  };
  const faqLd =
    post.faq.length > 0
      ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: post.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }
      : null;

  return (
    <>
      <JsonLd data={articleLd} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: post.title, path: `/blog/${post.slug}` }])} />
      {faqLd && <JsonLd data={faqLd} />}

      <article className="pt-[calc(var(--header-h)+2.5rem)] md:pt-[calc(var(--header-h)+4rem)]">
        {/* Header */}
        <header className="wrap">
          <nav aria-label="Breadcrumb" className="t-label flex flex-wrap items-center gap-2">
            <TLink href="/" className="hover:!text-bone">
              Home
            </TLink>
            <span aria-hidden="true">/</span>
            <TLink href="/blog" className="hover:!text-bone">
              Blog
            </TLink>
            {post.category && (
              <>
                <span aria-hidden="true">/</span>
                <span className="ember">{post.category}</span>
              </>
            )}
          </nav>
          <h1 className="mt-6 max-w-[22ch] text-[clamp(2.2rem,5.2vw,4.6rem)] leading-[1.02] font-bold tracking-[-0.035em] text-bone">{post.title}</h1>
          {post.excerpt && <p className="t-lead mt-6 max-w-[46rem] text-bone-dim">{post.excerpt}</p>}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-line py-4">
            <div className="flex items-center gap-3">
              <Image src={site.photo} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover object-top grayscale" />
              <div className="leading-tight">
                <span className="block text-sm font-medium text-bone">{site.name}</span>
                <span className="t-label !text-[0.62rem]">{site.role}</span>
              </div>
            </div>
            <p className="t-label flex flex-wrap gap-x-4 gap-y-1">
              <span>
                Published <time dateTime={post.publishedAt ?? undefined} className="!text-bone">{fmtDate(post.publishedAt)}</time>
              </span>
              {edited && (
                <span>
                  Updated <time dateTime={post.updatedAt} className="!text-bone">{fmtDate(post.updatedAt)}</time>
                </span>
              )}
              <span>{post.readingMinutes} min read</span>
            </p>
          </div>
        </header>

        {post.coverImage && (
          <div className="wrap mt-10">
            <Cover src={post.coverImage} alt={post.coverAlt || post.title} sizes="(min-width: 1760px) 1650px, 100vw" priority className="aspect-[16/8] border border-line" />
          </div>
        )}

        {/* Body + sidebar */}
        <div className="wrap mt-12 grid gap-12 md:mt-16 lg:grid-cols-[minmax(0,1fr)_260px] xl:grid-cols-[minmax(0,1fr)_280px] xl:gap-16">
          <div className="min-w-0">
            {post.toc.length > 1 && (
              <details className="mb-10 border border-line p-4 lg:hidden">
                <summary className="t-label cursor-pointer !text-bone">On this page</summary>
                <ol className="mt-3 space-y-2 text-sm">
                  {post.toc.map((t) => (
                    <li key={t.id} className={t.level === 3 ? "pl-4" : ""}>
                      <a href={`#${t.id}`} className="text-bone-dim hover:text-bone">
                        {t.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </details>
            )}
            <div id="article-body" className="blog-prose" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />

            {post.faq.length > 0 && (
              <section aria-labelledby="faq-title" className="mt-16">
                <h2 id="faq-title" className="text-[clamp(1.55rem,2.4vw,2.1rem)] font-semibold tracking-tight text-bone">
                  Frequently asked questions
                </h2>
                <div className="mt-6 border-t border-line">
                  {post.faq.map((f, i) => (
                    <details key={i} className="group border-b border-line py-4">
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-lg font-medium text-bone">
                        {f.q}
                        <span aria-hidden="true" className="mt-1 text-ember transition-transform group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <p className="t-body mt-3 whitespace-pre-line">{f.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            <div className="mt-14 space-y-8">
              {post.tags.length > 0 && (
                <ul className="flex flex-wrap gap-2" aria-label="Tags">
                  {post.tags.map((t) => (
                    <li key={t} className="rounded-full border border-line-2 px-3 py-1 text-xs text-bone-dim">
                      #{t}
                    </li>
                  ))}
                </ul>
              )}
              <ShareLinks url={url} title={post.title} />

              {/* Author */}
              <aside className="flex flex-col gap-5 border border-line p-6 sm:flex-row sm:items-start" aria-label="About the author">
                <Image src={site.photo} alt={`${site.name}`} width={88} height={88} className="h-[88px] w-[88px] shrink-0 rounded-full object-cover object-top grayscale" />
                <div>
                  <p className="t-label">Written by</p>
                  <p className="mt-1 text-xl font-semibold text-bone">{site.name}</p>
                  <p className="t-body mt-2 text-sm">
                    SEO specialist in Dubai. I work on technical, local and ecommerce SEO for clinics, finance brands and local businesses, and build the WordPress fixes myself.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                    <TLink href="/experience" className="link-u text-bone">
                      Experience
                    </TLink>
                    <TLink href="/work" className="link-u text-bone">
                      Case studies
                    </TLink>
                    <a href={site.linkedin} target="_blank" rel="noopener noreferrer" className="link-u text-bone">
                      LinkedIn ↗
                    </a>
                  </div>
                </div>
              </aside>
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-[calc(var(--header-h)+2rem)] space-y-10">
              <TableOfContents items={post.toc} />
              <div className="border border-line p-5">
                <p className="t-label ember">Free tool</p>
                <p className="mt-2 font-medium text-bone">How does your site score?</p>
                <p className="t-body mt-1 text-sm">Crawl up to 100 pages and get a prioritised fix list.</p>
                <TLink href="/seo-audit" className="btn btn-primary mt-4 !h-10 w-full justify-center !px-4">
                  Run free audit
                </TLink>
              </div>
            </div>
          </aside>
        </div>
        {/* Mobile: still render the progress bar */}
        <div className="lg:hidden">
          <TableOfContents items={[]} />
        </div>
      </article>

      {/* Related */}
      {related.length > 0 && (
        <section aria-labelledby="related-title" className="section mt-16 border-t border-line">
          <div className="wrap">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="related-title" className="t-h2">
                Keep reading
              </h2>
              <ButtonLink href="/blog" variant="ghost">
                All articles
              </ButtonLink>
            </div>
            <div className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
