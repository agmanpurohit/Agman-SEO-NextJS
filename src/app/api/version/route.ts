import { BUILD_ID } from "@/lib/asset";

export const dynamic = "force-dynamic";

/** The live deploy's version. Open tabs compare it with their own to spot a new deploy. */
export function GET() {
  return Response.json({ v: BUILD_ID }, { headers: { "Cache-Control": "no-store" } });
}
