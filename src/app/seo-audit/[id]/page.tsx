import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuditRun } from "@/components/audit/AuditRun";
import { getStatus } from "@/lib/audit/runner";

export const metadata: Metadata = {
  title: "SEO Audit Results",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AuditResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{8,20}$/.test(id)) notFound();
  // Real 404 status for unknown audit links (results themselves load client-side).
  const exists = await getStatus(id, false).catch(() => null);
  if (!exists) notFound();
  return <AuditRun id={id} />;
}
