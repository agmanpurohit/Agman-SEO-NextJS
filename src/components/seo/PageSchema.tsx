import { JsonLd } from "./JsonLd";
import { getOverride } from "@/lib/site/db";
import { parseCustomSchema } from "@/lib/blog/custom-schema";

/** Outputs the custom JSON-LD saved for this page in the SEO manager (nothing if none). */
export async function PageSchema({ path }: { path: string }) {
  const o = await getOverride(path);
  if (!o?.customSchema) return null;
  const parsed = parseCustomSchema(o.customSchema);
  if (!parsed.ok) return null;
  return (
    <>
      {parsed.blocks.map((b, i) => (
        <JsonLd key={i} data={b} />
      ))}
    </>
  );
}
