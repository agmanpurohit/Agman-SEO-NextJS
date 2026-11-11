import Script from "next/script";

/**
 * Microsoft Clarity (session recordings + heatmaps). Rendered once in the root layout.
 *
 * Same rules as GoogleTag: only loads on the live domain, never on /admin pages, and a
 * browser that has opened /admin stays excluded (/?analytics=on re-enables it).
 *
 * The project ID can be overridden with NEXT_PUBLIC_CLARITY_ID.
 * Clarity's domains are allowed in the Content Security Policy in next.config.ts.
 */
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID?.trim() || "zc3a5czaaq";
const LIVE_HOSTS = ["agmanrajpurohit.com", "www.agmanrajpurohit.com"];

const snippet = `
(function(){
  if (${JSON.stringify(LIVE_HOSTS)}.indexOf(location.hostname) === -1) return;
  var p = location.pathname, KEY = 'ar-no-track';
  try {
    if (/[?&]analytics=on\\b/.test(location.search)) localStorage.removeItem(KEY);
    if (p === '/admin' || p.indexOf('/admin/') === 0) { localStorage.setItem(KEY, '1'); return; }
    if (localStorage.getItem(KEY)) return;
  } catch (e) {
    if (p === '/admin' || p.indexOf('/admin/') === 0) return;
  }
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, "clarity", "script", ${JSON.stringify(CLARITY_ID)});
})();`;

export function Clarity() {
  if (!/^[a-z0-9]+$/i.test(CLARITY_ID)) return null;
  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {snippet}
    </Script>
  );
}
