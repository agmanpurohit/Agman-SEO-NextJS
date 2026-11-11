import "server-only";
import { cache } from "react";
import { getSetting } from "./db";
import { DEFAULT_SETTINGS, resolveSite, type SiteSettings } from "./settings-shared";

/** Saved settings merged over the defaults (read once per render; never throws). */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const saved = await getSetting<Partial<SiteSettings>>("site");
  if (!saved) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...saved, announcement: { ...DEFAULT_SETTINGS.announcement, ...(saved.announcement ?? {}) } };
});

/** The site object (email, phones, links, availability) with settings applied, for server components. */
export const getSite = async () => resolveSite(await getSiteSettings());
