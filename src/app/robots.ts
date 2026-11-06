import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Admin and audit-result pages carry a noindex tag instead of a Disallow: crawlers must be
    // able to fetch them to see the noindex, otherwise a linked URL could still be indexed.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
