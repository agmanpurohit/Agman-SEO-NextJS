import { notFound } from "next/navigation";
import { pageMeta } from "@/lib/seo";
import { ServicePage } from "@/components/services/ServicePage";
import { markets, services, serviceBySlug, servicePath } from "@/content/services";
import { india } from "@/content/services/india";
import { withSeo } from "@/lib/site/seo";

const market = markets.india;

// Only the services defined for India exist; anything else is a 404.
export const dynamicParams = false;
export function generateStaticParams() {
  return services.map((s) => ({ service: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;
  const s = serviceBySlug(service);
  if (!s) return {};
  const copy = india.services[s.slug];
  const path = servicePath(market.slug, s.slug);
  return withSeo({
    ...pageMeta({ title: copy.metaTitle, description: copy.metaDescription, path, socialTitle: copy.socialTitle, image: { url: `${path}/opengraph-image`, alt: `${copy.h1}, Agman Rajpurohit` } }),
    keywords: [copy.keywords.primary, ...copy.keywords.secondary],
  });
}

export default async function IndiaServicePage({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;
  const s = serviceBySlug(service);
  if (!s) notFound();
  return <ServicePage market={market} service={s} copy={india.services[s.slug]} />;
}
