"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    setBusy(false);
    if (res.ok) router.refresh();
    else setError((await res.json().catch(() => ({}))).error ?? "Login failed.");
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm border border-line p-8">
      <p className="t-label ember">Admin</p>
      <h1 className="t-h3 mt-2">Sign in</h1>
      <label htmlFor="admin-password" className="t-label mt-8 block">
        Password
      </label>
      <input id="admin-password" name="password" type="password" autoComplete="current-password" required className="mt-2 h-12 w-full border-b border-line-2 bg-transparent text-lg text-bone outline-none focus:border-bone" />
      {error && (
        <p role="alert" className="mt-3 text-sm text-ember-soft">
          {error}
        </p>
      )}
      <button disabled={busy} className="btn btn-primary mt-8 w-full justify-center">
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export function ClearCacheButton() {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  return (
    <button
      type="button"
      className="btn btn-ghost !h-11"
      disabled={state === "busy"}
      title="Rebuild every page with the latest content on its next visit"
      onClick={async () => {
        setState("busy");
        const res = await fetch("/api/admin/revalidate", { method: "POST" }).catch(() => null);
        setState(res?.ok ? "done" : "error");
        setTimeout(() => setState("idle"), 4000);
      }}
    >
      <span aria-live="polite">{state === "busy" ? "Clearing…" : state === "done" ? "Cache cleared ✓" : state === "error" ? "Couldn't clear, try again" : "Clear cache"}</span>
    </button>
  );
}

export function AdminLogout() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn btn-ghost !h-11"
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
