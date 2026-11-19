"use client";

import { useEffect, useState } from "react";

/**
 * Hindi version of the whole site, free, via Google's website translator.
 *
 * - Choosing हिं sets Google's `googtrans=/en/hi` cookie and reloads; choosing EN clears it.
 *   A reload keeps it reliable: text-splitting animations are told before paint not to split
 *   (see SplitText in lib/gsap), so headings translate as whole sentences.
 * - Google's script loads only for visitors who picked Hindi. English visitors download
 *   nothing extra and send nothing to Google Translate.
 * - Google's own banner and tooltips are hidden in globals.css; the switch is the only UI.
 * - Pages stay English for search engines (the translation happens in the visitor's browser).
 */
type Lang = "en" | "hi";
const COOKIE = "googtrans";

function cookieDomains() {
  const host = location.hostname;
  const parts = host.split(".");
  // Google sets the cookie on the host and on the parent domain; clear every variant.
  const list = [host, `.${host}`];
  if (parts.length > 2) list.push(`.${parts.slice(-2).join(".")}`);
  return list;
}

function setLang(lang: Lang) {
  const expire = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = `${COOKIE}=; ${expire}; path=/`;
  for (const d of cookieDomains()) document.cookie = `${COOKIE}=; ${expire}; path=/; domain=${d}`;
  if (lang === "hi") {
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${COOKIE}=/en/hi; max-age=${maxAge}; path=/; SameSite=Lax`;
    if (location.hostname.includes(".")) document.cookie = `${COOKIE}=/en/hi; max-age=${maxAge}; path=/; domain=.${location.hostname.split(".").slice(-2).join(".")}; SameSite=Lax`;
  }
  location.reload();
}

const currentLang = (): Lang => (document.documentElement.classList.contains("lang-hi") ? "hi" : "en");

/**
 * React updates text that Google Translate has replaced; without this, React can throw
 * "removeChild: the node is not a child" and blank the page. Standard workaround: ignore
 * operations on nodes that Google moved. Only installed in Hindi mode.
 */
function patchDomForTranslation() {
  const w = window as unknown as { __trPatched?: boolean };
  if (w.__trPatched) return;
  w.__trPatched = true;
  const removeChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) return child;
    return removeChild.call(this, child) as T;
  };
  const insertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(this: Node, node: T, ref: Node | null): T {
    if (ref && ref.parentNode !== this) return node;
    return insertBefore.call(this, node, ref) as T;
  };
}

/** Loads Google's translator in Hindi mode. Rendered once, in the root layout. */
export function HindiTranslator() {
  useEffect(() => {
    if (currentLang() !== "hi") return;
    patchDomForTranslation();
    const w = window as unknown as { googleTranslateElementInit?: () => void; google?: { translate?: { TranslateElement: new (o: object, id: string) => unknown } } };
    w.googleTranslateElementInit = () => {
      if (w.google?.translate) new w.google.translate.TranslateElement({ pageLanguage: "en", includedLanguages: "hi", autoDisplay: false }, "google_translate_element");
    };
    if (document.getElementById("gt-script")) return;
    const s = document.createElement("script");
    s.id = "gt-script";
    s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    s.async = true;
    document.body.appendChild(s);
  }, []);
  return <div id="google_translate_element" hidden aria-hidden="true" />;
}

/** EN / हिं toggle. `compact` is the smaller version beside the mobile menu button. */
export function LanguageSwitch({ compact = false }: { compact?: boolean }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => setLangState(currentLang()), []);
  const opt = (value: Lang, label: string, title: string) => {
    const active = lang === value;
    return (
      <button
        type="button"
        role="radio"
        aria-checked={active}
        lang={value}
        title={title}
        onClick={() => !active && setLang(value)}
        className={`rounded-full leading-none transition-colors ${compact ? "px-2.5 py-1.5 text-[0.7rem]" : "px-3 py-1.5 text-[0.75rem]"} ${active ? "bg-bone text-ink" : "text-bone-dim hover:text-bone"}`}
      >
        {label}
      </button>
    );
  };
  return (
    <div role="radiogroup" aria-label="Language / भाषा" translate="no" className="notranslate flex items-center rounded-full border border-line-2 p-0.5 font-medium">
      {opt("en", "EN", "English")}
      {opt("hi", "हिं", "हिंदी में देखें (Hindi)")}
    </div>
  );
}
