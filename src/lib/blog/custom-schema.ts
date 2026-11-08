/**
 * Custom JSON-LD for a blog post. Accepts what people usually paste: bare JSON, an array of
 * objects, or one or more complete <script type="application/ld+json"> blocks. Shared by the
 * dashboard (live validation) and the server (save validation and page output).
 */
export const CUSTOM_SCHEMA_MAX = 50_000;
/** Types the post page already outputs automatically. */
export const AUTO_SCHEMA_TYPES = ["BlogPosting", "BreadcrumbList", "FAQPage"];

export type ParsedSchema = { ok: true; blocks: Record<string, unknown>[]; types: string[] } | { ok: false; error: string };

function collectTypes(v: unknown, out: Set<string>) {
  if (Array.isArray(v)) return v.forEach((x) => collectTypes(x, out));
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    const t = o["@type"];
    if (typeof t === "string") out.add(t);
    else if (Array.isArray(t)) t.forEach((x) => typeof x === "string" && out.add(x));
    if (Array.isArray(o["@graph"])) collectTypes(o["@graph"], out);
  }
}

export function parseCustomSchema(raw: string): ParsedSchema {
  const input = (raw ?? "").trim();
  if (!input) return { ok: true, blocks: [], types: [] };
  if (input.length > CUSTOM_SCHEMA_MAX) return { ok: false, error: `Too long: keep custom schema under ${CUSTOM_SCHEMA_MAX.toLocaleString()} characters.` };

  // Pull JSON out of <script> blocks if present; otherwise treat the whole input as JSON.
  const scripts = [...input.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  if (scripts.length && scripts.some((m) => !/type\s*=\s*["']?application\/ld\+json/i.test(m[0]))) {
    return { ok: false, error: "Only <script type=\"application/ld+json\"> blocks are allowed." };
  }
  if (!scripts.length && /<[a-z]/i.test(input)) return { ok: false, error: "That looks like HTML. Paste JSON-LD, or a <script type=\"application/ld+json\"> block." };
  const chunks = scripts.length ? scripts.map((m) => m[1].trim()) : [input];

  const blocks: Record<string, unknown>[] = [];
  for (const [i, chunk] of chunks.entries()) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(chunk);
    } catch (e) {
      const where = chunks.length > 1 ? ` in block ${i + 1}` : "";
      return { ok: false, error: `Invalid JSON${where}: ${(e as Error).message.replace(/^JSON\.parse: /, "").slice(0, 140)}` };
    }
    const items = Array.isArray(parsed) ? parsed : [parsed];
    for (const it of items) {
      if (!it || typeof it !== "object" || Array.isArray(it)) return { ok: false, error: "Each schema item must be a JSON object, like { \"@context\": \"https://schema.org\", \"@type\": … }." };
      const o = it as Record<string, unknown>;
      if (!o["@type"] && !o["@graph"]) return { ok: false, error: "Each schema item needs an \"@type\" (or an \"@graph\")." };
      blocks.push(o["@context"] ? o : { "@context": "https://schema.org", ...o });
    }
  }
  const types = new Set<string>();
  collectTypes(blocks, types);
  return { ok: true, blocks, types: [...types] };
}
