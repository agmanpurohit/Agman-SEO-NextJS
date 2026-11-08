import "server-only";
import { revalidatePath } from "next/cache";
import { renderContent } from "./markdown";
import { analysePost } from "./seo-analysis";
import { readingMinutes, wordCount } from "./content";
import { savePost, slugTaken, deletePost, type Derived } from "./db";
import type { Post, PostInput } from "./types";

export function derive(input: PostInput): Derived {
  const { html, toc } = renderContent(input.contentMd, input.contentFormat);
  return { contentHtml: html, toc, wordCount: wordCount(input.contentMd, input.contentFormat), readingMinutes: readingMinutes(input.contentMd, input.contentFormat), seoScore: analysePost(input).score };
}

/** Refresh every cached page on the site (blog list, posts, sitemap, feed and the rest). */
export function revalidateSite() {
  revalidatePath("/", "layout");
  revalidatePath("/sitemap.xml");
  revalidatePath("/blog/feed.xml");
}

/** After a post is saved or deleted. Old slugs are covered too, so their redirects take effect. */
export function revalidateBlog(..._slugs: (string | null | undefined)[]) {
  revalidateSite();
}

export class SlugTakenError extends Error {}

export async function persist(input: PostInput, id?: number, previousSlug?: string): Promise<Post> {
  if (await slugTaken(input.slug, id)) throw new SlugTakenError();
  const post = await savePost(input, derive(input), id);
  revalidateBlog(post.slug, previousSlug);
  return post;
}

export async function remove(id: number) {
  const slug = await deletePost(id);
  revalidateBlog(slug);
  return slug;
}
