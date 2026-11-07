import Script from "next/script";

/**
 * Google tag (Tag Manager container GTM-TKHSB426, which carries the GA4 setup).
 * Rendered once in the root layout, so it runs on every page.
 *
 * It only loads on the live domain, so local development and Vercel preview deployments
 * don't add fake visits to GA4. Client-side page changes are picked up by GA4's enhanced
 * measurement ("page changes based on browser history events", on by default).
 *
 * Never loads on /admin pages, and a browser that has opened /admin stays excluded
 * (so the owner's own visits aren't counted). /?analytics=on re-enables it for that browser.
 *
 * The container ID can be overridden with NEXT_PUBLIC_GTM_ID.
 */
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID?.trim() || "GTM-TKHSB426";
const LIVE_HOSTS = ["agmanrajpurohit.com", "www.agmanrajpurohit.com"];

const snippet = `
(function(){
  if (${JSON.stringify(LIVE_HOSTS)}.indexOf(location.hostname) === -1) return;
  var p = location.pathname, KEY = 'ar-no-track';
  try {
    // Visiting /?analytics=on turns tracking back on for this browser.
    if (/[?&]analytics=on\\b/.test(location.search)) localStorage.removeItem(KEY);
    // Admin pages are never tracked, and the browser used for admin is excluded from then on,
    // so the site owner's own visits don't count as traffic.
    if (p === '/admin' || p.indexOf('/admin/') === 0) { localStorage.setItem(KEY, '1'); return; }
    if (localStorage.getItem(KEY)) return;
  } catch (e) {
    if (p === '/admin' || p.indexOf('/admin/') === 0) return;
  }
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  window.gtag = gtag;
  gtag('js', new Date());
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtm.js?id=' + ${JSON.stringify(GTM_ID)};
  document.head.appendChild(s);
})();`;

export function GoogleTag() {
  if (!/^GTM-[A-Z0-9]+$/.test(GTM_ID)) return null;
  return (
    <Script id="google-tag" strategy="afterInteractive">
      {snippet}
    </Script>
  );
}
