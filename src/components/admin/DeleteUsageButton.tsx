"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Permanently delete one tool-usage record, after confirmation. */
export function DeleteUsageButton({ id }: { id: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      className="text-xs text-mute hover:text-ember disabled:opacity-50"
      onClick={async () => {
        if (!window.confirm("Delete this record permanently? This can’t be undone.")) return;
        setBusy(true);
        const res = await fetch(`/api/admin/tool-usage/${id}`, { method: "DELETE" });
        setBusy(false);
        if (!res.ok) return window.alert("Couldn’t delete the record. Please try again.");
        router.refresh();
      }}
    >
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
