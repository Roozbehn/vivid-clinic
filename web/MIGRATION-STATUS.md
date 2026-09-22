# React/shadcn/Tailwind migration — status

This `web/` app is a **new**, parallel front end for vivid.clinic, built with
Next.js (App Router, static export), TypeScript, Tailwind CSS v4, and
shadcn/ui conventions, per the explicit decision to migrate off the
repo-root static HTML/CSS/JS site rather than port the new testimonials
component into it as-is.

**The root-level static site (`/src`, `/scripts`, `npm run build` at repo
root) is untouched and still deploys as-is.** Nothing here changes it. This
folder is additive until it's ready to replace the production build.

## What's done

- Next.js 16 + React 19 + TypeScript + Tailwind v4 scaffolded in `web/`.
- shadcn/ui conventions set up by hand (`components.json`, `src/lib/utils.ts`
  `cn()` helper, CSS-variable theme in `src/app/globals.css`) — the `shadcn`
  CLI's registry (`ui.shadcn.com`) isn't reachable from this build sandbox,
  so components were hand-authored to the same conventions instead of
  `npx shadcn add`. Re-running the CLI from a machine with normal network
  access should work fine if you want to `add` further components later.
- Design tokens ported from the locked Vivid brand system (teal `#0E4B4E`,
  cream `#FAF7F2`, gold `#B8945A`, ink `#1F2937`, Cormorant Garamond +
  Inter) and refined with pixelpoint.io's rhythm: generous vertical spacing,
  wide-tracked uppercase eyebrows, quieter card borders/shadows instead of
  heavy chrome. See `src/app/globals.css`.
- Fonts are **self-hosted** via `next/font/local` (files + OFL licenses in
  `src/app/fonts/`) rather than fetched from Google Fonts at request time —
  faster, works offline, and avoids sending EU visitors' IPs to Google on
  every page load, which matters for an EU/int'l-patient site.
- `motion` (the package named in your brief) installed and used in
  `src/components/ui/testimonials-columns-1.tsx` for the auto-scrolling
  columns effect.
- **Testimonials section fully rebuilt and wired to real data** —
  `src/lib/testimonials.ts` holds 9 real, verbatim excerpts pulled from
  `../src/data/google-reviews.json` (the repo's authorized, GBP-API-sourced
  dataset of 159 real reviews). No placeholder/fabricated review content
  anywhere, per `README-reviews.md`'s compliance rules — same rule this repo
  already enforces on the static site. The medical disclaimer required by
  that doc is preserved in the section footer.
- Hero section rebuilt in the new visual language, with the real 5.0 / 159 /
  98% stats and the real WhatsApp deep link + prefill text from
  `src/data/clinic.json`.
- **Score/rating summary section** (`src/components/sections/score-summary-section.tsx`) —
  the real average rating and full 5★–1★ distribution bars, computed from
  `src/lib/reviews.ts`'s `reviewsSummary` (sourced from the repo's real
  `google-reviews.json`), with a "View on Google" link out to the GBP.
- **Full searchable/sortable review grid** (`src/components/sections/reviews-section.tsx`,
  `src/components/ui/review-grid.tsx`, `src/components/ui/review-card.tsx`) —
  all reviews that have written text (155 of the 159), each rendered
  verbatim (translated reviews show the translation with a "Translated from
  X by Google" label and never replace the original; owner replies from
  Vivid Clinic are shown inline). Client-side search-by-name/text, sort by
  newest/highest/lowest, and "Show more" pagination (12 at a time) so all
  results stay reachable without a heavy initial payload. The medical
  disclaimer is repeated in this section's footer too.
- **Data-sync pipeline** (`web/scripts/sync-data.mjs`, wired into `predev`/
  `prebuild`) — copies the repo-root `src/data/{google-reviews.json,
  clinic.json, google-media.json}` into a gitignored `web/src/data/generated/`
  before every dev server start and build, so `web/` always reads the same
  single source-of-truth data as the static site instead of a duplicated copy
  that could drift. `src/lib/clinic.ts`, `src/lib/reviews.ts` and
  `src/lib/gallery.ts` all load from this generated folder.
- **Site header and footer** (`src/components/layout/site-header.tsx`,
  `site-footer.tsx`), wired into `src/app/layout.tsx` so every page gets
  them. Real address, phone, WhatsApp, and social links from
  `src/data/clinic.json`; footer's "reviews last updated" date is computed
  from the real dataset, not hardcoded.
- **Patient photo gallery** (`src/components/sections/photos-section.tsx`,
  `src/lib/gallery.ts`) — the clinic's real, self-hosted Google Business
  Profile photos (`src/assets/gbp/*.jpg`, copied into `web/public/gbp/` the
  same way the fonts were self-hosted), with real uploader names and dates.
  Per README-reviews.md's compliance note, photos are shown as standalone
  listing uploads, never tied to a specific review.
- **"Why Vivid Clinic" section** (`src/components/sections/why-section.tsx`)
  — the same 6 real feature/benefit statements from the static site's i18n
  catalog, now with `lucide-react` icons (as named in the original brief)
  instead of inline SVG.
- **Review themes section** (`src/components/sections/themes-section.tsx`,
  `src/lib/themes.ts`) — real theme counts (communication, staff,
  cleanliness, doctor, coordination, follow-up, results, value), computed
  client-side from the `tags` field already present on every review in the
  dataset — the exact same aggregation logic as `scripts/lib.mjs`'s
  `computeThemes`, just re-implemented in TypeScript.
- **CTA band** (`src/components/sections/cta-section.tsx`) — WhatsApp, call,
  and consultation links, all real. Note: it links out to
  `vividclinic.net`'s consultation page for now rather than an in-page
  `#book`/`#estimate` anchor, since the booking form and estimate calculator
  don't exist in this app yet (see below) — switch those links to internal
  anchors once those sections are built.
- **FAQ section** (`src/components/sections/faq-section.tsx`, `src/lib/faq.ts`)
  — the static site's 6 review-authenticity FAQs, ported verbatim, with the
  dynamic "the page currently shows N reviews…" sentence computed from the
  real summary stats rather than hardcoded. (The site's other 6
  booking/estimate FAQs are deferred until the booking flow and estimate
  tool they describe actually exist in this app — see below.) Also added to
  the page's FAQPage JSON-LD for SEO parity.
- `next build` (static export to `web/out/`) passes clean: TypeScript
  typecheck, ESLint (0 errors, 2 pre-existing-pattern warnings noted below),
  and static generation all succeed. Visually verified at desktop (1440px)
  and mobile (390px) widths, including the search/filter interaction on the
  review grid and the FAQ accordion.

## What's NOT done yet (this was a large ask — see the PR for the full list)

Remaining: price-estimate calculator, booking form (backed by
`functions/api/booking.js`), "how it works", "why book with us" (a
consultation-page repeat of the why-Vivid features), international-patient
info, the 6 booking/estimate FAQs, and the site's 13-locale (incl. RTL) i18n
layer. All of those live on the static site's separate `/consultation/` page
and/or depend on the estimate/booking tools, so they're a bigger, riskier
chunk than what's above — deliberately left for a dedicated pass. Porting
them, plus re-verifying the Lighthouse 100/100/100 + sitemap/indexing
behavior the static site currently has, is realistically its own
multi-session project. This migration should be treated as in progress, not
complete — please don't point the production domain at `web/out/` yet.

## Known sandbox-only artifact

Reviewer avatars (`lh3.googleusercontent.com/...`) won't load when this is
previewed from a network-restricted sandbox (this build environment
included) — that's a local network restriction, not a code bug. They load
normally on any host with normal internet access, exactly as they already
do on the live root site.

## Running it

```bash
cd web
npm install
npm run dev      # http://localhost:3000
npm run build    # static export to web/out/
```
