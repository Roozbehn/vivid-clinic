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
  disclaimer is repeated in this section's footer too. (Sort options were
  originally an invented "newest/highest/lowest" — fixed in Phase B below
  to match the real site's Featured/Newest/Most-detailed chips.)
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
  and consultation links, all real. `hasInlineTools` picks in-page
  `#book`/`#estimate` anchors when the tools are embedded on the same page,
  or that locale's own `/consultation/#book`/`#estimate` otherwise (updated
  in Phase B once every locale had a real `/consultation/` page to link to
  — see below).
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
- **13-locale i18n layer — Phase A (homepage + shared layout).** Full port
  of the static site's locale architecture and real translation catalogs,
  matching the 13 locales `scripts/build-site.mjs` ships (ar, bg, de, es,
  fa, fr, he, it, nl, ru, tr, uk, zh) plus unprefixed English as the
  default:
  - `src/lib/i18n/locales.ts` — ported `LOCALES`/`AUTONYMS` config
    (hreflang, htmlLang, `dir`, OG locale) and `localeHref()`/`isRtl()`
    helpers.
  - `src/lib/i18n/dictionary.ts` — a typed `Dictionary` interface (the
    subset of the real catalog wired up so far) + `getDictionary(locale)`,
    statically importing `src/data/i18n/source.en.json` (the single
    source of truth English now draws from too, instead of duplicating
    English strings in component code) and all 13 `ui.<code>.json` packs,
    deep-merged over English so a partial or stale translation never
    renders blank.
  - `src/lib/i18n/format.ts` — `fmt()`, the same `{token}` interpolation
    the static site's `tf()` helper uses.
  - `src/lib/i18n/alternates.ts` — builds the Metadata API's
    `alternates.languages` map (all 14 variants + x-default) from the same
    locale config, mirroring `hreflangBlock()`.
  - **Routing**: real Next.js "multiple root layouts" split — English
    lives at `app/(en)/` with no URL prefix (its own root layout, fonts,
    `<html lang="en">`), the 13 translated locales live at
    `app/(intl)/[locale]/` (own root layout, `generateStaticParams()` over
    the 13 codes, `<html lang dir="rtl"|"ltr">` per locale). A static
    export has no middleware/rewrites to vary `<html>` per request, which
    is why this needs two root layouts rather than one.
  - **Localized**: header, footer (incl. the language switcher —
    `src/components/ui/language-switcher.tsx`, autonyms in each language's
    own script, always links to the target locale's homepage since
    subpages aren't localized yet), hero, score summary, review grid +
    review cards (translation/owner-reply labels, per-review "Review on
    Google" link, locale-aware date formatting), photo gallery, "Why Vivid
    Clinic", review themes, CTA band, FAQ.
  - Translated homepages' CTA/footer/header consultation links pointed out
    to the real, live `vividclinic.net` flow in Phase A (no localized
    `/consultation/` existed yet) — **superseded in Phase B below**, now
    that every locale has its own real `/consultation/` page.
  - `web/scripts/sync-data.mjs` also copies the full `src/data/i18n/`
    catalog (27 files: `source.en.json` + 13 `ui.*.json` + 13
    `reviews.*.json`) into `web/src/data/generated/i18n/`.

- **13-locale i18n layer — Phase B (consultation page, review-text overlay,
  sitemap).**
  - **`/consultation/` fully localized in all 13 locales**
    (`app/(intl)/[locale]/consultation/page.tsx`, mirroring
    `app/(en)/consultation/page.tsx` section for section): consultation
    hero, price-estimate calculator (`estimate-tool.tsx` — every filter
    chip, search placeholder, count text, Add/Added button, summary aside,
    bundle-discount line, WhatsApp share text, and disclaimer now dictionary-
    driven via `js_estimate`, plus the real per-locale treatment/bundle
    names, descriptions, and category labels via `getLocalizedPricing()`),
    booking form (`booking-form.tsx` — every legend/label/placeholder/help/
    error/summary/WhatsApp-line/success string now dictionary-driven via
    `js_booking`, using `getLocalizedBookingOptions()` for the real
    category/treatment/timeline/language/etc. option labels), "how it
    works", "why book", international-patients, and booking FAQ (price
    examples still computed from the real price list, joined with `، ` on
    the Persian page to match the static site's own locale-aware joiner).
  - **Consultation hero's buttons realigned** to the real site's actual
    3-button pattern (`common.start_consultation` → `#book`,
    `common.contact_on_whatsapp` → WhatsApp, `common.read_patient_reviews`
    → the locale's homepage), replacing the bespoke English-only buttons
    ("Get an estimate" / "Go straight to the form" / "WhatsApp instead")
    this section previously shipped with — those weren't real site copy.
  - **Estimate-tool → booking-form handoff**: "Continue to consultation"
    now dispatches the same `vivid:prefill-booking` custom event
    `src/js/estimate.js` does, carrying the selected treatments' booking
    category (via the same `CATMAP`) and a real prefilled message
    (`js_estimate.booking_prefill_message`) into the booking form's first
    step — not just a scroll-to-anchor as before.
  - **Internal consultation links generalized to every locale**: now that
    `/consultation/` is real everywhere, `site-header.tsx`, `site-footer.tsx`,
    and `cta-section.tsx` link to `${localeHref(locale)}/consultation/`
    unconditionally (previously only English linked internally; translated
    locales linked out to `vividclinic.net`). `cta-section.tsx`'s
    `hasInlineTools=false` path (translated homepages, which still don't
    embed the tools inline) now points its book/estimate buttons at that
    locale's own `/consultation/#book`/`#estimate` instead of the external
    site.
  - **Per-review translation overlay wired up**
    (`src/lib/review-i18n.ts`) — a faithful port of
    `scripts/build-site.mjs`'s `reviewLoc()`/`shortHash()`: each
    `reviews.<code>.json` pack's per-review translation is validated
    against a hash of the review's current source text (and, in newer
    catalog entries, its reply) before being shown, so a stale translation
    generated against different source text is silently dropped rather
    than shown next to a mismatched review — same cache-invalidation
    contract as the static site. `review-card.tsx` shows the localized
    text as the main body with a "Show original"/"Hide original" toggle
    revealing the verbatim source (and original reply) underneath,
    matching the static site's real UX and `reviews_ui.card_show_original`/
    `card_hide_original`/`card_auto_translated*` copy; this is separate
    from (and composes with) each review's own Google-provided
    `translatedText`, which is unaffected.
  - **Review grid sort options fixed**: replaced the invented "Highest
    rated"/"Lowest rated" (no equivalent in the real catalog, and not
    part of the real site's UI) with the real site's actual three visible
    sort chips — Featured (default: featured first, then newest), Newest,
    Most detailed (longest original review text first) — using the real
    `chip_sort_featured`/`chip_sort_newest`/`chip_sort_detailed` catalog
    keys, and including each review's localized text in the search index
    alongside its original/Google-translated text.
  - **Sitemap + robots** (`app/sitemap.ts`, `app/robots.ts`) — a faithful
    port of `scripts/build-site.mjs`'s `sitemap.xml`/`robots.txt`: `/` and
    the 13 `/<locale>/` home routes (priority 1.0/0.8, only listed once
    real reviews are imported, matching the static site's noindex-while-
    empty behavior) plus `/consultation/` and the 13
    `/<locale>/consultation/` routes (priority 0.9/0.7, always listed),
    each with the same 15-way `<xhtml:link>` alternate block
    (`lib/i18n/alternates.ts`, now also used for `/consultation/`) Google's
    multilingual sitemap format expects. `robots.txt` always allows
    crawling and references the sitemap.
- `next build` (static export to `web/out/`) passes clean: TypeScript
  typecheck, ESLint (0 errors, 1 pre-existing-pattern warning unrelated to
  this migration), and static generation all succeed — 33 pages: `/`,
  `/consultation/`, `/sitemap.xml`, `/robots.txt`, and both a homepage and
  a `/consultation/` page for each of the 13 locales. Visually verified at
  desktop width, including an RTL locale (`fa`, `dir="rtl"`, fully
  localized estimate tool and booking form), a locale homepage's real
  Featured/Newest/Most-detailed sort chips (Featured selected by default),
  and a translated review card's "Show original"/"Hide original" toggle.
  `sitemap.xml` verified to contain 28 URLs (14 home + 14 consultation)
  with absolute, correctly-prioritized entries and 15 alternates each.

## What's NOT done yet

Re-verifying the Lighthouse 100/100/100 behavior the static site currently
has; deciding whether the booking form should become a multi-step wizard
again (currently single-step, a deliberate Phase A scope simplification —
see above); and the bonus testimonials-columns section (built from real
English review excerpts that can't be translated without fabricating copy
— not part of the original static site) stays English-only by design, on
every locale including English's own homepage variant.

This migration should be treated as in progress, not complete — please
don't point the production domain at `web/out/` yet.

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
