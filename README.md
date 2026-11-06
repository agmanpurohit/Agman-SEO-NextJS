# Agman Rajpurohit — Portfolio

Cinematic portfolio — **Home, Experience, Work, Contact** — plus a free **SEO Audit** tool (`/seo-audit`).
Built with Next.js 16 (App Router), Tailwind CSS 4, GSAP (ScrollTrigger, SplitText, Flip), Lenis and OGL.

## SEO audit tool

**Flow:** URL → `POST /api/audits` (validation, SSRF checks, rate limits) → the results page calls
`POST /api/audits/:id/step` repeatedly; each call does one real unit of work and saves it in Postgres →
results dashboard → name + email (`POST /api/audits/:id/lead`) → PDF (`GET /api/audits/:id/report?token=…`) + email.

| Piece | File |
|---|---|
| Limits and settings | `src/lib/audit/config.ts` |
| SSRF-safe fetcher (DNS + IP checks at connect time, manual redirects, size/time caps) | `src/lib/audit/net.ts` |
| HTML parsing (no script execution) | `src/lib/audit/parse.ts` |
| robots.txt + sitemaps | `src/lib/audit/discover.ts` |
| Stage runner, crawler, storage | `src/lib/audit/runner.ts` |
| Check definitions (rule, severity, why, fix) | `src/lib/audit/checks-meta.ts` |
| Check evaluation (8 modules) | `src/lib/audit/checks.ts` |
| Scoring + action-plan priority | `src/lib/audit/scoring.ts` |
| Google PageSpeed Insights | `src/lib/audit/pagespeed.ts` |
| PDF report | `src/lib/audit/report.tsx` |
| Emails | `src/lib/audit/email.ts` |
| Admin auth / leads queries | `src/lib/audit/admin-auth.ts`, `src/lib/audit/leads.ts` |
| UI | `src/components/audit/*`, `src/app/seo-audit/*`, `src/app/admin/page.tsx` |

**Database:** Neon Postgres. Tables (`audits`, `audit_queue`, `audit_pages`, `audit_findings`, `leads`,
`reports`, `rate_limits`) are created automatically on first use — just set `DATABASE_URL`.

**Admin:** `/admin`, password = `ADMIN_PASSWORD`. View/search/filter leads, open results, download PDFs, export CSV.

**Emailing reports to visitors:** Resend only delivers to arbitrary addresses from a verified domain. After
buying agmanrajpurohit.com: add it in Resend → Domains, add the DNS records, then set
`CONTACT_FROM_EMAIL="Agman Rajpurohit <hello@agmanrajpurohit.com>"` and `REPORT_SEND_TO_VISITOR=true`.
Until then every report is emailed to `CONTACT_TO_EMAIL` with the lead's details, and visitors download theirs.

**Known limits (by design):** up to 100 pages / depth 4 per audit; JavaScript isn't executed (JS-only sites are
flagged, not rendered); PageSpeed runs on the start page only (mobile + desktop); external link status isn't
checked; orphan detection needs a complete crawl and a sitemap; an audit pauses if the visitor closes the tab
and resumes when the link is reopened. On Vercel, the step route needs up to 120 s (`maxDuration`) for slow
PageSpeed responses — if your plan allows less, those checks are marked “not tested” instead of failing.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm start          # serve the production build
```

## Edit content (no component changes needed)

| What | File |
|---|---|
| Name, role, email, LinkedIn, phones, locations, availability | `src/content/site.ts` |
| Home copy: hero, approach, disciplines, numbers, closing CTA | `src/content/home.ts` |
| Jobs, freelance, capabilities, tools, education, certifications | `src/content/experience.ts` |
| Case studies, filters, charts | `src/content/work.ts` |
| CV download | replace `public/Agman-Rajpurohit-CV.pdf` (keep the name) |
| Portrait | replace `public/images/agman-rajpurohit.png` |

Email, LinkedIn and the site URL can also be set with environment variables (see `.env.example`).

**Rule for numbers:** every figure on the site comes from the CV or from records Agman approved. Keep it that way.

## Contact form

The form posts to `src/app/api/contact/route.ts`, which validates input, filters bots (honeypot + timing),
rate-limits and sends the message through [Resend](https://resend.com).

1. Create a free Resend account and an API key.
2. Copy `.env.example` to `.env.local` and set `RESEND_API_KEY` and `CONTACT_TO_EMAIL`.
3. On Vercel, add the same variables under Project → Settings → Environment Variables.
4. Until you verify your own domain in Resend, keep `CONTACT_FROM_EMAIL=Portfolio <onboarding@resend.dev>`;
   Resend will then only deliver to the address your Resend account uses.

Without these variables the form still validates, but tells visitors to email or WhatsApp instead.
It never pretends a message was sent.

## Brand assets

- `brand-source/logo-original.webp` — the logo as supplied (do not edit).
- `public/brand/logo-*.svg` and `src/components/brand/logo-paths.ts` — vector trace of that logo
  (mark, full lockup, wordmark). The notch is recoloured to the site's ember accent.

## Structure

```
src/
  app/            routes (4 pages), API, sitemap, robots, OG image, icon
  components/
    shell/        preloader, header, footer, cursor, page transitions, smooth scroll, WebGL backdrop
    home/         hero and homepage sections
    experience/   timeline
    work/         filterable gallery, case overlay, charts, covers
    contact/      form
    ui/           buttons, motion primitives (reveals, split text, counters), page hero
  content/        all editable copy and data
  lib/            GSAP setup, scroll + stage helpers, SEO helpers
```

## Motion & accessibility notes

- The preloader shows once per browser session and is skipped with `prefers-reduced-motion`.
- With reduced motion: no smooth scroll, no WebGL, no scroll-scrubbed effects; all content visible.
- The custom cursor and WebGL backdrop only run on devices with a fine pointer (mouse/trackpad).
- Case studies open as an accessible dialog (Esc to close, ← → to move between cases) and deep-link via `/work?case=<slug>`.
