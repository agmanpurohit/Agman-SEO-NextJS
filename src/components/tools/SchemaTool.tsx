"use client";

import { useMemo, useState } from "react";
import { CodeOutput, Field, Panel, Select, SmallButton, TextArea, TextInput, Toggle } from "./ui";

type FieldDef = {
  key: string;
  label: string;
  kind?: "text" | "url" | "textarea" | "date" | "datetime" | "number" | "select" | "lines";
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  hint?: string;
  half?: boolean;
};
type TypeDef = { id: string; label: string; blurb: string; fields: FieldDef[]; list?: "faq" | "crumbs" };

const COUNTRIES = "AE,IN,US,GB,SA,QA,OM,KW,BH,CA,AU,DE,FR,SG".split(",");

const TYPES: TypeDef[] = [
  {
    id: "Article",
    label: "Article / blog post",
    blurb: "Helps Google show the headline, image and date for articles and blog posts.",
    fields: [
      { key: "articleType", label: "Article type", kind: "select", options: ["BlogPosting", "Article", "NewsArticle"].map((v) => ({ value: v, label: v })), half: true },
      { key: "url", label: "Article URL", kind: "url", placeholder: "https://www.example.com/blog/post", half: true },
      { key: "headline", label: "Headline", required: true, placeholder: "How to choose a dentist in Dubai" },
      { key: "description", label: "Short description", kind: "textarea" },
      { key: "image", label: "Image URL", kind: "url", required: true, hint: "At least 1200px wide works best." },
      { key: "datePublished", label: "Published", kind: "datetime", required: true, half: true },
      { key: "dateModified", label: "Last updated", kind: "datetime", half: true },
      { key: "authorName", label: "Author name", required: true, half: true },
      { key: "authorUrl", label: "Author page URL", kind: "url", half: true },
      { key: "publisherName", label: "Publisher / site name", half: true },
      { key: "publisherLogo", label: "Publisher logo URL", kind: "url", half: true },
    ],
  },
  {
    id: "FAQPage",
    label: "FAQ page",
    blurb: "Marks up questions and answers that are visible on the page. Google now shows FAQ results mainly for authoritative government and health sites, but AI search engines still read them.",
    fields: [],
    list: "faq",
  },
  {
    id: "LocalBusiness",
    label: "Local business",
    blurb: "Gives Google your address, hours and contact details in a format it can trust. Essential for local SEO.",
    fields: [
      {
        key: "subtype",
        label: "Business type",
        kind: "select",
        options: ["LocalBusiness", "Dentist", "MedicalClinic", "Physician", "Restaurant", "Store", "ProfessionalService", "LegalService", "AccountingService", "BeautySalon", "AutoRepair", "RealEstateAgent", "HomeAndConstructionBusiness"].map((v) => ({ value: v, label: v })),
        half: true,
      },
      { key: "name", label: "Business name", required: true, half: true },
      { key: "url", label: "Website", kind: "url", half: true },
      { key: "telephone", label: "Phone", placeholder: "+971 4 123 4567", half: true },
      { key: "image", label: "Photo or logo URL", kind: "url", required: true },
      { key: "street", label: "Street address", required: true },
      { key: "city", label: "City", required: true, half: true },
      { key: "region", label: "Region / emirate", half: true },
      { key: "postal", label: "Postal code", half: true },
      { key: "country", label: "Country", kind: "select", options: COUNTRIES.map((c) => ({ value: c, label: c })), half: true },
      { key: "lat", label: "Latitude", kind: "number", placeholder: "25.0805", half: true },
      { key: "lng", label: "Longitude", kind: "number", placeholder: "55.1403", half: true },
      { key: "priceRange", label: "Price range", placeholder: "$$", half: true },
      { key: "hours", label: "Opening hours", kind: "lines", placeholder: "Mo-Fr 09:00-18:00\nSa 10:00-14:00", hint: "One line per range. Days: Mo Tu We Th Fr Sa Su.", half: true },
      { key: "sameAs", label: "Profiles (one URL per line)", kind: "lines", placeholder: "https://www.instagram.com/yourbusiness\nhttps://g.page/yourbusiness" },
    ],
  },
  {
    id: "Organization",
    label: "Organization",
    blurb: "Connects your brand name, logo and social profiles. Usually added once, on the homepage.",
    fields: [
      { key: "name", label: "Organisation name", required: true, half: true },
      { key: "url", label: "Website", kind: "url", required: true, half: true },
      { key: "logo", label: "Logo URL", kind: "url", hint: "Square or wide, at least 112 × 112 px." },
      { key: "description", label: "Description", kind: "textarea" },
      { key: "email", label: "Email", half: true },
      { key: "telephone", label: "Phone", half: true },
      { key: "foundingDate", label: "Founded", kind: "date", half: true },
      { key: "sameAs", label: "Social profiles (one URL per line)", kind: "lines", placeholder: "https://www.linkedin.com/company/yourbrand" },
    ],
  },
  {
    id: "Person",
    label: "Person",
    blurb: "Describes an author, consultant or public figure, and links their profiles together.",
    fields: [
      { key: "name", label: "Full name", required: true, half: true },
      { key: "jobTitle", label: "Job title", half: true },
      { key: "url", label: "Profile / website URL", kind: "url", half: true },
      { key: "image", label: "Photo URL", kind: "url", half: true },
      { key: "worksFor", label: "Works for (organisation)", half: true },
      { key: "email", label: "Email", half: true },
      { key: "description", label: "Short bio", kind: "textarea" },
      { key: "sameAs", label: "Profiles (one URL per line)", kind: "lines", placeholder: "https://www.linkedin.com/in/yourname" },
    ],
  },
  {
    id: "Product",
    label: "Product",
    blurb: "Lets Google show price, availability and ratings for products you sell.",
    fields: [
      { key: "name", label: "Product name", required: true },
      { key: "image", label: "Image URL", kind: "url", required: true },
      { key: "description", label: "Description", kind: "textarea" },
      { key: "brand", label: "Brand", half: true },
      { key: "sku", label: "SKU", half: true },
      { key: "gtin", label: "GTIN / barcode", half: true },
      { key: "url", label: "Product URL", kind: "url", half: true },
      { key: "price", label: "Price", kind: "number", placeholder: "199.00", half: true },
      { key: "currency", label: "Currency", kind: "select", options: ["AED", "USD", "EUR", "GBP", "INR", "SAR"].map((v) => ({ value: v, label: v })), half: true },
      {
        key: "availability",
        label: "Availability",
        kind: "select",
        options: [
          { value: "InStock", label: "In stock" },
          { value: "OutOfStock", label: "Out of stock" },
          { value: "PreOrder", label: "Pre-order" },
          { value: "BackOrder", label: "Back order" },
        ],
        half: true,
      },
      {
        key: "condition",
        label: "Condition",
        kind: "select",
        options: [
          { value: "NewCondition", label: "New" },
          { value: "RefurbishedCondition", label: "Refurbished" },
          { value: "UsedCondition", label: "Used" },
        ],
        half: true,
      },
      { key: "ratingValue", label: "Average rating (1–5)", kind: "number", half: true, hint: "Only if real customer reviews are shown on the page." },
      { key: "reviewCount", label: "Number of reviews", kind: "number", half: true },
    ],
  },
  { id: "BreadcrumbList", label: "Breadcrumbs", blurb: "Shows the page's position in your site, and Google often displays it instead of the raw URL.", fields: [], list: "crumbs" },
  {
    id: "Event",
    label: "Event",
    blurb: "For workshops, webinars, concerts and other dated events.",
    fields: [
      { key: "name", label: "Event name", required: true },
      { key: "startDate", label: "Starts", kind: "datetime", required: true, half: true },
      { key: "endDate", label: "Ends", kind: "datetime", half: true },
      {
        key: "mode",
        label: "Attendance",
        kind: "select",
        options: [
          { value: "OfflineEventAttendanceMode", label: "In person" },
          { value: "OnlineEventAttendanceMode", label: "Online" },
          { value: "MixedEventAttendanceMode", label: "Both" },
        ],
        half: true,
      },
      {
        key: "status",
        label: "Status",
        kind: "select",
        options: [
          { value: "EventScheduled", label: "Scheduled" },
          { value: "EventPostponed", label: "Postponed" },
          { value: "EventRescheduled", label: "Rescheduled" },
          { value: "EventCancelled", label: "Cancelled" },
        ],
        half: true,
      },
      { key: "locationName", label: "Venue name", half: true },
      { key: "address", label: "Venue address", half: true },
      { key: "onlineUrl", label: "Online event URL", kind: "url" },
      { key: "image", label: "Image URL", kind: "url" },
      { key: "description", label: "Description", kind: "textarea" },
      { key: "organizerName", label: "Organiser", half: true },
      { key: "organizerUrl", label: "Organiser URL", kind: "url", half: true },
      { key: "price", label: "Ticket price", kind: "number", half: true },
      { key: "currency", label: "Currency", kind: "select", options: ["AED", "USD", "EUR", "GBP", "INR", "SAR"].map((v) => ({ value: v, label: v })), half: true },
      { key: "ticketUrl", label: "Ticket URL", kind: "url" },
    ],
  },
  {
    id: "WebSite",
    label: "Website (site name)",
    blurb: "Tells Google which name to show for your site in results. Add it to the homepage.",
    fields: [
      { key: "name", label: "Site name", required: true, half: true },
      { key: "alternateName", label: "Alternative name", half: true, placeholder: "Short name or acronym" },
      { key: "url", label: "Homepage URL", kind: "url", required: true },
    ],
  },
];

type V = Record<string, string>;
const DAYS: Record<string, string> = { mo: "Monday", tu: "Tuesday", we: "Wednesday", th: "Thursday", fr: "Friday", sa: "Saturday", su: "Sunday" };
const ORDER = Object.keys(DAYS);
const split = (s?: string) => (s ?? "").split(/\n/).map((x) => x.trim()).filter(Boolean);
const iso = (s?: string) => (s ? (s.length === 16 ? `${s}:00` : s) : undefined);

function hoursSpec(lines: string[]) {
  return lines.flatMap((l) => {
    const m = l.match(/^([a-z]{2})(?:\s*-\s*([a-z]{2}))?\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/i);
    if (!m) return [];
    const a = ORDER.indexOf(m[1].toLowerCase());
    const b = m[2] ? ORDER.indexOf(m[2].toLowerCase()) : a;
    if (a < 0 || b < 0) return [];
    const days = ORDER.slice(a, b + 1).map((d) => DAYS[d]);
    const pad = (t: string) => t.padStart(5, "0");
    return [{ "@type": "OpeningHoursSpecification", dayOfWeek: days.length === 1 ? days[0] : days, opens: pad(m[3]), closes: pad(m[4]) }];
  });
}

/** Removes empty strings, empty arrays and objects with nothing but @type. */
function prune(v: unknown): unknown {
  if (Array.isArray(v)) {
    const a = v.map(prune).filter((x) => x !== undefined);
    return a.length ? a : undefined;
  }
  if (v && typeof v === "object") {
    const o: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) {
      const p = prune(x);
      if (p !== undefined) o[k] = p;
    }
    const keys = Object.keys(o).filter((k) => k !== "@type" && k !== "@context");
    return keys.length ? o : undefined;
  }
  if (typeof v === "string") return v.trim() ? v.trim() : undefined;
  return v ?? undefined;
}

function build(t: string, v: V, faq: { q: string; a: string }[], crumbs: { name: string; url: string }[]): object | undefined {
  const num = (s?: string) => (s && !isNaN(Number(s)) ? Number(s) : undefined);
  switch (t) {
    case "Article":
      return {
        "@type": v.articleType || "BlogPosting",
        headline: v.headline,
        description: v.description,
        image: v.image ? [v.image] : undefined,
        datePublished: iso(v.datePublished),
        dateModified: iso(v.dateModified),
        author: { "@type": "Person", name: v.authorName, url: v.authorUrl },
        publisher: { "@type": "Organization", name: v.publisherName, logo: { "@type": "ImageObject", url: v.publisherLogo } },
        mainEntityOfPage: v.url,
      };
    case "FAQPage":
      return { "@type": "FAQPage", mainEntity: faq.filter((f) => f.q.trim() && f.a.trim()).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
    case "LocalBusiness":
      return {
        "@type": v.subtype || "LocalBusiness",
        name: v.name,
        image: v.image,
        url: v.url,
        telephone: v.telephone,
        priceRange: v.priceRange,
        address: { "@type": "PostalAddress", streetAddress: v.street, addressLocality: v.city, addressRegion: v.region, postalCode: v.postal, addressCountry: v.country || "AE" },
        geo: num(v.lat) !== undefined && num(v.lng) !== undefined ? { "@type": "GeoCoordinates", latitude: num(v.lat), longitude: num(v.lng) } : undefined,
        openingHoursSpecification: hoursSpec(split(v.hours)),
        sameAs: split(v.sameAs),
      };
    case "Organization":
      return { "@type": "Organization", name: v.name, url: v.url, logo: v.logo, description: v.description, email: v.email, telephone: v.telephone, foundingDate: v.foundingDate, sameAs: split(v.sameAs) };
    case "Person":
      return {
        "@type": "Person",
        name: v.name,
        jobTitle: v.jobTitle,
        url: v.url,
        image: v.image,
        email: v.email,
        description: v.description,
        worksFor: v.worksFor ? { "@type": "Organization", name: v.worksFor } : undefined,
        sameAs: split(v.sameAs),
      };
    case "Product":
      return {
        "@type": "Product",
        name: v.name,
        image: v.image ? [v.image] : undefined,
        description: v.description,
        brand: v.brand ? { "@type": "Brand", name: v.brand } : undefined,
        sku: v.sku,
        gtin: v.gtin,
        offers: v.price
          ? { "@type": "Offer", url: v.url, price: v.price, priceCurrency: v.currency || "AED", availability: `https://schema.org/${v.availability || "InStock"}`, itemCondition: `https://schema.org/${v.condition || "NewCondition"}` }
          : undefined,
        aggregateRating: v.ratingValue && v.reviewCount ? { "@type": "AggregateRating", ratingValue: num(v.ratingValue), reviewCount: num(v.reviewCount) } : undefined,
      };
    case "BreadcrumbList":
      return {
        "@type": "BreadcrumbList",
        itemListElement: crumbs.filter((c) => c.name.trim()).map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url || undefined })),
      };
    case "Event": {
      const online = v.mode === "OnlineEventAttendanceMode";
      const both = v.mode === "MixedEventAttendanceMode";
      const place = { "@type": "Place", name: v.locationName, address: v.address };
      const virtual = { "@type": "VirtualLocation", url: v.onlineUrl };
      return {
        "@type": "Event",
        name: v.name,
        startDate: iso(v.startDate),
        endDate: iso(v.endDate),
        eventAttendanceMode: `https://schema.org/${v.mode || "OfflineEventAttendanceMode"}`,
        eventStatus: `https://schema.org/${v.status || "EventScheduled"}`,
        location: both ? [place, virtual] : online ? virtual : place,
        image: v.image ? [v.image] : undefined,
        description: v.description,
        organizer: { "@type": "Organization", name: v.organizerName, url: v.organizerUrl },
        offers: v.price || v.ticketUrl ? { "@type": "Offer", price: v.price || "0", priceCurrency: v.currency || "AED", url: v.ticketUrl, availability: "https://schema.org/InStock" } : undefined,
      };
    }
    case "WebSite":
      return { "@type": "WebSite", name: v.name, alternateName: v.alternateName, url: v.url };
  }
}

export function SchemaTool() {
  const [type, setType] = useState("Article");
  const [values, setValues] = useState<Record<string, V>>({});
  const [faq, setFaq] = useState([{ q: "", a: "" }]);
  const [crumbs, setCrumbs] = useState([
    { name: "Home", url: "https://www.example.com/" },
    { name: "", url: "" },
  ]);
  const [wrap, setWrap] = useState(true);
  const def = TYPES.find((t) => t.id === type)!;
  const v = values[type] ?? {};
  const setV = (k: string, val: string) => setValues((p) => ({ ...p, [type]: { ...(p[type] ?? {}), [k]: val } }));

  const { code, missing, warnings } = useMemo(() => {
    const obj = prune(build(type, v, faq, crumbs)) as Record<string, unknown> | undefined;
    const missing = def.fields.filter((f) => f.required && !v[f.key]?.trim()).map((f) => f.label);
    if (def.list === "faq" && !faq.some((f) => f.q.trim() && f.a.trim())) missing.push("At least one question and answer");
    if (def.list === "crumbs" && crumbs.filter((c) => c.name.trim()).length < 2) missing.push("At least two breadcrumb levels");
    const warnings: string[] = [];
    const urls = def.fields.filter((f) => f.kind === "url").map((f) => v[f.key]).filter(Boolean);
    if (urls.some((u) => !/^https?:\/\//.test(u!))) warnings.push("URLs should be absolute, starting with https://");
    if (type === "LocalBusiness" && v.hours && hoursSpec(split(v.hours)).length < split(v.hours).length) warnings.push("Some opening-hours lines couldn't be read. Use the format “Mo-Fr 09:00-18:00”.");
    if (type === "Product" && v.ratingValue && (Number(v.ratingValue) < 1 || Number(v.ratingValue) > 5)) warnings.push("Ratings should be between 1 and 5.");
    if (!obj) return { code: "", missing, warnings };
    const json = JSON.stringify({ "@context": "https://schema.org", ...obj }, null, 2);
    return { code: wrap ? `<script type="application/ld+json">\n${json}\n</script>` : json, missing, warnings };
  }, [type, v, faq, crumbs, wrap, def]);

  const control = (f: FieldDef, id: string) => {
    const common = { id, value: v[f.key] ?? "", placeholder: f.placeholder };
    if (f.kind === "textarea") return <TextArea {...common} rows={3} onChange={(e) => setV(f.key, e.target.value)} />;
    if (f.kind === "lines") return <TextArea {...common} rows={3} onChange={(e) => setV(f.key, e.target.value)} className="t-mono text-sm" />;
    if (f.kind === "select")
      return (
        <Select id={id} value={v[f.key] ?? f.options![0].value} onChange={(e) => setV(f.key, e.target.value)}>
          {f.options!.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      );
    const type = f.kind === "url" ? "url" : f.kind === "date" ? "date" : f.kind === "datetime" ? "datetime-local" : f.kind === "number" ? "number" : "text";
    return <TextInput {...common} type={type} step={f.kind === "number" ? "any" : undefined} onChange={(e) => setV(f.key, e.target.value)} />;
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <Panel title="1 · Choose a schema type">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Schema type">
            {TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={type === t.id}
                onClick={() => setType(t.id)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${type === t.id ? "border-bone bg-bone text-ink" : "border-line-2 text-bone-dim hover:border-bone hover:text-bone"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm text-bone-dim">{def.blurb}</p>
        </Panel>

        <Panel title={`2 · ${def.label} details`}>
          {def.fields.length > 0 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {def.fields.map((f) => (
                <Field key={`${type}-${f.key}`} label={`${f.label}${f.required ? " *" : ""}`} hint={f.hint} className={f.half ? "" : "sm:col-span-2"}>
                  {(id) => control(f, id)}
                </Field>
              ))}
            </div>
          )}

          {def.list === "faq" && (
            <div className="space-y-5">
              {faq.map((f, i) => (
                <div key={i} className="rounded-md border border-line p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="t-label !text-[0.62rem]">Question {i + 1}</span>
                    {faq.length > 1 && (
                      <button type="button" onClick={() => setFaq(faq.filter((_, j) => j !== i))} className="text-xs text-mute hover:text-ember">
                        Remove
                      </button>
                    )}
                  </div>
                  <Field label="Question">{(id) => <TextInput id={id} value={f.q} onChange={(e) => setFaq(faq.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} />}</Field>
                  <Field label="Answer" className="mt-3">
                    {(id) => <TextArea id={id} rows={3} value={f.a} onChange={(e) => setFaq(faq.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} />}
                  </Field>
                </div>
              ))}
              <SmallButton onClick={() => setFaq([...faq, { q: "", a: "" }])}>+ Add question</SmallButton>
            </div>
          )}

          {def.list === "crumbs" && (
            <div className="space-y-3">
              {crumbs.map((c, i) => (
                <div key={i} className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[2rem_minmax(0,1fr)_minmax(0,1.4fr)_auto]">
                  <span className="t-mono pb-3 text-sm text-mute">{i + 1}</span>
                  <Field label="Name">{(id) => <TextInput id={id} value={c.name} onChange={(e) => setCrumbs(crumbs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="Services" />}</Field>
                  <Field label="URL">
                    {(id) => <TextInput id={id} value={c.url} onChange={(e) => setCrumbs(crumbs.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} placeholder="https://www.example.com/services/" />}
                  </Field>
                  <button type="button" disabled={crumbs.length < 2} onClick={() => setCrumbs(crumbs.filter((_, j) => j !== i))} className="pb-3 text-xs text-mute hover:text-ember disabled:opacity-30">
                    Remove
                  </button>
                </div>
              ))}
              <p className="text-xs text-mute">The last item can be left without a URL: it's the current page.</p>
              <SmallButton onClick={() => setCrumbs([...crumbs, { name: "", url: "" }])}>+ Add level</SmallButton>
            </div>
          )}
        </Panel>
      </div>

      <div className="space-y-6 lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:self-start">
        <CodeOutput code={code} title="JSON-LD" filename={`${type.toLowerCase()}-schema.${wrap ? "html" : "json"}`} mime={wrap ? "text/html" : "application/json"} minRows={14} extra={<Toggle checked={wrap} onChange={setWrap} label="Wrap in <script>" />} />
        <Panel title="Validation">
          {missing.length === 0 && warnings.length === 0 ? (
            <p className="text-sm text-bone-dim">
              <span className="text-[#7fd6a4]">✓</span> All required fields are filled in.
            </p>
          ) : (
            <ul className="space-y-2.5 text-sm">
              {missing.map((m) => (
                <li key={m} className="flex gap-3 text-bone">
                  <span aria-hidden="true" className="text-ember">
                    !
                  </span>
                  Required by Google: {m}
                </li>
              ))}
              {warnings.map((w) => (
                <li key={w} className="flex gap-3 text-bone">
                  <span aria-hidden="true" className="text-ember-soft">
                    !
                  </span>
                  {w}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs leading-relaxed text-mute">
            Paste the code into the page's HTML (head or body), then test it with{" "}
            <a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener noreferrer" className="text-bone underline decoration-ember underline-offset-2">
              Google's Rich Results Test
            </a>{" "}
            or the{" "}
            <a href="https://validator.schema.org/" target="_blank" rel="noopener noreferrer" className="text-bone underline decoration-ember underline-offset-2">
              Schema.org validator
            </a>
            . Only mark up content that visitors can actually see on the page.
          </p>
        </Panel>
      </div>
    </div>
  );
}
