# Web Interface Guidelines Audit — vivid.clinic

**Date:** 2026-07-15  
**Source:** [Vercel Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) (fetched live)  
**Scope:** `src/styles/main.css`, `src/js/{booking,reviews,estimate}.js`, `scripts/build-site.mjs`, `functions/api/booking.js`

---

## Summary

| Area | Score (approx.) | Notes |
|------|-----------------|--------|
| Accessibility | Strong | Skip links, semantic main/header/footer, aria on filters/stars, focus-first-error |
| Forms | Strong | Labels, autocomplete, inputmode, live meta, disabled submit while sending |
| Animation | Good | prefers-reduced-motion; some `transition: all` anti-patterns |
| Images / Perf | Mixed | Lazy gallery + avatars; missing width/height; reviews list not virtualized |
| Navigation / URL | Weak | Filters/search not synced to URL |
| i18n | Excellent | 14 locales, RTL, hreflang, zh stack |

---

## scripts/build-site.mjs

scripts/build-site.mjs:854 - ✓ viewport allows zoom (no user-scalable=no / maximum-scale)
scripts/build-site.mjs:879-881 - ✓ fonts preconnect + display=swap
scripts/build-site.mjs:886-887 - ✓ skip links to reviews + booking
scripts/build-site.mjs:896 - ✓ semantic `<main>`
scripts/build-site.mjs:414 - lang switcher `aria-label="Language"` hardcoded EN — localize / use `t()`
scripts/build-site.mjs:309 - avatar `<img>` missing width/height → CLS risk
scripts/build-site.mjs:589 - gallery `<img>` missing width/height (has aspect-ratio CSS only on `.pg-item`)
scripts/build-site.mjs:510 - review search input lacks visible `<label>` (icon-only affordance; needs label or aria-label)
scripts/build-site.mjs:496-505 - ✓ filter chips use `aria-pressed` + role=group
scripts/build-site.mjs:513 - ✓ `aria-live="polite"` on filter meta
scripts/build-site.mjs — review filters/sort/search not reflected in URL query params
scripts/build-site.mjs — section ids exist (`#book`, `#reviews`) but sticky header: no `scroll-margin-top` on anchors
scripts/build-site.mjs:881 - consider `<link rel="preload" as="style">` or self-host critical fonts (perf)
scripts/build-site.mjs — brand name not wrapped `translate="no"` (auto-translate risk)

## src/styles/main.css

src/styles/main.css:210 - `transition: all` on `.chip` → list properties
src/styles/main.css:426 - `transition: all` on `.bk-chip span` → list properties
src/styles/main.css:498 - `transition: all` on `.est-add` → list properties
src/styles/main.css:221,412,594 - `outline: none` OK (replaced with border + box-shadow focus) — prefer `:focus-visible` consistency on inputs
src/styles/main.css:360-365 - ✓ prefers-reduced-motion global kill-switch
src/styles/main.css:490 - ✓ `content-visibility: auto` on estimate rows
src/styles/main.css:525 - ✓ `touch-action: manipulation`
src/styles/main.css:350-356 - ✓ safe-area on mobile CTA
src/styles/main.css:202 - ✓ tabular-nums on rating distribution counts
src/styles/main.css — missing `scroll-margin-top` on `#book`, `#reviews`, `#estimate`, headings
src/styles/main.css — missing `text-wrap: balance` / `pretty` on h1/h2
src/styles/main.css — no `-webkit-tap-highlight-color` intentional token
src/styles/main.css:229-234 - review cards animate transform (OK) but long review body has no line-clamp / expand control for extreme length
src/styles/main.css — reviews grid: large lists hide via `.is-hidden` but still in DOM (no virtualization; INITIAL load-more mitigates)

## src/js/booking.js

src/js/booking.js:166-169 - ✓ labels + autocomplete + email spellcheck=false + inputmode
src/js/booking.js:166-171 - text inputs use `data-key` not `name` (except honeypot/radios) — autofill weaker on some browsers
src/js/booking.js:318-340 - validation per step; errors inline ✓
src/js/booking.js:342-356 - ✓ focus first error
src/js/booking.js:463 - ✓ submit disabled + "Sending…" during request
src/js/booking.js — no `beforeunload` / unsaved-changes warn mid-form
src/js/booking.js — validation primarily on Continue/Submit, not on blur (WIG prefers blur for most fields)
src/js/booking.js:213 - form-level error uses `role="alert"` ✓
src/js/booking.js:127 - progress `aria-hidden="true"` — sighted users see bars; SR get stepmeta only (acceptable but progress labels inaccessible)

## src/js/reviews.js

src/js/reviews.js:61 - ✓ stars `role="img"` + aria-label
src/js/reviews.js:81 - avatar img `alt=""` + lazy ✓; missing dimensions
src/js/reviews.js — filter state not deep-linked
src/js/reviews.js — hidden cards remain in DOM (perf OK for ~150; watch if dataset grows 500+)

## src/js/estimate.js

src/js/estimate.js:73,142 - ✓ aria-labels on Add/Remove
src/js/estimate.js:79-86 - ✓ group + summary aria-labels
src/js/estimate.js:82 - search placeholder ends with `…` ✓; add explicit aria-label/label
src/js/estimate.js:498 CSS - est-add min-height 40px < 44px touch target (padding helps; still short of 44)
src/js/estimate.js — selection state not in URL

## functions/api/booking.js

functions/api/booking.js — ✓ server-side allow-lists, honeypot, min fill time, sanitization
functions/api/booking.js — CORS locked to known origins ✓
(Not a UI file — passes for trust/security of form path)

---

## Priority fix queue (WIG)

1. **P0** — Add `scroll-margin-top` under sticky header for `#book`, `#reviews`, `#estimate`, `#summary`
2. **P0** — Replace `transition: all` with explicit properties
3. **P1** — `width`/`height` (or fixed aspect) on avatar + gallery images
4. **P1** — Visible/labelled search fields; localize Language aria-label
5. **P1** — Deep-link review filters (`?rating=&sort=&q=`)
6. **P2** — `name` attrs on booking fields; blur validation; `beforeunload` when dirty
7. **P2** — `text-wrap: balance` on headings; tap-highlight token; est-add ≥44px
