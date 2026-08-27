# Vivid Clinic — Reviews landing page (`vivid.clinic`)

A fast, accessible, SEO-safe landing page that publishes Vivid Clinic's **real Google
reviews**, sourced from the clinic's **authorized Google Business Profile (GBP) API**.

- **Live target:** `https://vivid.clinic/` (and `https://vivid.clinic/reviews/`)
- **Business site:** `https://vividclinic.net`
- **Stack:** framework-free static site (HTML + one CSS file + one small JS file),
  generated from a JSON data file by Node scripts. Deploy anywhere static
  (Cloudflare Pages recommended — it matches the existing Vivid/Cloudflare setup).

---

## ⏳ Status (as of 23 June 2026)

| | |
|---|---|
| **API route** | **Pending Google allowlist approval** (not an implementation blocker). |
| **Google support case ID** | **3-9557000040792** |
| **Expected approval window** | **~7–10 business days from 23 June 2026** (≈ by **7 July 2026**). |
| **What's blocked** | Only the live review import. The blocker is **external Google allowlist approval**, not this project. The page, importer, validators, build, SEO and quality gates are all complete and passing. |
| **Fallback** | **Authorized export supported** (CSV / JSON / XLSX) — see [§ Authorized export fallback](#-authorized-export-fallback). Use it to go live with real reviews before approval lands. |
| **Current deploy state** | **Empty / `noindex`** until real reviews are imported. The build emits `noindex` automatically while the dataset is empty. Do **not** point ads/campaign traffic at it and do not present it as a finished reviews page until reviews are live. (Override only if you deliberately choose to — see [§ Indexing & waiting-state deployment](#-indexing--waiting-state-deployment).) |

The relevant endpoint, for reference, is the **legacy Google My Business API v4**:
`GET https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/reviews`.
The Account Management API resolves the account; the Business Information API resolves the
location. Lodging / Notifications / Place Actions / Q&A / Verifications are **not** needed.

---

## 1. Compliance — read this first

- **No fabricated, rewritten, or exaggerated reviews — ever.** The importer copies
  original text, reviewer display name, rating, and dates **verbatim**.
- **Translations are additive.** Google translations are stored in a separate
  `translatedText` field shown under a "Translated from …" label; the original is never
  replaced.
- **No self-serving review structured data.** The page intentionally **omits**
  `Review` / `AggregateRating` JSON-LD (manual-action risk for self-collected reviews).
  The real rating lives on the Google listing, which the page links to. (See
  `scripts/build-site.mjs` → "SCHEMA NOTE".)
- **Empty ≠ fake, and empty ≠ indexable.** With 0 reviews the page shows a "reviews are
  being imported" state (never placeholder cards) **and** is emitted as `noindex`.
- **No scraping.** We never scrape Google Maps/GBP pages. Only the official API or an
  owner-authorized export.
- **Visible medical disclaimer** in body and footer: *"Patient experiences are individual
  and may vary. A medical consultation is required for personalized advice."*
- `validate-reviews.mjs` **fails the build** if obvious placeholder/fake text ever appears.

---

## 2. Project structure

```
vivid.clinic/
├── README-reviews.md          ← this file
├── package.json               ← npm scripts
├── .env.example               ← GBP credential template (copy to .env)
├── .gitignore                 ← ignores .env, dist/, preview-demo.html
├── src/
│   ├── data/
│   │   ├── clinic.json            ← verified NAP, hours, socials, GBP CID, brand tokens
│   │   ├── google-reviews.json    ← the normalized review dataset (source of truth)
│   │   └── reviews.schema.json    ← JSON Schema for the dataset
│   ├── styles/main.css            ← the full "Vivid" design system
│   └── js/reviews.js              ← filters, search, sort, load-more, analytics
├── scripts/
│   ├── lib.mjs                    ← shared helpers (parsing, summary, themes)
│   ├── import-google-reviews.mjs  ← GBP API → google-reviews.json
│   ├── import-export.mjs          ← AUTHORIZED CSV/JSON/XLSX export → google-reviews.json
│   ├── validate-reviews.mjs       ← field / range / dupe / fake-content checks
│   ├── build-review-summary.mjs   ← recompute & print summary stats
│   ├── build-site.mjs             ← generate dist/ (the static site)
│   └── fixtures/demo-reviews.json ← SYNTHETIC preview data (never deployed)
└── dist/                          ← build output (regenerate with `npm run build`)
```

---

## 3. Data source & extraction method

**Chosen source: Google Business Profile API** (owner-authorized, complete set), via the
legacy My Business v4 reviews endpoint. The importer authenticates with a refresh token
(`business.manage` scope), resolves the account + location, paginates **all** reviews,
records the API's official `totalReviewCount` / `averageRating`, splits Google
translations, hints language, derives theme tags, de-dupes by `reviewId`, and writes
`src/data/google-reviews.json`.

Live listing (verification / "View on Google"): `https://maps.google.com/?cid=13820382962229413624`.

### Patient photos — self-hosted, never hot-linked

`npm run import:media` pulls customer photos from the GBP `media/customers` endpoint into
`src/data/google-media.json` **and downloads the image bytes** into `src/assets/gbp/`
(a `-640.jpg` grid copy and a `1600px` full copy per photo). The site renders only those
local files, from `/assets/gbp/…`.

> **Why:** the API hands back short-lived *signed* URLs
> (`lh3.googleusercontent.com/gpms-cs-s/…`). They expire within weeks and then return
> **HTTP 403**, which silently breaks every gallery image on the deployed site — exactly
> what happened between the 9 July 2026 import and 27 August 2026. The `photoUrl` /
> `thumbnailUrl` fields are kept for provenance only and **must never be rendered**.
> (Reviewer avatar URLs, `…/a-/ALV-…`, are a different, stable form and are still
> hot-linked.)

Notes:

- Filenames are `<mediaId>-<sha256-prefix>.jpg`, so changed bytes produce a new filename
  and no stale copy can be cached.
- Re-importing prunes local files no longer on the listing, and `build-site.mjs` drops any
  item whose local file is missing (warning printed) rather than shipping a broken image.
- Downloads retry with backoff on Google's HTTP 429 — without it, throttled photos would
  quietly disappear from the gallery.
- **New photos on the listing do not appear until someone re-runs `npm run import:media`
  and redeploys.** The existing gallery keeps working regardless.

---

## ✅ When approval arrives — checklist

Run top to bottom. Each is quick; the whole thing is ~10–15 minutes.

1. **Confirm the Cloud project is approved** — you'll get an email referencing case
   **3-9557000040792**. In the Cloud Console, the GBP APIs should no longer show a
   restricted/0-quota banner.
2. **Confirm quota is no longer 0 QPM** — Console → *APIs & Services* → *Google My
   Business API* → *Quotas*. Before approval, requests-per-minute is 0; after approval it
   becomes non-zero. (If still 0, you're not approved yet — wait.)
3. **Enable the gated *Google My Business API*** — it typically only becomes
   enable-able after approval. Also ensure *My Business Account Management API* (and
   *My Business Business Information API* if present) are enabled.
4. **Confirm an OAuth client exists** — *APIs & Services* → *Credentials*. Create an OAuth
   client ID (type *Desktop* is simplest) if you don't have one. Note Client ID + secret.
5. **Generate a refresh token with `business.manage` scope** — easiest via the
   [OAuth 2.0 Playground](https://developers.google.com/oauthplayground) (gear → *Use your
   own OAuth credentials* → scope `https://www.googleapis.com/auth/business.manage` →
   authorize with the account that **manages** the Vivid Clinic listing → exchange for
   tokens → copy the **refresh token**).
6. **Add credentials to `.env` only** (never commit): `GBP_CLIENT_ID`,
   `GBP_CLIENT_SECRET`, `GBP_REFRESH_TOKEN` (see `.env.example`).
7. **Import + validate + build:** `npm run refresh`.
8. **Validate the data sanity** — confirm the printed **review count**, **rating
   distribution (5/4/3/2/1)**, **latest review date**, and **owner-reply count** look
   right (compare against what you see on the Google listing). `npm run summary` reprints
   these any time.
9. **Production rebuild** — `npm run build`. With real reviews present, the build now
   emits `index, follow` automatically and **writes `sitemap.xml`**.
10. **Re-run quality gates** on the new `dist/`:
    - Lighthouse (Performance / Accessibility / Best Practices / SEO)
    - Accessibility pass (contrast, headings, labels)
    - Structured-data check (valid JSON-LD; still **no** Review/AggregateRating)
    - Link check (internal + external resolve)
    - No-secrets scan (no `.env`/tokens committed)
    - Fake-content scan (no placeholder text in `dist/`)
11. **Confirm `noindex` is gone** — `grep robots dist/index.html` should show
    `index, follow…`. Only now is it safe for SEO + ads/campaign traffic.
12. **Deploy** the new `dist/` and (optionally) submit the sitemap in Search Console.

---

## 4. Getting Google Business Profile API credentials

(Do these once approval lands — steps 3–6 above expanded.)

1. **Google Cloud project** — <https://console.cloud.google.com>.
2. **GBP API access** — already requested (case **3-9557000040792**). Approval enables the
   *Google My Business API* (v4, reviews) for your project.
3. **OAuth client** — Credentials → *Create OAuth client ID* (Desktop). Note ID + secret.
4. **Consent + refresh token** — authorize with the **managing** account, scope
   `https://www.googleapis.com/auth/business.manage`, capture the refresh token (OAuth
   Playground is quickest).
5. **Fill `.env`** (git-ignored — never commit):
   ```bash
   cp .env.example .env
   # GBP_CLIENT_ID=... / GBP_CLIENT_SECRET=... / GBP_REFRESH_TOKEN=...
   # optional: GBP_LOCATION_ID=locations/1234567890
   ```

---

## 5. Import & refresh

```bash
npm run import     # GBP API → src/data/google-reviews.json   (needs .env)
npm run validate   # sanity-check (fails on bad/fake data)
npm run build      # regenerate dist/ (auto noindex if empty, index if reviews present)
npm run refresh    # = import + validate + build
```

Recommended cadence once live: **monthly**, or whenever new reviews arrive. Refreshing
never requires a redesign — only the data file changes. `npm run refresh` is safe to
automate via cron/CI.

---

## 🔁 Authorized export fallback

Use this to publish **real** reviews **before** the API approval lands — only with an
export the owner is authorized to use (GBP dashboard export, or a tool the owner has
already connected). **No scraping. No fabrication.**

```bash
npm run import:export -- <file.csv|file.json|file.xlsx> [--source "Google Business Profile"] [--complete]
npm run validate
npm run build:index     # publish indexable once real reviews are in (or `npm run build`)
```

- **Formats:** `.csv` and `.json` work with zero dependencies. `.xlsx` works if the
  optional `xlsx` package is installed (`npm install xlsx`); otherwise just *Save As CSV*
  and pass the `.csv`.
- **Column mapping is flexible** — headers are matched case/space-insensitively against
  common synonyms (e.g. *Author Name → reviewerName*, *Stars/Score → rating*, *Review Text
  → originalText*, *Owner Response → ownerReply*, *Date → publishedAt*, *Language →
  originalLanguage*). The script prints exactly what it mapped so you can fix the export if
  needed. Ratings accept `5`, `"5/5"`, `★★★★★`, or the `FIVE` enum. Rows with an
  unparseable rating or duplicate id are skipped with a warning.
- **`--complete`** marks the export as the full review set (so the rating summary is
  treated as authoritative). Omit it for a partial export.
- **JSON** may be an array of review objects, an object with a `reviews` array, or the raw
  GBP API shape (`starRating` enum, `comment` with translation markers).

After importing, the data lands in the same `src/data/google-reviews.json` schema as the
API path — everything downstream (validate, build, SEO) is identical.

---

## 🔎 Indexing & waiting-state deployment

The build controls indexing automatically based on whether **real reviews exist**:

| Dataset | `<meta name="robots">` | `sitemap.xml` | Use for ads/SEO? |
|---|---|---|---|
| Empty (waiting) | `noindex, follow` | not written (and removed if stale) | **No** |
| Has real reviews | `index, follow, max-image-preview:large` | written (`/` + `/reviews/`) | Yes |

`robots.txt` always allows crawling (so Google can *read* the `noindex` tag and drop the
URL — never `Disallow` a page you want de-indexed).

**Overrides** (rarely needed):
- `npm run build:index` (or `node scripts/build-site.mjs --index`, or `INDEXABLE=true`) —
  force indexable even while empty. Only do this if you deliberately want the empty page
  indexed.
- `--noindex` / `INDEXABLE=false` — force `noindex` even with reviews (e.g. staging).

**Deployment recommendation while waiting:** it's fine to deploy the `noindex` page now so
the domain resolves and the layout is live — it still links to the Google reviews and all
CTAs work — **but keep it `noindex` and do not run ads/campaigns to it.** When reviews are
imported, `npm run build` flips it to indexable and writes the sitemap; redeploy and submit
the sitemap in Search Console. **Do not present the empty page as a completed reviews page.**

> **Preview only:** `npm run build:demo` builds `dist/preview-demo.html` from synthetic
> fixture data so you can see the populated layout. It is git-ignored and must **never** be
> deployed.

---

## 6. Build & deploy

```bash
npm run build        # writes dist/index.html, dist/reviews/index.html, styles/, js/,
                     # assets/favicon.svg, robots.txt, and sitemap.xml (when indexable)
npm run serve        # preview at http://localhost:8787
```

**Deploy options:** Cloudflare Pages (recommended; `wrangler pages deploy dist`, brotli +
caching automatic), Vercel/Netlify (output dir `dist`), or upload `dist/` to the
`vivid.clinic` docroot. The canonical page is `https://vivid.clinic/`; an identical
`/reviews/` alias is generated, both canonicalised to the root.

---

## 7. SEO

`<title>`: *Vivid Clinic Reviews | Real Patient Reviews in Istanbul*; meta description;
canonical `https://vivid.clinic/`; Open Graph + Twitter card; `robots.txt`; `sitemap.xml`
(when indexable). JSON-LD: `MedicalClinic`/`Organization` (verified NAP, geo, hours,
`sameAs`) + `WebPage` + `FAQPage`. **No** `Review`/`AggregateRating`. One `<h1>`, semantic
landmarks, descriptive link text, keyboard-reachable controls.

---

## 8. Analytics

Privacy-safe events fire to `dataLayer` (GTM) and/or `gtag` if present — **no review text
or reviewer names are ever sent.** Add your GTM/GA snippet to `<head>` to enable. Events:
`review_page_view`, `whatsapp_click`, `consultation_click`, `google_profile_click`,
`review_filter_used`, `review_search_used`, `load_more_reviews`.

---

## 9. Verification status (last full run, empty waiting state)

| Gate | Result |
|---|---|
| Lighthouse — Accessibility | **100** |
| Lighthouse — Best Practices | **100** |
| Lighthouse — SEO | **100** |
| Core Web Vitals (lab) | **LCP 133 ms · CLS 0.00** |
| JSON-LD | 3 blocks valid; no self-serving review markup |
| Indexing | `noindex` while empty (correct); flips to `index` with reviews |
| Console errors | none |
| Links | all resolve (200) |
| Secrets committed | none |
| Fake/placeholder reviews in production | none |

Re-run anytime: `npm run validate && npm run build`, then audit `dist/`.

---

## 10. Brand

Implements the locked **"Vivid"** design system: teal `#0E4B4E`, cream `#FAF7F2`, gold
accent `#B8945A`, ink `#1F2937`; Cormorant Garamond headlines + Inter body; soft
warm-tinted cards; gold used only as a graphic accent (never small text). Tokens live in
`src/data/clinic.json` and `src/styles/main.css`.
