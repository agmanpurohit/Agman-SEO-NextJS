import { serviceOgImage } from "@/components/services/ServiceOgImage";
import { serviceBySlug, services } from "@/content/services";
import { india } from "@/content/services/india";

export const alt = "SEO and digital marketing service in India by Agman Rajpurohit";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return services.map((s) => ({ service: s.slug }));
}

export default async function Image({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;
  const s = serviceBySlug(service) ?? services[0];
  const copy = india.services[s.slug];
  return serviceOgImage({ eyebrow: `India · ${s.kind}`, title: copy.h1, line: s.short, chips: [s.name, ...copy.fit.items.slice(0, 2).map((x) => x.split(",")[0])] });
}
