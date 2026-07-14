# Multilingual build spec — vivid.clinic (13 locales)

Goal: `scripts/build-site.mjs` additionally emits localized page sets under `dist/<code>/` for the
13 locales in `src/data/i18n/ui.*.json`, with correct hreflang everywhere. The live English output
must not change except for the additions listed in "EN diff budget".

## Locales
| code | hreflang | dir |
|---|---|---|
| ar | ar | rtl |
| bg | bg | ltr |
| de | de | ltr |
| es | es | ltr |
| fa | fa | rtl |
| fr | fr | ltr |
| he | he | rtl |
| it | it | ltr |
| nl | nl | ltr |
| ru | ru | ltr |
| tr | tr | ltr |
| uk | uk | ltr |
| zh | zh | ltr (lang="zh-CN" on html tag, hreflang "zh") |

Catalog: `src/data/i18n/source.en.json` (634 strings, 37 groups) and `ui.<code>.json` (same shape;
`_meta` holds `seo` titles/descriptions, `direction`, notes). Trust the catalogs; never invent
translations. If a rendered string is NOT in the catalog, leave it English and list it in your
final report under "gaps".

## URL / file layout
- Localized home (reviews page): `dist/<code>/index.html` → `https://vivid.clinic/<code>/`
- Localized consultation: `dist/<code>/consultation/index.html` → `https://vivid.clinic/<code>/consultation/`
- No `/<code>/reviews/` alias. English keeps its current layout untouched.

## Head requirements (every page, EN included)
- hreflang block (15 lines) on home-type pages, mapping `/` ↔ `/<code>/`; and on consultation-type
  pages mapping `/consultation/` ↔ `/<code>/consultation/`:
  `<link rel="alternate" hreflang="en" href="https://vivid.clinic/">` … one per locale …
  `<link rel="alternate" hreflang="x-default" href="https://vivid.clinic/">`
  (x-default → the English URL of that page type.)
- Localized pages: `<html lang="<lang>" dir="rtl|ltr">` (dir attr only when rtl; keep EN html tag
  exactly as-is), self-canonical, localized `<title>`/meta description from `_meta.seo`,
  og:title/og:description/twitter equivalents localized, `og:locale` set per locale (e.g. `ar_AR`
  → use correct forms: ar_AR, bg_BG, de_DE, es_ES, fa_IR, fr_FR, he_IL, it_IT, nl_NL, ru_RU,
  tr_TR, uk_UA, zh_CN), og:url localized. og:image and its width/height/type/alt stay the shared
  English asset (alt may stay English).
- robots meta: same indexability logic as the EN equivalents (home indexable iff reviews present;
  consultation always indexable).

## Body
- Replace all English UI strings with catalog lookups via a helper, e.g.
  `const t = (path) => lookup(locCatalog, path) ?? lookup(enCatalog, path)`.
  Placeholders `{x}` are substituted with the same values the EN template interpolates.
- Review cards stay VERBATIM (original review text, reviewer names, untouched). Only UI chrome
  (labels, chips, dates wording, "translated from" etc.) localizes.
- Server-rendered treatment names/descriptions and bundle names in the estimate section use the
  catalog's `treatments` / `treatment_descriptions` / `bundles` / `bundle_descriptions` (aligned
  by index/slug with the EN data — check how source.en.json ordered them and mirror that).
- FAQ (both pages) fully localized from catalog.
- Price display: keep the EN data's numeric formatting as-is inside `{price}` (do NOT re-format
  numbers in v1 — note as future work); the localized pattern strings (e.g. "ab {price} €")
  handle symbol position.
- RTL pages: wrap price/rating interpolations that mix Latin/digits into RTL text with `<bdi>`
  where the template interpolates them.

## JSON-LD on localized pages
- `inLanguage` set per locale on WebPage/WebSite/FAQPage.
- WebPage `@id`/url at the localized URL; name/description localized (seo block).
- FAQPage questions/answers localized.
- The MedicalClinic/Organization block stays the single shared entity (same `@id`s pointing at the
  canonical English URLs) — do not fork the org identity per locale.
- BreadcrumbList on consultation pages: localized names, localized URLs.

## Client JS
- On localized pages only, inject before the script tags:
  `<script>window.__I18N = {…}</script>` containing: locale code, dir, and the groups
  `js_reviews`, `js_estimate`, `js_booking`, `booking_options`, `relative_dates`,
  `language_names` from the locale catalog.
- Refactor `src/js/reviews.js`, `src/js/booking.js`, `src/js/estimate.js`: every user-facing
  literal goes through a tiny helper `const T = (k, fb) => (window.__I18N?.[group]?.[k]) ?? fb;`
  (pattern of your choice) with the current English literal as fallback — EN pages get no blob
  and behave byte-identically. Keep the files dependency-free vanilla JS.
- For fa, the `{price_examples}` list joiner should be "، " when locale is fa (catalog note).

## CSS
- Append to `src/styles/main.css`: a `[dir="rtl"]` section that mirrors the main layout
  (text-align, padding/margin sides, float/flex direction where needed) — pragmatic pass, does
  not need pixel perfection; and `bdi { unicode-bidi: isolate; }`.
- zh: add a `:lang(zh)` font-stack rule (PingFang SC, Hiragino Sans GB, Microsoft YaHei,
  Noto Sans SC, sans-serif) and line-height 1.7 for prose.

## sitemap.xml + llms.txt + robots.txt
- sitemap: add the 26 localized URLs (same lastmod logic), only when their EN equivalent is
  included today.
- llms.txt: add a short "Languages" section listing the locale URLs.
- robots.txt unchanged.

## EN diff budget (hard invariant)
After `node scripts/build-site.mjs`, `dist/index.html` and `dist/consultation/index.html` may
differ from the baselines at
/private/tmp/claude-501/-Users-roozbehnazari-Desktop-Vivid-Competitors-XML/be610502-82f0-4862-aa78-3c326b8dbd59/scratchpad/baseline/{index.html,consultation.html}
ONLY by: (a) the hreflang block, (b) nothing else. If reviews.js/booking.js/estimate.js are
refactored, EN runtime behavior must be identical (English fallbacks).
sitemap.xml may differ only by added locale entries. Verify with `diff` and inspect every hunk.

## Verification harness (write it, run it, make it pass)
Create `scripts/verify-i18n.mjs` that checks, for every locale page:
1. `<html lang=` and `dir` correct; self-canonical; exactly 15 hreflang links; og:locale correct.
2. Localized title matches the pack's `_meta.seo`.
3. No English sentinel leakage in rendered text (sentinels: "Book a Free Consultation",
   "Read the reviews", "How much do treatments cost", "Frequently Asked Questions",
   "No payment is taken online", "results vary", "Get an estimate", "Patient photos",
   "All reviews are", "Opening hours") — search only OUTSIDE <script> blocks and outside
   verbatim review-card text nodes.
4. No raw unsubstituted `{token}` in visible text outside <script>.
5. `window.__I18N` blob parses as JSON and contains the required groups.
6. JSON-LD blocks parse; FAQPage inLanguage correct.
Also: EN diff check vs the baselines (only hreflang hunk allowed) and `node scripts/build-site.mjs`
exits 0. Run the harness until fully green.

## Do NOT
- Deploy (no wrangler). Do not modify ui.*.json / source.en.json. Do not reformat unrelated code.
- Do not translate anything yourself beyond trivial glue; report gaps instead.
