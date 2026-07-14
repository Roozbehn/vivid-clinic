# Schema Markup Report — vivid.clinic
**Date:** 10 July 2026 · **Format:** JSON-LD only (no Microdata/RDFa detected — correct, JSON-LD is Google's preferred format) · **Pages:** `/` and `/consultation/`

## Validation Results (live, post-deploy)

| Schema | Page(s) | Status | Notes |
|--------|---------|--------|-------|
| `MedicalClinic` + `Organization` | both | ✅ Valid | name, url, logo, telephone, email, full PostalAddress, geo, 2 openingHoursSpecification, priceRange, 7× sameAs, hasMap → GBP listing. All URLs absolute. |
| `WebSite` | `/` | ✅ Valid — **added this pass** | `@id #website`, publisher → `#clinic`; WebPages now `isPartOf → #website` (was `#clinic`, corrected) |
| `WebPage` | both | ✅ Valid | canonical URLs, inLanguage, about → `#clinic` |
| `FAQPage` | both (12 Q / 6 Q) | ⚠️ Valid, restricted | All Questions/Answers well-formed. **Rich results restricted since Aug 2023** to government/health-authority sites — a private clinic is unlikely to earn the FAQ rich result. **Kept deliberately:** markup is harmless, feeds AI/LLM extraction (the expanded 134–167w answers ship inside it), and this *is* a healthcare site. |
| `WebApplication` | both | ✅ Valid — **added this pass** | The estimate tool as a *free* HealthApplication (`isAccessibleForFree: true`), description carries the estimate-only/no-payment disclaimer. **Deliberately no `Offer`/price markup** — medical pricing is indicative only. |
| `ImageGallery` + 11 `ImageObject` | `/` | ✅ Valid — **added this pass** | Patient photos from the Google listing; `creditText` = uploader, `uploadDate` — attribution preserved, data-driven (rebuilds with `npm run import:media`). |
| `BreadcrumbList` | `/consultation/` | ✅ Valid — **added this pass** | Patient reviews → Book a consultation |

**Checks passed:** no parse errors · no missing `@context` · no relative URLs · no placeholder text · no invalid dates · **no deprecated types** (HowTo, SpecialAnnouncement, ClaimReview, etc. — none present).

## Deliberate Omissions (compliance)

| Type | Why omitted |
|------|-------------|
| `Review` / `AggregateRating` | Self-serving review markup on the clinic's own site violates Google's review-snippet guidelines → manual-action risk. The real rating lives on the Google listing (linked via `hasMap`). **Do not add.** |
| `Offer` / price schema | Medical prices here are indicative estimates confirmed after consultation — presenting them as structured Offers would misrepresent them. Prices appear in visible HTML (the price table) instead. |
| `HowTo` (consultation steps) | Deprecated Sept 2023 — never add. |

## Entity Graph
`#clinic` (MedicalClinic) ← publisher — `#website` (WebSite) ← isPartOf — `#webpage`s; `#estimator` (WebApplication) — provider → `#clinic`; `#patient-photos` (ImageGallery) — about → `#clinic`. Cross-page `@id` references keep it one coherent graph.

## Remaining Opportunities (off-site / future)
1. **Wikidata entity** for Vivid Clinic linking the sameAs graph (free; strengthens entity recognition for Gemini/ChatGPT).
2. **`Article` schema** on the future "Hair Transplant Turkey Cost 2026" post (vividclinic.net, Rank Math handles it — ensure datePublished/dateModified + author).
3. **`VideoObject`** if/when clinic videos are embedded on vivid.clinic.

Generated snippets for everything added: `generated-schema.json`. Implementation is already live via `scripts/build-site.mjs` (all schema is server-rendered in initial HTML — no JS-injected markup, per Google's Dec 2025 guidance).
