"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Delete with an explicit confirmation (deleting a post can't be undone). */
export function DeletePostButton({ id, title, after = "refresh" }: { id: number; title: string; after?: "refresh" | "list" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      className="link-u text-ember-soft hover:text-ember disabled:opacity-50"
      onClick={async () => {
        if (!window.confirm(`Delete “${title}” permanently? This can’t be undone.`)) return;
        setBusy(true);
        const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
        setBusy(false);
        if (!res.ok) return window.alert("Couldn’t delete the post. Please try again.");
        if (after === "list") router.push("/admin/blog");
        router.refresh();
      }}
    >
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
