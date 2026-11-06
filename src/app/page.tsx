import { pageMeta, webPageJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { Hero } from "@/components/home/Hero";
import { IndexBand } from "@/components/home/IndexBand";
import { Approach } from "@/components/home/Approach";
import { Disciplines } from "@/components/home/Disciplines";
import { Signals } from "@/components/home/Signals";
import { SelectedWork } from "@/components/home/SelectedWork";
import { JourneyPreview } from "@/components/home/JourneyPreview";
import { Closing } from "@/components/home/Closing";
import { AuditTeaser } from "@/components/home/AuditTeaser";

const TITLE = "Agman Rajpurohit | SEO Specialist in Dubai";
const DESCRIPTION =
  "I'm Agman, an SEO specialist in Dubai. I grow organic traffic for clinics, finance brands and local businesses, and I can start a new role right away.";

export const metadata = pageMeta({
  title: TITLE,
  absoluteTitle: true,
  description: DESCRIPTION,
  path: "/",
  socialTitle: "Agman Rajpurohit, SEO specialist in Dubai",
});

export default function HomePage() {
  return (
    <>
      <JsonLd data={webPageJsonLd({ type: "ProfilePage", name: TITLE, description: DESCRIPTION, path: "/" })} />
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
