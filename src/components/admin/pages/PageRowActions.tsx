"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Duplicate and delete links for one row of the pages list. */
export function PageRowActions({ id, title, live, path }: { id: number; title: string; live: boolean; path: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"" | "copy" | "delete">("");
  async function duplicate() {
    setBusy("copy");
    const res = await fetch("/api/admin/pages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ duplicateOf: id }) });
    const data = await res.json().catch(() => ({}));
    setBusy("");
    if (!res.ok) return window.alert(data.error ?? "Couldn’t copy the page.");
    router.push(`/admin/pages/${data.page.id}`);
  }
  async function remove() {
    const warn = live ? `\n\n${path} is live. After deleting, visitors and Google will get “page not found”. Add a redirect in SEO → Redirects if the page had traffic.` : "";
    if (!window.confirm(`Delete “${title}” permanently? This can’t be undone.${warn}`)) return;
    setBusy("delete");
    const res = await fetch(`/api/admin/pages/${id}`, { method: "DELETE" });
    setBusy("");
    if (!res.ok) return window.alert("Couldn’t delete the page. Please try again.");
    router.refresh();
  }
  return (
    <>
      <button type="button" className="link-u text-bone disabled:opacity-50" disabled={!!busy} onClick={duplicate}>
        {busy === "copy" ? "Copying…" : "Duplicate"}
      </button>
      {" · "}
      <button type="button" className="link-u text-ember-soft hover:text-ember disabled:opacity-50" disabled={!!busy} onClick={remove}>
        {busy === "delete" ? "Deleting…" : "Delete"}
      </button>
    </>
  );
}
