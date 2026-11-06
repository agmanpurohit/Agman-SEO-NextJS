import { pageMeta } from "@/lib/seo";
import { Hero } from "@/components/home/Hero";
import { IndexBand } from "@/components/home/IndexBand";
import { Approach } from "@/components/home/Approach";
import { Disciplines } from "@/components/home/Disciplines";
import { Signals } from "@/components/home/Signals";
import { SelectedWork } from "@/components/home/SelectedWork";
import { JourneyPreview } from "@/components/home/JourneyPreview";
import { Closing } from "@/components/home/Closing";
import { AuditTeaser } from "@/components/home/AuditTeaser";

export const metadata = {
  ...pageMeta({
    title: "Agman Rajpurohit — SEO & Digital Marketing Specialist in Dubai",
    description:
      "Dubai-based SEO and digital marketing specialist. Technical, local and ecommerce SEO, GEO and AEO for AI search, Google Ads, Meta Ads and WordPress development. Available immediately.",
    path: "/",
  }),
  title: { absolute: "Agman Rajpurohit — SEO & Digital Marketing Specialist in Dubai" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <IndexBand />
      <Approach />
      <Disciplines />
      <Signals />
      <SelectedWork />
      <JourneyPreview />
      <AuditTeaser />
      <Closing />
    </>
  );
}
