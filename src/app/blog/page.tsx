import { pageMeta, breadcrumbJsonLd, webPageJsonLd, absUrl } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/motion";
import { ButtonLink } from "@/components/ui/Buttons";
import { TLink } from "@/components/ui/TLink";
import { BlogExplorer } from "@/components/blog/BlogExplorer";
import { Cover, fmtDate } from "@/components/blog/PostCard";
import { listLivePosts } from "@/lib/blog/db";
import type { PostSummary } from "@/lib/blog/types";
import { site } from "@/content/site";

// Rebuilt at most hourly, and immediately whenever a post is published or edited.
export const revalidate = 3600;

const TITLE = "SEO Blog: Practical Search Advice";
const DESCRIPTION =
  "Straightforward articles on technical SEO, local search and getting found in AI answers, written from real client work rather than theory.";

export const metadata = pageMeta({ title: TITLE, description: DESCRIPTION, path: "/blog", socialTitle: "The blog | Agman Rajpurohit" });

async function getPosts(): Promise<PostSummary[]> {
  try {
    // noindex posts still appear for visitors; they're only kept out of search results and the sitemap.
    return await listLivePosts();
  } catch (e) {
    console.error("blog list failed", e);
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPosts();
  const featured = posts.find((p) => p.featured) ?? posts[0];
  const rest = featured ? posts.filter((p) => p.id !== featured.id) : [];

  const blogLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${absUrl("/blog")}#blog`,
    url: absUrl("/blog"),
    name: `${site.name} Blog`,
    description: DESCRIPTION,
    inLanguage: "en",
    author: { "@id": `${site.url}/#person` },
    publisher: { "@id": `${site.url}/#person` },
    blogPost: posts
      .filter((p) => !p.noindex)
      .slice(0, 50)
      .map((p) => ({
        "@type": "BlogPosting",
        headline: p.title,
        url: absUrl(`/blog/${p.slug}`),
        datePublished: p.publishedAt,
        dateModified: p.updatedAt,
        ...(p.coverImage ? { image: p.coverImage.startsWith("/") ? `${site.url}${p.coverImage}` : p.coverImage } : {}),
        author: { "@id": `${site.url}/#person` },
      })),
  };

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }])} />
      <JsonLd data={webPageJsonLd({ type: "CollectionPage", name: TITLE, description: DESCRIPTION, path: "/blog" })} />
      <JsonLd data={blogLd} />

      <PageHero
        index="06"
        title="Blog"
        display={
          <>
            Notes on search, written <span className="ember">from the work.</span>
          </>
        }
        aside={
          <a href="/blog/feed.xml" className="t-label link-u !text-bone">
            RSS feed ↗
          </a>
        }
      >
        <p>What I learn auditing sites, fixing technical problems and growing local visibility for clinics and businesses, written down so you can use it too.</p>
      </PageHero>

      <section aria-label="Articles" className="wrap pb-20 md:pb-28">
        {!featured ? (
          <Reveal className="border border-dashed border-line-2 px-6 py-20 text-center">
            <p className="t-label ember">Coming soon</p>
            <p className="t-h3 mt-4">The first articles are on their way.</p>
            <p className="t-body mx-auto mt-3 max-w-[32rem]">In the meantime, run a free audit of your site and see exactly what to fix first.</p>
            <div className="mt-8">
              <ButtonLink href="/seo-audit">Try the free SEO audit</ButtonLink>
            </div>
          </Reveal>
        ) : (
          <>
            {/* Featured */}
            <Reveal as="article" className="group mb-16 md:mb-20">
              <TLink href={`/blog/${featured.slug}`} className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-center" data-cursor="Read">
                <Cover src={featured.coverImage} alt={featured.coverAlt || featured.title} sizes="(min-width: 1024px) 58vw, 100vw" priority className="aspect-[16/9] border border-line transition-colors duration-500 group-hover:border-ember/60" />
                <div>
                  <p className="t-label flex flex-wrap gap-x-3">
                    <span className="ember">{featured.featured ? "Featured" : "Latest"}</span>
                    {featured.category && <span>{featured.category}</span>}
                    <time dateTime={featured.publishedAt ?? undefined}>{fmtDate(featured.publishedAt)}</time>
                    <span>{featured.readingMinutes} min read</span>
                  </p>
                  <h2 className="mt-4 text-[clamp(1.8rem,3.4vw,3rem)] leading-[1.05] font-semibold tracking-[-0.025em] text-bone">{featured.title}</h2>
                  {featured.excerpt && <p className="t-lead mt-5 text-bone-dim">{featured.excerpt}</p>}
                  <span className="t-label mt-6 inline-flex items-center gap-2 !text-bone transition-colors group-hover:!text-ember">
                    Read article <span aria-hidden="true">→</span>
                  </span>
                </div>
              </TLink>
            </Reveal>

            {rest.length > 0 && <BlogExplorer posts={rest} />}
          </>
        )}
      </section>
    </>
  );
}
