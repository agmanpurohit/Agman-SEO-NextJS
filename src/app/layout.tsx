import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { site } from "@/content/site";
import { personJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { GoogleTag } from "@/components/seo/GoogleTag";
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
    default: `${site.name} | SEO Specialist in Dubai`,
    template: `%s | ${site.name}`,
  },
  description:
    "I'm Agman, an SEO specialist based in Dubai. I help businesses get found on Google and in AI answers, and I build the WordPress fixes myself.",
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  category: "SEO and digital marketing",
  formatDetection: { telephone: false, email: false, address: false },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
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
        <GoogleTag />
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
