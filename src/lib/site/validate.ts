import "server-only";
import { parseCustomSchema, CUSTOM_SCHEMA_MAX } from "@/lib/blog/custom-schema";
import type { SeoOverride } from "./db";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
/** https URL or site-relative path; anything else is rejected. */
export const cleanUrl = (v: unknown) => {
  const s = str(v, 2000);
  if (!s) return "";
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
};
const tri = (v: unknown) => (v === true ? true : v === false ? false : null);

export function parseOverride(path: string, b: Record<string, unknown>): { value: SeoOverride; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const canonical = cleanUrl(b.canonical);
  const ogImage = cleanUrl(b.ogImage);
  if (canonical === null) errors.canonical = "Use a full https:// URL or a path starting with /.";
  if (ogImage === null) errors.ogImage = "Use a full https:// URL or a path starting with /.";
  const customSchema = typeof b.customSchema === "string" ? b.customSchema.trim().slice(0, CUSTOM_SCHEMA_MAX + 1) : "";
  const schema = parseCustomSchema(customSchema);
  if (!schema.ok) errors.customSchema = schema.error;
  return {
    value: {
      path,
      title: str(b.title, 120),
      description: str(b.description, 320),
      canonical: canonical ?? "",
      robotsIndex: tri(b.robotsIndex),
      robotsFollow: tri(b.robotsFollow),
      ogTitle: str(b.ogTitle, 120),
      ogDescription: str(b.ogDescription, 320),
      ogImage: ogImage ?? "",
      customSchema,
    },
    errors,
  };
}

/** True when nothing in the override differs from "use the page's own value". */
export const isEmptyOverride = (o: SeoOverride) =>
  !o.title && !o.description && !o.canonical && o.robotsIndex === null && o.robotsFollow === null && !o.ogTitle && !o.ogDescription && !o.ogImage && !o.customSchema;
