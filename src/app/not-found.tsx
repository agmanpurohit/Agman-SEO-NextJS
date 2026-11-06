import { ButtonLink } from "@/components/ui/Buttons";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <section className="wrap flex min-h-[100svh] flex-col justify-center pt-[var(--header-h)]">
      <p className="t-label ember">404 — Not indexed</p>
      <h1 className="t-h1 mt-6 max-w-[14ch]">This page didn&apos;t make it into the index.</h1>
      <p className="t-lead mt-6 max-w-[34rem] text-bone-dim">The link may be old or mistyped. Everything that matters is one click away.</p>
      <div className="mt-10">
        <ButtonLink href="/">Back to home</ButtonLink>
      </div>
    </section>
  );
}
