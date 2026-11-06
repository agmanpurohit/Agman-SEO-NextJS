import type { Metadata } from "next";
import { site } from "@/content/site";
import { education, certifications } from "@/content/experience";

/** Per-page metadata with canonical URL and social cards. */
export function pageMeta({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  const url = `${site.url}${path === "/" ? "" : path}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url,
      siteName: site.name,
      type: path === "/" ? "profile" : "website",
      locale: "en_AE",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** Person + WebSite structured data, describing Agman as one consistent entity. */
export function personJsonLd() {
  const id = `${site.url}/#person`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": id,
        name: site.name,
        givenName: site.firstName,
        familyName: site.lastName,
        jobTitle: site.role,
        description:
          "SEO and digital marketing specialist based in Dubai, working across technical, local and ecommerce SEO, AI search optimization (GEO and AEO), Google Ads, Meta Ads and WordPress development.",
        url: site.url,
        image: `${site.url}${site.photo}`,
        email: `mailto:${site.email}`,
        telephone: site.locations[0].phone.replace(/\s/g, ""),
        nationality: { "@type": "Country", name: "India" },
        address: { "@type": "PostalAddress", addressLocality: "Dubai", addressCountry: "AE" },
        sameAs: [site.linkedin],
        knowsAbout: [
          "Search Engine Optimization",
          "Technical SEO",
          "Local SEO",
          "International SEO",
          "Ecommerce SEO",
          "Generative Engine Optimization",
          "Answer Engine Optimization",
          "Google Ads",
          "Meta Ads",
          "Google Business Profile",
          "Schema markup",
          "WordPress development",
        ],
        alumniOf: { "@type": "CollegeOrUniversity", name: education.school },
        hasCredential: certifications.map((c) => ({
          "@type": "EducationalOccupationalCredential",
          name: c.name,
          recognizedBy: { "@type": "Organization", name: c.issuer },
        })),
        hasOccupation: {
          "@type": "Occupation",
          name: site.role,
          occupationLocation: { "@type": "City", name: "Dubai" },
          skills: "SEO, GEO, AEO, Technical SEO, Local SEO, Google Ads, Meta Ads, WordPress",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        url: site.url,
        name: `${site.name} — ${site.role}`,
        inLanguage: "en",
        publisher: { "@id": id },
      },
    ],
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${site.url}${it.path === "/" ? "" : it.path}`,
    })),
  };
}
