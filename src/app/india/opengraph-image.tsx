import { serviceOgImage } from "@/components/services/ServiceOgImage";
import { india } from "@/content/services/india";

export const alt = "SEO and digital marketing services in India by Agman Rajpurohit";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return serviceOgImage({ eyebrow: "Services · India", title: india.hub.h1, line: "SEO, local SEO, GEO, AEO, Google Ads, Meta Ads and SEO-friendly websites.", chips: ["SEO", "Local SEO", "AI search", "Paid ads"] });
}
