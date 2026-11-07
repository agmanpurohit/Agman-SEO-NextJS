"use client";

import { useState } from "react";
import { Field, Panel, Segmented, TextArea, TextInput, Toggle } from "./ui";
import { DESC_FONT, LIMITS, PixelMeter, SerpCard, TITLE_FONT, textWidth, useMeasureReady, type Device } from "./serp";

const today = () => new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export function SerpPreviewTool() {
  const ready = useMeasureReady();
  const [title, setTitle] = useState("SEO Specialist in Dubai | Technical & Local SEO");
  const [desc, setDesc] = useState("I help Dubai businesses get found on Google and in AI answers. Technical fixes, local SEO and content that brings in enquiries, not just traffic.");
  const [url, setUrl] = useState("https://www.example.com/services/seo-dubai");
  const [siteName, setSiteName] = useState("");
  const [keyword, setKeyword] = useState("SEO");
  const [showDate, setShowDate] = useState(false);
  const [device, setDevice] = useState<Device>("desktop");

  const lim = LIMITS[device];
  // Pixel widths need the browser; render 0 on the server and first paint so hydration matches.
  const titlePx = ready ? textWidth(title, TITLE_FONT[device]) : 0;
  const descPx = ready ? textWidth(desc, DESC_FONT) : 0;
  const kw = keyword.trim().toLowerCase();

  const checks = [
    { ok: titlePx > 0 && titlePx <= lim.title, text: titlePx > lim.title ? "Title is wider than Google shows, so the end will be cut off." : titlePx === 0 ? "Add a title." : "Title fits without being cut off." },
    { ok: descPx >= 400 && descPx <= lim.desc, text: descPx > lim.desc ? "Description will be truncated. Put the important part first." : descPx < 400 ? "Description is short. Google is more likely to replace it with text from the page." : "Description length is in the sweet spot." },
    ...(kw
      ? [
          { ok: title.toLowerCase().includes(kw), text: title.toLowerCase().includes(kw) ? "Keyword appears in the title." : "Keyword is missing from the title." },
          { ok: desc.toLowerCase().includes(kw), text: desc.toLowerCase().includes(kw) ? "Keyword appears in the description (Google bolds matching words)." : "Keyword is missing from the description." },
          {
            ok: title.toLowerCase().indexOf(kw) > -1 && title.toLowerCase().indexOf(kw) < title.length / 2,
            text: title.toLowerCase().indexOf(kw) > -1 && title.toLowerCase().indexOf(kw) < title.length / 2 ? "Keyword sits in the first half of the title." : "Try moving the keyword closer to the start of the title.",
          },
        ]
      : []),
    { ok: !/(.)\1{3,}|!!|\?\?/.test(title + desc) && title !== title.toUpperCase(), text: title && title === title.toUpperCase() ? "All-caps titles look like shouting and are often rewritten." : "No spammy punctuation or all-caps." },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <Panel title="Your snippet">
        <div className="space-y-5">
          <Field label="Page title" count={{ value: title.length, max: 60, min: 30 }}>
            {(id) => <TextInput id={id} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Emergency Dentist in Dubai Marina | Open 7 Days" />}
          </Field>
          <Field label="Meta description" count={{ value: desc.length, max: 160, min: 120 }}>
            {(id) => <TextArea id={id} rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Summarise the page and give a reason to click." />}
          </Field>
          <Field label="Page URL">{(id) => <TextInput id={id} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.example.com/page" inputMode="url" />}</Field>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Site name (optional)" hint="Google shows a site name above the URL.">
              {(id) => <TextInput id={id} value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="Example Clinic" />}
            </Field>
            <Field label="Search keyword" hint="Matching words are shown in bold.">
              {(id) => <TextInput id={id} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. dentist dubai" />}
            </Field>
          </div>
          <Toggle checked={showDate} onChange={setShowDate} label="Show a date" hint="Articles and news often show a publish date before the description." />
        </div>
      </Panel>

      <div className="space-y-6">
        <Panel title="Google preview" actions={<Segmented label="Device" value={device} onChange={setDevice} options={[{ value: "desktop", label: "Desktop" }, { value: "mobile", label: "Mobile" }]} />}>
          <div className="rounded-md bg-[#f8f9fa] p-4 md:p-6">
            <SerpCard title={title} description={desc} url={url} siteName={siteName} keyword={keyword} date={showDate && ready ? today() : undefined} device={device} />
          </div>
          <div className="mt-6 space-y-4">
            <PixelMeter label="Title width" px={titlePx} max={lim.title} min={280} />
            <PixelMeter label="Description width" px={descPx} max={lim.desc} min={400} />
          </div>
        </Panel>
        <Panel title="Checks">
          <ul className="space-y-2.5">
            {checks.map((c) => (
              <li key={c.text} className="flex gap-3 text-sm">
                <span aria-hidden="true" className={c.ok ? "text-[#7fd6a4]" : "text-ember"}>
                  {c.ok ? "✓" : "!"}
                </span>
                <span className={c.ok ? "text-bone-dim" : "text-bone"}>
                  <span className="sr-only">{c.ok ? "Pass: " : "Fix: "}</span>
                  {c.text}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
