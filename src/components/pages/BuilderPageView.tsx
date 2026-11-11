import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { TLink } from "@/components/ui/TLink";
import { Reveal } from "@/components/ui/motion";
import { ButtonLink, ButtonA } from "@/components/ui/Buttons";
import { Closing } from "@/components/home/Closing";
import { RichText, plainText } from "@/components/services/RichText";
import { renderContent } from "@/lib/blog/markdown";
import { parseCustomSchema } from "@/lib/blog/custom-schema";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/seo";
import type { Cta, Img, PageInput, Section } from "@/lib/pages/types";

/**
 * Renders a page-builder page with the same building blocks and styles as the hand-coded
 * pages. Everything is server-rendered HTML, so search engines and AI crawlers read it all.
 */
/** Columns for a hairline grid, never more than there are items (no empty grey cells). */
const gridCols = (n: number) => (n <= 1 ? "" : n === 2 ? "sm:grid-cols-2" : n === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 xl:grid-cols-4");
const isInternal = (h: string) => h.startsWith("/") && !h.startsWith("//");

function Button({ cta, variant = "primary" }: { cta: Cta; variant?: "primary" | "ghost" }) {
  if (!cta.label || !cta.href) return null;
  return isInternal(cta.href) ? (
    <ButtonLink href={cta.href} variant={variant}>
      {cta.label}
    </ButtonLink>
  ) : (
    <ButtonA href={cta.href} variant={variant} external={/^https?:/i.test(cta.href)} arrow={/^https?:/i.test(cta.href) ? "up-right" : "right"}>
      {cta.label}
    </ButtonA>
  );
}

function Picture({ img, eager, className = "" }: { img: Img; eager?: boolean; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={img.url}
      alt={img.alt}
      width={img.width}
      height={img.height}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : undefined}
      className={`h-auto w-full ${className}`}
    />
  );
}

function Label({ letter, text }: { letter: string; text: string }) {
  if (!text) return null;
  return (
    <p className="t-label">
      <span className="ember">{letter}</span> — {text}
    </p>
  );
}

const Rich = ({ html }: { html: string }) => (html ? <div className="blog-prose" dangerouslySetInnerHTML={{ __html: renderContent(html, "html").html }} /> : null);

function Heading({ id, children, className = "t-h2" }: { id: string; children: ReactNode; className?: string }) {
  return (
    <h2 id={id} className={className}>
      {children}
    </h2>
  );
}

function renderSection(s: Section, letter: string, title: string): ReactNode {
  const hid = `s-${s.id}`;
  switch (s.type) {
    case "hero":
      return (
        <section key={s.id} className="pt-[calc(var(--header-h)+2rem)] md:pt-[calc(var(--header-h)+3.5rem)]">
          <div className={`wrap grid grid-cols-1 items-center gap-10 ${s.image ? "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14" : ""}`}>
            <div>
              <Crumbs title={title} />
              {s.eyebrow && <p className="t-label ember mt-6">{s.eyebrow}</p>}
              <h1 className={`${s.eyebrow ? "mt-3" : "mt-6"} max-w-[22ch] text-[clamp(2.3rem,5.4vw,5rem)] leading-[0.98] font-extrabold tracking-[-0.04em]`}>{s.heading || title}</h1>
              {s.text && (
                <p className="t-lead mt-6 max-w-[40rem] text-bone-dim">
                  <RichText text={s.text} />
                </p>
              )}
              {(s.primary.label || s.secondary.label) && (
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button cta={s.primary} />
                  <Button cta={s.secondary} variant="ghost" />
                </div>
              )}
            </div>
            {s.image && (
              <Reveal>
                <Picture img={s.image} eager className="rounded-[14px] drop-shadow-[0_30px_60px_rgba(0,0,0,0.45)]" />
              </Reveal>
            )}
          </div>
        </section>
      );
    case "answer":
      return (
        <section key={s.id} aria-labelledby={hid} className="wrap mt-12 md:mt-16">
          <div className="border-l-2 border-ember bg-ink-2/60 p-6 md:p-10">
            <Heading id={hid} className="t-h3">
              {s.question}
            </Heading>
            <p className="t-body mt-4 max-w-[60rem] text-[1.05rem] text-bone">
              <RichText text={s.answer} />
            </p>
          </div>
        </section>
      );
    case "text":
      return (
        <section key={s.id} aria-labelledby={s.heading ? hid : undefined} className="svc-section">
          <div className="wrap grid-12 gap-y-8">
            <div className="col-span-4 md:col-span-3">
              <Label letter={letter} text={s.eyebrow} />
            </div>
            <div className="col-span-4 md:col-span-9">
              {s.heading && (
                <Heading id={hid} className="t-h2 max-w-[22ch]">
                  {s.heading}
                </Heading>
              )}
              <div className={`${s.heading ? "mt-8" : ""} max-w-[52rem]`}>
                <Rich html={s.html} />
              </div>
            </div>
          </div>
        </section>
      );
    case "imageText":
      return (
        <section key={s.id} aria-labelledby={s.heading ? hid : undefined} className="svc-section">
          <div className="wrap grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
            {s.image && (
              <Reveal className={s.imageSide === "left" ? "" : "lg:order-2"}>
                <Picture img={s.image} className="rounded-[14px]" />
              </Reveal>
            )}
            <div>
              <Label letter={letter} text={s.eyebrow} />
              {s.heading && (
                <Heading id={hid} className="t-h2 mt-4">
                  {s.heading}
                </Heading>
              )}
              <div className="mt-6">
                <Rich html={s.html} />
              </div>
              {s.cta.label && s.cta.href && (
                <div className="mt-8">
                  <Button cta={s.cta} variant="ghost" />
                </div>
              )}
            </div>
          </div>
        </section>
      );
    case "cards": {
      const cols = gridCols(Math.min(s.columns, s.items.length));
      return (
        <section key={s.id} aria-labelledby={s.heading ? hid : undefined} className="svc-section border-t border-line">
          <div className="wrap">
            <Label letter={letter} text={s.eyebrow} />
            {s.heading && (
              <Heading id={hid} className="t-h2 mt-4">
                {s.heading}
              </Heading>
            )}
            {s.intro && (
              <p className="t-body mt-4 max-w-[46rem]">
                <RichText text={s.intro} />
              </p>
            )}
            <Reveal as="ul" childrenStagger className={`mt-10 grid grid-cols-1 gap-px border border-line bg-line ${cols}`}>
              {s.items.map((it, i) => {
                const body = (
                  <>
                    <span className="t-label ember">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="mt-4 text-lg font-semibold text-bone md:text-xl">{it.title}</h3>
                    {it.text && <p className="t-body mt-2 text-sm">{it.href ? plainText(it.text) : <RichText text={it.text} />}</p>}
                    {it.href && <span className="t-label mt-auto pt-6 !text-bone transition-transform duration-300 group-hover:translate-x-1">Read more →</span>}
                  </>
                );
                return (
                  <li key={i} className="flex bg-ink">
                    {it.href ? (
                      isInternal(it.href) ? (
                        <TLink href={it.href} className="group flex w-full flex-col p-6 transition-colors hover:bg-ink-2 md:p-7" data-cursor="Open">
                          {body}
                        </TLink>
                      ) : (
                        <a href={it.href} target="_blank" rel="noopener noreferrer" className="group flex w-full flex-col p-6 transition-colors hover:bg-ink-2 md:p-7">
                          {body}
                        </a>
                      )
                    ) : (
                      <div className="flex w-full flex-col p-6 md:p-7">{body}</div>
                    )}
                  </li>
                );
              })}
            </Reveal>
          </div>
        </section>
      );
    }
    case "steps":
      return (
        <section key={s.id} aria-labelledby={s.heading ? hid : undefined} className="svc-section">
          <div className="wrap grid-12 gap-y-8">
            <div className="col-span-4 md:col-span-3">
              <Label letter={letter} text={s.eyebrow} />
            </div>
            <div className="col-span-4 md:col-span-9">
              {s.heading && <Heading id={hid}>{s.heading}</Heading>}
              <Reveal as="ol" childrenStagger className={`${s.heading ? "mt-10" : ""} grid grid-cols-1 gap-8 sm:grid-cols-2 ${s.items.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
                {s.items.map((it, i) => (
                  <li key={i} className="border-t border-line pt-5">
                    <span className="t-label ember">Step {i + 1}</span>
                    <h3 className="t-h3 mt-3 !text-xl">{it.title}</h3>
                    {it.text && (
                      <p className="t-body mt-2 text-sm">
                        <RichText text={it.text} />
                      </p>
                    )}
                  </li>
                ))}
              </Reveal>
            </div>
          </div>
        </section>
      );
    case "stats":
      return (
        <section key={s.id} aria-labelledby={s.heading ? hid : undefined} className="svc-section border-t border-line">
          <div className="wrap">
            <Label letter={letter} text={s.eyebrow} />
            {s.heading && (
              <Heading id={hid} className="t-h2 mt-4">
                {s.heading}
              </Heading>
            )}
            <Reveal as="ul" childrenStagger className={`mt-10 grid grid-cols-1 gap-px border border-line bg-line ${gridCols(Math.min(4, s.items.length))}`}>
              {s.items.map((it, i) => (
                <li key={i} className="bg-ink p-6 md:p-8">
                  <p className="text-[clamp(2.4rem,4.6vw,3.6rem)] leading-none font-light tracking-tight text-bone">{it.value}</p>
                  <p className="t-label mt-4 !text-bone">{it.label}</p>
                  {it.context && <p className="t-body mt-2 text-sm">{it.context}</p>}
                </li>
              ))}
            </Reveal>
          </div>
        </section>
      );
    case "image":
      if (!s.image) return null;
      return (
        <section key={s.id} className="svc-section">
          <figure className={s.wide ? "" : "wrap"}>
            <Reveal>
              <Picture img={s.image} className={s.wide ? "" : "rounded-[14px]"} />
            </Reveal>
            {s.caption && <figcaption className={`t-label mt-3 ${s.wide ? "wrap" : ""}`}>{s.caption}</figcaption>}
          </figure>
        </section>
      );
    case "quote":
      return (
        <section key={s.id} className="svc-section">
          <figure className="wrap max-w-[60rem]">
            <blockquote className="text-[clamp(1.5rem,3vw,2.4rem)] leading-[1.2] font-light tracking-tight text-bone">
              <span className="ember" aria-hidden="true">
                “
              </span>
              {s.quote}
              <span className="ember" aria-hidden="true">
                ”
              </span>
            </blockquote>
            {(s.name || s.role) && (
              <figcaption className="t-label mt-6">
                {s.name && <span className="!text-bone">{s.name}</span>}
                {s.name && s.role && " · "}
                {s.role}
              </figcaption>
            )}
          </figure>
        </section>
      );
    case "faq":
      return (
        <section key={s.id} aria-labelledby={hid} className="svc-section border-t border-line">
          <div className="wrap grid-12 gap-y-8">
            <div className="col-span-4 md:col-span-3">
              <Label letter={letter} text={s.eyebrow || "Questions"} />
            </div>
            <div className="col-span-4 md:col-span-9">
              <Heading id={hid}>{s.heading || "Frequently asked questions"}</Heading>
              <div className="mt-8 border-t border-line">
                {s.items.map((f, i) => (
                  <details key={i} className="group border-b border-line py-5">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-lg font-medium text-bone md:text-xl">
                      <h3 className="font-medium">{f.q}</h3>
                      <span aria-hidden="true" className="mt-1 text-ember transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="t-body mt-3 max-w-[52rem] whitespace-pre-line">
                      <RichText text={f.a} />
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>
      );
    case "links":
      if (!s.links.length) return null;
      return (
        <section key={s.id} aria-labelledby={hid} className="svc-section border-t border-line">
          <div className="wrap">
            <Heading id={hid}>{s.heading || "Related pages"}</Heading>
            <ul className={`mt-10 grid grid-cols-1 gap-px border border-line bg-line ${gridCols(Math.min(3, s.links.length))}`}>
              {s.links.map((l, i) => {
                const inner = (
                  <>
                    <span className="text-lg font-semibold tracking-tight text-bone md:text-xl">{l.label}</span>
                    {l.note && <span className="t-body mt-2 text-sm">{l.note}</span>}
                    <span className="t-label mt-auto pt-6 !text-bone transition-transform duration-300 group-hover:translate-x-1">Open →</span>
                  </>
                );
                const cls = "group flex h-full flex-col p-6 transition-colors hover:bg-ink-2 md:p-7";
                return (
                  <li key={i} className="bg-ink">
                    {isInternal(l.href) ? (
                      <TLink href={l.href} className={cls} data-cursor="Open">
                        {inner}
                      </TLink>
                    ) : (
                      <a href={l.href} target="_blank" rel="noopener noreferrer" className={cls}>
                        {inner}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      );
    case "cta":
      return (
        <section key={s.id} aria-labelledby={s.heading ? hid : undefined} className="svc-section">
          <div className="wrap">
            <div className="flex flex-col gap-8 border border-line bg-ink-2/60 p-6 md:flex-row md:items-end md:justify-between md:p-10">
              <div className="max-w-[44rem]">
                {s.eyebrow && <p className="t-label ember">{s.eyebrow}</p>}
                {s.heading && (
                  <Heading id={hid} className="t-h2 mt-3">
                    {s.heading}
                  </Heading>
                )}
                {s.text && (
                  <p className="t-body mt-4">
                    <RichText text={s.text} />
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap gap-3">
                <Button cta={s.primary} />
                <Button cta={s.secondary} variant="ghost" />
              </div>
            </div>
          </div>
        </section>
      );
    case "closing":
      return <Closing key={s.id} label={s.label || undefined} headline={s.line1 || s.line2 ? [s.line1, s.line2].filter(Boolean) : undefined} body={s.body || undefined} />;
  }
}

function Crumbs({ title }: { title: string }) {
  return (
    <nav aria-label="Breadcrumb" className="t-label flex flex-wrap items-center gap-2">
      <TLink href="/" className="hover:!text-bone">
        Home
      </TLink>
      <span aria-hidden="true">/</span>
      <span className="ember" aria-current="page">
        {title}
      </span>
    </nav>
  );
}

/** Structured data: breadcrumb, WebPage, FAQPage (from FAQ and direct-answer sections) and custom schema. */
export function pageJsonLd(page: PageInput, path: string, description: string) {
  const visible = page.sections.filter((s) => !s.hidden);
  const qa = visible.flatMap((s) => (s.type === "faq" ? s.items.filter((i) => i.q && i.a) : s.type === "answer" && s.question && s.answer ? [{ q: s.question, a: s.answer }] : []));
  const hero = visible.find((s) => s.type === "hero");
  const image = page.ogImage || (hero?.type === "hero" ? hero.image?.url : undefined);
  const blocks: Record<string, unknown>[] = [
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: page.title, path },
    ]),
    webPageJsonLd({ name: page.metaTitle || page.title, description, path, image }),
  ];
  if (qa.length) blocks.push({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: qa.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: plainText(f.a) } })) });
  const custom = parseCustomSchema(page.customSchema);
  if (custom.ok) blocks.push(...custom.blocks);
  return blocks;
}

export function BuilderPageView({ page, path, description }: { page: PageInput; path: string; description: string }) {
  const visible = page.sections.filter((s) => !s.hidden);
  const startsWithHero = visible[0]?.type === "hero";
  let n = 0;
  return (
    <>
      {pageJsonLd(page, path, description).map((b, i) => (
        <JsonLd key={i} data={b} />
      ))}
      {!startsWithHero && (
        <section className="pt-[calc(var(--header-h)+2rem)] md:pt-[calc(var(--header-h)+3.5rem)]">
          <div className="wrap">
            <Crumbs title={page.title} />
            <h1 className="mt-6 max-w-[22ch] text-[clamp(2.3rem,5.4vw,5rem)] leading-[0.98] font-extrabold tracking-[-0.04em]">{page.title}</h1>
          </div>
        </section>
      )}
      {visible.map((s) => {
        const hasLabel = "eyebrow" in s && !!s.eyebrow && s.type !== "hero" && s.type !== "cta";
        const letter = hasLabel || s.type === "faq" ? String.fromCharCode(65 + (n++ % 26)) : "";
        return renderSection(s, letter, page.title);
      })}
    </>
  );
}
