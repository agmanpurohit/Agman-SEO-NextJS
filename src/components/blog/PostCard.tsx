import Image from "next/image";
import { TLink } from "@/components/ui/TLink";
import type { PostSummary } from "@/lib/blog/types";

export const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");

/**
 * Cover image for a post: our own uploads go through next/image; external URLs load as-is.
 * Frames use the 1200 × 630 share-image shape, and the image is never cropped: other shapes
 * are shown whole on a neutral background.
 */
export const COVER_ASPECT = "aspect-[1200/630]";

export function Cover({ src, alt, sizes, priority, className = "" }: { src: string | null; alt: string; sizes: string; priority?: boolean; className?: string }) {
  if (!src)
    return (
      <div className={`relative grid place-items-center overflow-hidden bg-ink-3 ${className}`} aria-hidden="true">
        <span className="t-label">Agman Rajpurohit · Blog</span>
        <span className="absolute inset-x-[15%] bottom-[30%] h-[3px] rounded-full bg-ember/70" />
      </div>
    );
  return (
    <div className={`relative overflow-hidden bg-ink-3 ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} unoptimized={/^https?:\/\//.test(src)} className="object-contain transition-[filter] duration-500 group-hover:brightness-110" />
    </div>
  );
}

export function PostCard({ post, priority }: { post: PostSummary; priority?: boolean }) {
  return (
    <article className="group">
      <TLink href={`/blog/${post.slug}`} className="block" data-cursor="Read">
        <Cover src={post.coverImage} alt={post.coverAlt || post.title} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" priority={priority} className={`${COVER_ASPECT} border border-line transition-colors duration-500 group-hover:border-ember/60`} />
        <div className="mt-5">
          <p className="t-label flex flex-wrap gap-x-3">
            {post.category && <span className="ember">{post.category}</span>}
            <time dateTime={post.publishedAt ?? undefined}>{fmtDate(post.publishedAt)}</time>
            <span>{post.readingMinutes} min read</span>
          </p>
          <h3 className="mt-3 text-[clamp(1.25rem,1.8vw,1.6rem)] leading-snug font-semibold tracking-tight text-bone">{post.title}</h3>
          {post.excerpt && <p className="t-body mt-2 line-clamp-3">{post.excerpt}</p>}
          <span className="t-label mt-4 inline-flex items-center gap-2 !text-bone transition-colors group-hover:!text-ember">
            Read article <span aria-hidden="true">→</span>
          </span>
        </div>
      </TLink>
    </article>
  );
}
