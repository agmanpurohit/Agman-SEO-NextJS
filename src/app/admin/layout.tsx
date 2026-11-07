import type { Metadata } from "next";

/**
 * Every page under /admin (current and future) is hidden from search engines:
 * noindex, nofollow, no cached copy, no snippet, no image indexing.
 * next.config.ts also sends the same rule as an X-Robots-Tag header on every /admin response.
 * Google Analytics never loads here (see GoogleTag).
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    googleBot: { index: false, follow: false, noimageindex: true, "max-snippet": 0, "max-image-preview": "none", "max-video-preview": 0 },
  },
  referrer: "no-referrer",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
