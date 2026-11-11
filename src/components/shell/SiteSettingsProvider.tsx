"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_SETTINGS, resolveSite, type ResolvedSite, type SiteSettings } from "@/lib/site/settings-shared";

const Ctx = createContext<{ site: ResolvedSite; settings: SiteSettings }>({ site: resolveSite(DEFAULT_SETTINGS), settings: DEFAULT_SETTINGS });

/** Makes the dashboard's site settings available to client components (header, hero, forms). */
export function SiteSettingsProvider({ settings, children }: { settings: SiteSettings; children: ReactNode }) {
  return <Ctx.Provider value={{ site: resolveSite(settings), settings }}>{children}</Ctx.Provider>;
}

export const useSite = () => useContext(Ctx).site;
export const useSiteSettings = () => useContext(Ctx).settings;
