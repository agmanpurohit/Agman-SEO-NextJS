/**
 * Site settings editable in Admin → Settings. Shared by server and client code (no secrets).
 * Defaults come from src/content/site.ts, so the site works with nothing saved.
 */
import { site } from "@/content/site";

export type Announcement = { enabled: boolean; text: string; linkLabel: string; href: string };
export type SiteSettings = {
  email: string;
  linkedin: string;
  availability: string;
  availabilityLong: string;
  dubaiPhone: string;
  dubaiWhatsapp: string;
  indiaPhone: string;
  gtmId: string;
  announcement: Announcement;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  email: site.email,
  linkedin: site.linkedin,
  availability: site.availability,
  availabilityLong: site.availabilityLong,
  dubaiPhone: site.locations[0].phone,
  dubaiWhatsapp: site.locations[0].whatsapp ?? "",
  indiaPhone: site.locations[1].phone,
  gtmId: process.env.NEXT_PUBLIC_GTM_ID?.trim() || "GTM-TKHSB426",
  announcement: { enabled: false, text: "", linkLabel: "", href: "" },
};

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/** The `site` object with saved settings applied, in the same shape the components already use. */
export function resolveSite(s: SiteSettings) {
  const [dubai, india] = site.locations;
  return {
    ...site,
    email: s.email,
    linkedin: s.linkedin,
    availability: s.availability,
    availabilityLong: s.availabilityLong,
    locations: [
      { ...dubai, phone: s.dubaiPhone, phoneHref: telHref(s.dubaiPhone), whatsapp: s.dubaiWhatsapp || null },
      { ...india, phone: s.indiaPhone, phoneHref: telHref(s.indiaPhone) },
    ],
  };
}
export type ResolvedSite = ReturnType<typeof resolveSite>;

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;
const httpsUrl = (v: string) => {
  try {
    return new URL(v).protocol === "https:";
  } catch {
    return false;
  }
};

/** Validates and cleans settings from the dashboard. */
export function validateSettings(b: Partial<Record<keyof SiteSettings, unknown>>): { value: SiteSettings; errors: Record<string, string> } {
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const a = (b.announcement ?? {}) as Partial<Record<keyof Announcement, unknown>>;
  const value: SiteSettings = {
    email: str(b.email, 200),
    linkedin: str(b.linkedin, 300),
    availability: str(b.availability, 60),
    availabilityLong: str(b.availabilityLong, 400),
    dubaiPhone: str(b.dubaiPhone, 30),
    dubaiWhatsapp: str(b.dubaiWhatsapp, 200),
    indiaPhone: str(b.indiaPhone, 30),
    gtmId: str(b.gtmId, 20).toUpperCase(),
    announcement: { enabled: a.enabled === true, text: str(a.text, 160), linkLabel: str(a.linkLabel, 40), href: str(a.href, 300) },
  };
  const errors: Record<string, string> = {};
  if (!EMAIL.test(value.email)) errors.email = "Enter a valid email address.";
  if (!httpsUrl(value.linkedin)) errors.linkedin = "Use the full https:// LinkedIn URL.";
  if (!value.availability) errors.availability = "Add a short availability line.";
  if (value.dubaiPhone && !/^[+\d][\d\s()-]{5,}$/.test(value.dubaiPhone)) errors.dubaiPhone = "Use digits, spaces and an optional +.";
  if (value.indiaPhone && !/^[+\d][\d\s()-]{5,}$/.test(value.indiaPhone)) errors.indiaPhone = "Use digits, spaces and an optional +.";
  if (value.dubaiWhatsapp && !/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(value.dubaiWhatsapp)) errors.dubaiWhatsapp = "Use a https://wa.me/… link.";
  if (value.gtmId && !/^GTM-[A-Z0-9]{4,12}$/.test(value.gtmId)) errors.gtmId = "Tag Manager IDs look like GTM-XXXXXXX. Leave empty to turn tracking off.";
  if (value.announcement.enabled) {
    if (!value.announcement.text) errors["announcement.text"] = "Write the announcement text, or turn it off.";
    if (value.announcement.href && !value.announcement.href.startsWith("/") && !httpsUrl(value.announcement.href)) errors["announcement.href"] = "Use a path like /blog or a full https:// URL.";
    if (value.announcement.href && !value.announcement.linkLabel) errors["announcement.linkLabel"] = "Add the link text.";
  }
  return { value, errors };
}
