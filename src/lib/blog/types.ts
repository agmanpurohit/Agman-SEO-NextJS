/** Blog data shapes shared by the dashboard, API and public pages. */

export type PostStatus = "draft" | "published";

export type FaqItem = { q: string; a: string };

export type PostInput = {
  title: string;
  slug: string;
  excerpt: string;
  contentMd: string;
  coverImage: string | null;
  coverAlt: string;
  category: string;
  tags: string[];
  focusKeyword: string;
  secondaryKeywords: string[];
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  noindex: boolean;
  nofollow: boolean;
  ogTitle: string;
  ogDescription: string;
  ogImage: string | null;
  faq: FaqItem[];
  status: PostStatus;
  /** ISO date; a future date with status "published" schedules the post. */
  publishedAt: string | null;
  featured: boolean;
};

export type Post = PostInput & {
  id: number;
  contentHtml: string;
  toc: TocItem[];
  wordCount: number;
  readingMinutes: number;
  seoScore: number;
  createdAt: string;
  updatedAt: string;
};

/** Lighter shape for lists and cards. */
export type PostSummary = Pick<
  Post,
  "id" | "title" | "slug" | "excerpt" | "coverImage" | "coverAlt" | "category" | "tags" | "status" | "publishedAt" | "updatedAt" | "readingMinutes" | "featured" | "seoScore" | "noindex" | "canonicalUrl"
>;

export type TocItem = { id: string; text: string; level: 2 | 3 };

export const emptyPost = (): PostInput => ({
  title: "",
  slug: "",
  excerpt: "",
  contentMd: "",
  coverImage: null,
  coverAlt: "",
  category: "",
  tags: [],
  focusKeyword: "",
  secondaryKeywords: [],
  metaTitle: "",
  metaDescription: "",
  canonicalUrl: "",
  noindex: false,
  nofollow: false,
  ogTitle: "",
  ogDescription: "",
  ogImage: null,
  faq: [],
  status: "draft",
  publishedAt: null,
  featured: false,
});

/** URL-safe slug: lowercase, ASCII, hyphen-separated, max 80 chars. */
export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export const isScheduled = (p: { status: PostStatus; publishedAt: string | null }) =>
  p.status === "published" && !!p.publishedAt && new Date(p.publishedAt).getTime() > Date.now();

export const isLive = (p: { status: PostStatus; publishedAt: string | null }) =>
  p.status === "published" && !!p.publishedAt && new Date(p.publishedAt).getTime() <= Date.now();
