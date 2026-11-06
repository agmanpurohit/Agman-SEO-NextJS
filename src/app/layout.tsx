import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { site } from "@/content/site";
import { personJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { TransitionProvider } from "@/components/shell/TransitionProvider";
import { SmoothScroll } from "@/components/shell/SmoothScroll";
import { Preloader } from "@/components/shell/Preloader";
import { Cursor } from "@/components/shell/Cursor";
import { Atmosphere } from "@/components/shell/Atmosphere";
import { Header } from "@/components/shell/Header";
import { Footer } from "@/components/shell/Footer";
import { AuditBand } from "@/components/audit/AuditBand";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — SEO & Digital Marketing Specialist in Dubai`,
    template: `%s — ${site.name}`,
  },
  description:
    "Agman Rajpurohit is a Dubai-based SEO and digital marketing specialist: technical, local and ecommerce SEO, GEO and AEO for AI search, Google Ads, Meta Ads and WordPress development.",
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  keywords: [
    "Agman Rajpurohit",
    "SEO specialist Dubai",
    "Digital Marketing Executive Dubai",
    "GEO specialist",
    "AEO",
    "Technical SEO",
    "Local SEO",
    "Google Ads",
    "Meta Ads",
    "WordPress developer",
  ],
  formatDetection: { telephone: false, email: false, address: false },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark",
};

// Runs before paint: flags JS, reduced motion and returning visitors (skip the loader).
const bootScript = `(function(){var d=document.documentElement;d.classList.add('js');var r=matchMedia('(prefers-reduced-motion: reduce)').matches;if(r){d.classList.add('reduced');d.setAttribute('data-seen','')}try{if(sessionStorage.getItem('ar-seen'))d.setAttribute('data-seen','')}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${archivo.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <JsonLd data={personJsonLd()} />
      </head>
      <body>
        <TransitionProvider>
          <Preloader />
          <SmoothScroll />
          <Atmosphere />
          <Header />
          <main id="main" tabIndex={-1} className="relative outline-none">
            {children}
          </main>
          <AuditBand />
          <Footer />
          <Cursor />
          <div className="grain" aria-hidden="true" />
        </TransitionProvider>
      </body>
    </html>
  );
}
