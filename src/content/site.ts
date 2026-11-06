/**
 * Identity and contact details — the single source of truth for the whole site.
 * Source: CV (public/Agman-Rajpurohit-CV.pdf) and details confirmed by Agman.
 *
 * Email, LinkedIn and the site URL can be overridden with environment variables
 * (see .env.example) without touching code.
 */
// NEXT_PUBLIC_* values must be read with static property access so Next.js can inline them.
const env = (value: string | undefined, fallback: string) => (value && value.trim()) || fallback;

export const site = {
  name: "Agman Rajpurohit",
  firstName: "Agman",
  lastName: "Rajpurohit",
  url: env(process.env.NEXT_PUBLIC_SITE_URL, "https://agmanrajpurohit.com").replace(/\/$/, ""),
  role: "SEO & Digital Marketing Specialist",
  tagline: "Visibility, engineered.",
  disciplines: ["SEO", "GEO", "AEO", "Google Ads", "Meta Ads", "Web Development"],
  email: env(process.env.NEXT_PUBLIC_CONTACT_EMAIL, "agmanpurohit@gmail.com"),
  linkedin: env(process.env.NEXT_PUBLIC_LINKEDIN_URL, "https://www.linkedin.com/in/agmanpurohit"),
  cv: "/Agman-Rajpurohit-CV.pdf",
  photo: "/images/agman-rajpurohit.png",
  availability: "Available immediately",
  availabilityLong:
    "Available immediately for full-time SEO and digital marketing roles in Dubai and across the UAE. Open to selected freelance projects.",
  nationality: "Indian",
  locations: [
    {
      city: "Dubai",
      country: "UAE",
      primary: true,
      timezone: "Asia/Dubai",
      phone: "+971 50 729 8791",
      phoneHref: "tel:+971507298791",
      whatsapp: "https://wa.me/971507298791",
    },
    {
      city: "Ahmedabad",
      country: "India",
      primary: false,
      timezone: "Asia/Kolkata",
      phone: "+91 63750 26232",
      phoneHref: "tel:+916375026232",
      whatsapp: null,
    },
  ],
} as const;

export const nav = [
  { href: "/", label: "Home", index: "01" },
  { href: "/experience", label: "Experience", index: "02" },
  { href: "/work", label: "Work", index: "03" },
  { href: "/contact", label: "Contact", index: "04" },
  { href: "/seo-audit", label: "SEO Audit", index: "05" },
] as const;

/** The free audit tool: linked from the header, a homepage section and a band on every page. */
export const auditTool = { href: "/seo-audit", label: "Free SEO Audit" } as const;

export const primaryLocation = site.locations[0];
