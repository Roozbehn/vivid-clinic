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
  real summary stats rather than hardcoded. Also added to the page's
  FAQPage JSON-LD for SEO parity.
- **New `/consultation/` route** (`src/app/consultation/page.tsx`), mirroring
  the static site's separate consultation page, with its own
  MedicalClinic/WebPage/BreadcrumbList/FAQPage JSON-LD:
  - **Consultation hero** (`src/components/sections/consultation-hero-section.tsx`)
    — real copy from `consult_hero`, with quick links into the estimate
    tool, the booking form, and WhatsApp.
  - **Price-estimate calculator** (`src/components/ui/estimate-tool.tsx`,
    `src/components/sections/estimate-section.tsx`, `src/lib/estimate-pricing.ts`)
    — a faithful React port of the static site's `src/js/estimate.js`:
    category filter chips + search over the real 66-service/13-category
    price list (`src/data/estimate-pricing.json`, synced through the same
    data pipeline as the reviews), per-service add/remove, a live summary
    with the best-matching real bundle-discount logic, and a "Send estimate
    on WhatsApp" share using the real prefill message template. Session-only
    state, no localStorage — same as the original.
  - **Booking form** (`src/components/ui/booking-form.tsx`,
    `src/components/sections/booking-section.tsx`, `src/lib/booking-options.ts`)
    — collects the same fields and validation as the static site's 5-step
    wizard (`src/js/booking.js`), but as a **single-step form** rather than
    a wizard — a deliberate scope simplification to manage the size of this
    migration; the multi-step UX is a candidate for a future pass. All
    treatment/category/timeline/language/etc. option lists are the repo's
    real `booking-options.json`, not invented. There is no backend in this
    static export, so on submit the form goes straight to the *original
    site's own designed fallback behavior*: `src/js/booking.js` already
    falls back to a prefilled WhatsApp message whenever its POST to
    `/api/booking` fails, so building this version as WhatsApp-only (no
    fetch attempted at all) is a faithful reimplementation of existing
    behavior, not a deviation from it.
  - **"How it works"** (`src/components/sections/how-it-works-section.tsx`)
    — the real 4-step explanation, ported verbatim.
  - **"Why book with Vivid Clinic"** (`src/components/sections/why-book-section.tsx`)
    — reuses the same real `FEATURES` list as the homepage's "Why Vivid
    Clinic" section (now extracted to `src/lib/features.ts` +
    `src/components/ui/feature-grid.tsx` so both sections share one source
    of truth), exactly as `scripts/build-site.mjs` reuses the same
    `features` array for both sections on the static site.
  - **International-patients section** (`src/components/sections/international-section.tsx`)
    — real copy from `international`.
  - **Booking/estimate FAQ section** (`src/components/sections/booking-faq-section.tsx`,
    `src/lib/booking-faq.ts`) — the site's other 6 FAQs, ported verbatim;
    the "will I receive an exact price" answer's price examples (hair
    transplant, rhinoplasty, breast implants, gastric sleeve) are computed
    from the real price list via `fromPriceFor()`, not hardcoded.
  - Header now links to `/consultation/` (replacing the external "View on
    Google" link, which is still reachable from the score-summary section
    and footer), and the homepage CTA band + footer's "Free consultation &
    estimate" link now point at this internal route instead of
    `vividclinic.net`.
- `next build` (static export to `web/out/`) passes clean: TypeScript
  typecheck, ESLint (0 errors, 2 pre-existing-pattern warnings noted below),
  and static generation all succeed for both `/` and `/consultation/`.
  Visually verified at desktop (1440px) and mobile (390px) widths, including
  the review grid's search/filter, the FAQ accordions, the estimate
  calculator's live selection/total/bundle-discount, and the booking form.

## What's NOT done yet

The static site's 13-locale (incl. RTL) i18n layer is the only major piece
left unported — everything else from the original static site now has a
React/Tailwind/shadcn-conventions equivalent in `web/`. Also not yet done:
re-verifying the Lighthouse 100/100/100 + sitemap/indexing behavior the
static site currently has, and deciding whether the booking form should
become a multi-step wizard again (currently single-step, see above). This
migration should be treated as in progress, not complete — please don't
point the production domain at `web/out/` yet.

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
