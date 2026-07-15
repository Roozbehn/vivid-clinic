# Vivid Clinic Landing — Phased Editorial Pass

**Date:** 2026-07-15  
**Status:** Approved for planning (Approach 1 — Balanced)  
**Site:** https://vivid.clinic  
**Related audits:** `docs/audits/2026-07-15-master-frontend-ux-report.md` and companion audits in the same folder

---

## 1. Purpose & success

Upgrade the reviews → estimate → booking landing so it is:

1. **Technically healthier** (Web Interface Guidelines / a11y / CLS / touch),
2. **Visually more distinctive** (editorial hero + de-carded mid-page) without changing brand tokens,
3. **More convertible / shareable** (deep-linked filters + booking completion polish).

**Success (balanced):** Phase 0 checklist cleared; Phase 1 hero/mid-page no longer read as a generic cream-clinic template; Phase 2 filter URLs restore state and booking loses fewer mid-fill exits. Qualitative gate first; existing analytics events remain the measurement hooks.

**Non-goals:** New framework; new fonts/colors; AggregateRating JSON-LD; redesign of vividclinic.net; new locales; CRM integrations.

---

## 2. Architecture & phase boundaries

Static pipeline unchanged: `src/data` + i18n → `scripts/build-site.mjs` → `dist/` → Cloudflare Pages; `src/js/booking.js` → `POST /api/booking` → email / WhatsApp fallback.

| Phase | Job | Primary files | Ship alone? |
|-------|-----|---------------|-------------|
| **0 Hygiene** | WIG / a11y / CLS / touch | `src/styles/main.css`, `scripts/build-site.mjs`, `src/js/estimate.js`, `src/js/reviews.js`, i18n strings as needed | Yes |
| **1 Distinctiveness** | Editorial hero + de-card mid-page + light trust rail | `main.css`, `build-site.mjs`, optional hero asset under `dist/assets` / source assets, i18n | Yes (after 0 preferred) |
| **2 Conversion** | Filter URL sync + booking polish | `src/js/reviews.js`, `src/js/booking.js`, light CSS | Yes |

**Out of every phase:** brand hex/font tokens locked in `clinic.json` / CSS variables; booking allow-list API contract; medical / privacy disclaimer content policy.

**Error handling:** Phase 0–1 are build-time / CSS. Phase 2: invalid query params ignored; booking keeps server validation, focus-first-error, and WhatsApp fallback.

---

## 3. Phase 0 — Hygiene

1. `scroll-margin-top` (~80px or sticky-header height + padding) on `#book`, `#reviews`, `#estimate`, `#summary`, `#photos`, `#faq`, and other in-page targets under the sticky header.
2. Replace `transition: all` on `.chip`, `.bk-chip span`, `.est-add` with explicit properties.
3. Explicit `width`/`height` (or reserved aspect) on review avatar and gallery images in build and client-rendered HTML.
4. Review and estimate search: visible label or i18n `aria-label` (not icon-only).
5. Localize `.lang-switch` `aria-label` via `t()` (remove hardcoded English `"Language"`).
6. `.est-add` min-height ≥ 44px.
7. `text-wrap: balance` on `h1` / `h2`.

**Explicitly not in Phase 0:** hero photography, de-carding, URL filters, booking blur / `beforeunload`.

**QA:** `npm run build`; EN + `/fa/`; keyboard through skip links / search / chips; hero `#book` clears sticky header.

---

## 4. Phase 1 — Distinctiveness

### Hero
- One composition: brand as hero-level signal; one headline; one short lead; primary CTA = Book; WhatsApp quieter secondary.
- Edge-to-edge atmospheric plane (owned/GBP/clinic photography preferred) with contrast-safe overlay; no floating promo badges on media.
- Score lockup moves to a second beat (immediately below hero or into summary).
- Google trust line retained, subordinate to brand + H1.

### Mid-page
- Why / How / feature sections: hairline or numbered editorial strips, not elevated white cards.
- FAQ: keep `<details>`; reduce card chrome to dividers where feasible.
- Preserve card chrome only for interactive booking and estimate surfaces.

### Trust meta rail
- Compact strip from `clinic.json`: languages spoken + specialties — meta text, not certificate badge kits.

### Motion
- One short load sequence (brand → headline → CTA); honor `prefers-reduced-motion`.

### Assets & i18n
- Prefer existing owned media; structure markup/CSS so a path can land without a redesign later.
- All new UI strings through i18n; verify RTL on `/fa/` (and ideally `/ar/` or `/he/`).

---

## 5. Phase 2 — Conversion

### Review filters ↔ URL
- Sync `rating`, `sort`, `q` to query params.
- On load apply params; unknown/invalid values → defaults.
- Prefer `history.replaceState` on updates.
- Works on localized paths (`/fa/?rating=5&sort=newest`).

### Booking
- Blur validation for name / email / contact completeness cues; keep Continue step-gates.
- Add meaningful `name` attributes alongside `data-key` for autofill where useful.
- `beforeunload` when form is dirty and not successfully submitted; clear after success or intentional WA handoff.
- Keep: focus first error, disabled submit while sending, WA fallback, server allow-lists unchanged.

### Section reorder
- Do **not** change default section order in v1 of Phase 2 unless later analytics justify it.

**QA:** deep-link hard refresh; leave-warn mid-form; no warn after success; booking `200` on Pages / `wrangler pages dev`; RTL booking smoke.

---

## 6. Rollout & rollback

1. Implement and deploy Phase 0 → verify gate.  
2. Implement and deploy Phase 1 → verify gate.  
3. Implement and deploy Phase 2 → verify gate.

Rollback = revert phase commit / Pages deployment. No migrations.

---

## 7. Testing matrix (minimum)

| Check | P0 | P1 | P2 |
|-------|----|----|-----|
| `npm run build` | ✓ | ✓ | ✓ |
| EN home visual | ✓ | ✓ | ✓ |
| `/fa/` RTL smoke | ✓ | ✓ | ✓ |
| Keyboard / focus | ✓ | ✓ | ✓ |
| Reduced motion | — | ✓ | — |
| Filter URL round-trip | — | — | ✓ |
| Booking leave warn | — | — | ✓ |
| Booking submit path | — | — | ✓ |

---

## 8. Open decisions deferred to implementation planning

- Exact hero image asset path / crop once photography is chosen.  
- Precise `scroll-margin-top` value vs measured sticky header height.  
- Whether estimate sticky summary needs any class rename when mid-page de-cards (default: leave estimate card).

These are implementation details, not unresolved product scope.

---

## 9. Handoff

Next step after user confirms this spec: invoke **writing-plans** for a phased implementation plan. No implementation work begins until that plan exists and is accepted.
