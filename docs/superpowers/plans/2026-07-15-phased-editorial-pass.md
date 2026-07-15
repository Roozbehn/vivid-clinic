# Phased Editorial Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the approved balanced Full Program — Phase 0 hygiene, Phase 1 editorial distinctiveness, Phase 2 conversion polish — on the existing static vivid.clinic pipeline without changing brand tokens or the booking API contract.

**Architecture:** Three independently deployable phases against `scripts/build-site.mjs` → `dist/`, `src/styles/main.css`, and vanilla `src/js/{reviews,booking,estimate}.js`. Keep Cloudflare `functions/api/booking.js` allow-lists unchanged. Prefer pure helper extraction + Node assert scripts for filter URL logic; CSS/markup phases verified with build + `rg` gates + EN/`/fa/` smoke.

**Tech Stack:** Node 18+ (ESM), static HTML/CSS/vanilla JS, Cloudflare Pages Functions for booking, JSON i18n catalogs (`source.en.json` + `ui.*.json`).

**Spec:** `docs/superpowers/specs/2026-07-15-phased-editorial-pass-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `src/styles/main.css` | Tokens, layout, Phase 0 CSS gates, Phase 1 hero/editorial strips, FAQ chrome |
| `scripts/build-site.mjs` | HTML generation: hero, sections, lang switcher, gallery/avatar dims, trust rail |
| `src/js/reviews.js` | Client review cards, filters, Phase 2 URL sync |
| `src/js/booking.js` | Multi-step form, Phase 2 blur/`name`/`beforeunload` |
| `src/js/estimate.js` | Estimate UI touch target (Phase 0) |
| `src/data/i18n/source.en.json` | Canonical English strings for new keys |
| `src/data/i18n/ui.*.json` | Locale packs — add new keys (EN interim OK until translated) |
| `src/data/clinic.json` | `languagesSpoken`, `specialties` (read-only for trust rail) |
| `dist/assets/hero-atmosphere.jpg` (from `src/assets/` or copy of OG) | Hero atmosphere image V1 |
| `scripts/test-review-url.mjs` | **Create** — unit tests for filter query parse/serialize |
| `scripts/test-booking.mjs` | Existing API validator tests — run after booking changes (should still pass) |

**Do not modify:** brand color/font CSS variables; `functions/api/booking.js` allow-list logic unless a bug blocks Phase 2; AggregateRating schema.

**Ship order:** complete and commit Phase 0 → Phase 1 → Phase 2. Do not mix phases in one commit.

---

## Phase 0 — Hygiene

### Task 1: Scroll-margin + heading text-wrap + explicit transitions

**Files:**
- Modify: `src/styles/main.css`

- [ ] **Step 1: Write a failing CSS gate script**

Create `scripts/check-phase0-css.mjs`:

```js
#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'src/styles/main.css'), 'utf8');
let fail = 0;
const bad = (m) => { console.error('✗', m); fail++; };
const ok = (m) => console.log('✓', m);

if (/transition:\s*all\b/.test(css)) bad('transition: all still present');
else ok('no transition: all');

if (!/#book[\s\S]{0,200}scroll-margin-top/.test(css) && !/scroll-margin-top:[^;]+;\s*(?:\/\*[^*]*\*\/\s*)?(?:#[\w-]+|,)/.test(css)) {
  // Prefer a shared rule covering anchors:
  if (!/\.section\[id\],\s*#top|#book,\s*#reviews/.test(css) && !/scroll-margin-top:\s*\d+px/.test(css)) {
    bad('scroll-margin-top missing for in-page targets');
  } else ok('scroll-margin-top present');
} else ok('scroll-margin-top present');

if (!/h1,\s*h2[^{]*\{[^}]*text-wrap:\s*balance/.test(css) && !/h1,\s*h2\s*\{[^}]*text-wrap:\s*balance/.test(css)) {
  if (!/text-wrap:\s*balance/.test(css)) bad('text-wrap: balance missing on headings');
  else ok('text-wrap: balance present');
} else ok('text-wrap: balance on headings');

if (fail) process.exit(1);
console.log('phase0 css gate ok');
```

- [ ] **Step 2: Run gate — expect fail**

Run: `node scripts/check-phase0-css.mjs`  
Expected: FAIL (`transition: all` and/or missing scroll-margin / text-wrap)

- [ ] **Step 3: Implement CSS fixes**

Near the top of `src/styles/main.css` after heading rules (~line 62–66), add:

```css
h1, h2 { text-wrap: balance; }

/* Sticky header is ~64px; pad hash targets so content is not clipped */
#top, #summary, #reviews, #photos, #estimate, #book, #how-it-works,
#why, #why-book, #themes, #international, #contact, #faq {
  scroll-margin-top: 80px;
}
```

Replace each `transition: all var(--motion-base)` with explicit properties:

```css
/* .chip (~line 210) */
transition: background var(--motion-base), border-color var(--motion-base), color var(--motion-base), box-shadow var(--motion-base);

/* .bk-chip span (~line 426) */
transition: background var(--motion-base), border-color var(--motion-base), color var(--motion-base), box-shadow var(--motion-base);

/* .est-add (~line 498) — also bump min-height here */
min-height: 44px;
transition: background var(--motion-base), border-color var(--motion-base), color var(--motion-base);
```

- [ ] **Step 4: Re-run gate — expect pass**

Run: `node scripts/check-phase0-css.mjs`  
Expected: `phase0 css gate ok`

- [ ] **Step 5: Commit**

```bash
git add src/styles/main.css scripts/check-phase0-css.mjs
git commit -m "$(cat <<'EOF'
fix: Phase 0 CSS — scroll-margin, text-wrap, explicit transitions.

EOF
)"
```

---

### Task 2: Image dimensions on avatars + gallery

**Files:**
- Modify: `scripts/build-site.mjs` (server-rendered review cards + gallery)
- Modify: `src/js/reviews.js` (`cardHtml` avatar `<img>`)

- [ ] **Step 1: Write failing dimension check**

Append to `scripts/check-phase0-css.mjs` or create `scripts/check-phase0-images.mjs` that builds then greps dist:

```js
#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' });
const html = readFileSync(join(root, 'dist/index.html'), 'utf8');
let fail = 0;
// Gallery imgs should carry width+height attributes
const galleryImgs = html.match(/class="pg-item"[\s\S]*?<img[^>]+>/g) || [];
for (const tag of galleryImgs.slice(0, 3)) {
  if (!/\swidth="\d+"/.test(tag) || !/\sheight="\d+"/.test(tag)) {
    console.error('✗ gallery img missing width/height', tag.slice(0, 120));
    fail++;
  }
}
// Avatar imgs in first reviews: width="44" height="44"
if (!/rc-avatar[\s\S]{0,200}<img[^>]*width="44"[^>]*height="44"/.test(html) &&
    !/<img[^>]*width="44"[^>]*height="44"[^>]*loading="lazy"/.test(html)) {
  console.error('✗ avatar imgs missing 44x44 dimensions in dist HTML');
  fail++;
}
if (fail) process.exit(1);
console.log('✓ image dimensions present');
```

- [ ] **Step 2: Run — expect fail**

Run: `node scripts/check-phase0-images.mjs`  
Expected: FAIL missing dimensions

- [ ] **Step 3: Implement dimensions**

In `scripts/build-site.mjs` review card builder (~line 309):

```js
${photo ? `<img src="${e(photo)}" alt="" width="44" height="44" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}
```

Gallery (~line 589) — use media `width`/`height` when present, else `400`/`500` matching `.pg-item` 4/5 aspect:

```js
<img src="${e(m.gridUrl)}" alt="..." width="${m.width || 400}" height="${m.height || 500}" loading="lazy" referrerpolicy="no-referrer">
```

In `src/js/reviews.js` `cardHtml` (~line 80–81):

```js
(photo ? '<img src="' + escapeHtml(photo) + '" alt="" width="44" height="44" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">' : '')
```

- [ ] **Step 4: Re-run check — expect pass**

Run: `node scripts/check-phase0-images.mjs`  
Expected: `✓ image dimensions present`

- [ ] **Step 5: Commit**

```bash
git add scripts/build-site.mjs src/js/reviews.js scripts/check-phase0-images.mjs
git commit -m "$(cat <<'EOF'
fix: Phase 0 — width/height on review avatars and gallery images.

EOF
)"
```

---

### Task 3: Localize lang-switch aria-label + confirm search labels

**Files:**
- Modify: `src/data/i18n/source.en.json` — add `header.language_label`
- Modify: each `src/data/i18n/ui.*.json` — same key (English interim acceptable)
- Modify: `scripts/build-site.mjs` line ~414

- [ ] **Step 1: Add English key**

In `source.en.json` under `"header"`:

```json
"language_label": "Language"
```

Add identical `"language_label": "Language"` (or translated if pack already has Language elsewhere) under `header` in every `ui.*.json`.

- [ ] **Step 2: Wire build**

Replace:

```js
const langSwitcher = (sub) => `<select class="lang-switch" aria-label="Language">
```

With:

```js
const langSwitcher = (sub) => `<select class="lang-switch" aria-label="${e(t('header.language_label'))}">
```

- [ ] **Step 3: Verify search labels already present**

Confirm `build-site.mjs` has `<label class="sr-only" for="review-search">` and `estimate.js` has `<label for="est-q" class="sr-only">`. If missing, add them using `reviews_ui.search_label` / estimate `search_label`. Optionally add `aria-label` on the input matching the same string for redundancy.

- [ ] **Step 4: Build + spot-check**

Run: `npm run build`  
Run: `rg -n 'lang-switch" aria-label' dist/index.html dist/fa/index.html`  
Expected: localized label string present (FA pack should use its translation once set; EN interim shows “Language”).

- [ ] **Step 5: Commit**

```bash
git add src/data/i18n/source.en.json src/data/i18n/ui.*.json scripts/build-site.mjs src/js/estimate.js
git commit -m "$(cat <<'EOF'
fix: Phase 0 — localize language switcher aria-label.

EOF
)"
```

---

### Task 4: Phase 0 integration verify + ship gate

**Files:** none new

- [ ] **Step 1: Run automated gates**

```bash
node scripts/check-phase0-css.mjs
node scripts/check-phase0-images.mjs
npm run test:booking
```

Expected: all pass.

- [ ] **Step 2: Manual smoke (required)**

1. Serve: `npm run serve` (or `python3 -m http.server 8787 --directory dist`)
2. EN: click “Book a Free Consultation” — `#book` clears sticky header
3. `/fa/`: layout RTL OK; keyboard Tab reaches language select with a label announced
4. Estimate “Add” button ≥ 44px visual hit area

- [ ] **Step 3: Commit gate script package if any leftovers, then note Phase 0 done**

If uncommitted check scripts remain, commit them. Tag message optional.

```bash
git status
# Phase 0 complete — ready for deploy or Phase 1
```

---

## Phase 1 — Distinctiveness

### Task 5: Hero atmosphere asset + CSS shell

**Files:**
- Create: `src/assets/hero-atmosphere.jpg` (V1: copy of `dist/assets/og-vivid-clinic-reviews.jpg` or curated photo)
- Modify: `scripts/build-site.mjs` — copy asset into `dist/assets/` during build if not already copied
- Modify: `src/styles/main.css` — `.hero` full-bleed treatment

- [ ] **Step 1: Add asset**

```bash
mkdir -p src/assets
cp dist/assets/og-vivid-clinic-reviews.jpg src/assets/hero-atmosphere.jpg
```

Ensure `build-site.mjs` copies `src/assets/*` → `dist/assets/` (if it only writes favicon/og today, add a small copy loop for `hero-atmosphere.jpg`).

- [ ] **Step 2: Restyle hero CSS**

Replace/extend `.hero` block so the section is full-bleed media plane:

```css
.hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  min-height: min(72vh, 720px);
  display: flex;
  align-items: flex-end;
  padding: var(--space-9) 0 var(--space-8);
  background-color: var(--brand-teal-deep);
  background-image:
    linear-gradient(165deg, rgba(7,53,56,.72) 0%, rgba(7,53,56,.55) 45%, rgba(7,53,56,.78) 100%),
    url("/assets/hero-atmosphere.jpg");
  background-size: cover;
  background-position: center;
  color: var(--brand-cream);
}
.hero h1, .hero .lead, .hero .eyebrow { color: var(--brand-cream); }
.hero .lead { color: rgba(250,247,242,.88); }
.hero .eyebrow { color: #E4D2AE; }
.hero .wrap {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr;
  max-width: 820px;
  margin-inline: auto;
  gap: var(--space-5);
}
/* Score lockup moves out of hero — hide if still nested until markup moves */
.hero .score-lockup { display: none; }
```

Keep grain `::before` only if contrast still works; otherwise remove noise on photo heroes.

Update `prefers-reduced-motion` block to disable any new hero enter animations.

- [ ] **Step 3: Build and visual check**

Run: `npm run build && npm run serve`  
Expected: hero shows photograph with readable cream type; no score in first viewport.

- [ ] **Step 4: Commit**

```bash
git add src/assets/hero-atmosphere.jpg src/styles/main.css scripts/build-site.mjs
git commit -m "$(cat <<'EOF'
feat: Phase 1 — full-bleed atmospheric hero shell.

EOF
)"
```

---

### Task 6: Hero markup — brand-forward composition; score as second beat

**Files:**
- Modify: `scripts/build-site.mjs` (`heroSection`, home `<main>` order)
- Modify: `src/data/i18n/source.en.json` (+ locale packs) if adding `hero.brand_kicker` or reusing `header.brand_name`

- [ ] **Step 1: Restructure `heroSection`**

Desired structure:

```js
const heroSection = `
  <section class="hero" id="top">
    <div class="wrap">
      <p class="hero-brand">${e(t('header.brand_name'))}</p>
      <p class="eyebrow">${e(t('hero.eyebrow'))}</p>
      <h1>${e(t('hero.h1'))}</h1>
      <p class="lead">${e(t('hero.lead'))}</p>
      <div class="hero-cta-row">
        <a class="btn btn--primary" href="#book" ...>...</a>
        <a class="btn btn--ghost-tint" href="${e(waUrl)}" ...>...</a>
      </div>
      <p class="trust-note">...</p>
    </div>
  </section>
  <section class="section score-beat" id="score" aria-label="...">
    <div class="wrap wrap--narrow">
      ${ratingBadge}
    </div>
  </section>`;
```

Remove `${ratingBadge}` from inside the hero grid. Use `btn--ghost-tint` or a quieter on-photo secondary style for WhatsApp (ensure contrast).

Add CSS:

```css
.hero-brand {
  font-family: var(--font-display);
  font-size: clamp(28px, 5vw, 40px);
  font-weight: 600;
  color: var(--brand-cream);
  margin: 0 0 var(--space-3);
  letter-spacing: -0.01em;
}
.score-beat { padding-top: var(--space-7); padding-bottom: var(--space-6); background: var(--brand-cream); }
.score-beat .score-lockup { display: block; /* undo hero hide */ }
```

Add `scroll-margin-top` for `#score` in the Phase 0 anchor list.

- [ ] **Step 2: Entrance motion (optional, reduced-motion safe)**

```css
.hero-brand, .hero h1, .hero-cta-row {
  animation: hero-rise 280ms cubic-bezier(.4,0,.2,1) both;
}
.hero h1 { animation-delay: 40ms; }
.hero-cta-row { animation-delay: 80ms; }
```

Ensure `prefers-reduced-motion` disables these.

- [ ] **Step 3: Build + EN/`/fa/` smoke**

- [ ] **Step 4: Commit**

```bash
git add scripts/build-site.mjs src/styles/main.css src/data/i18n/
git commit -m "$(cat <<'EOF'
feat: Phase 1 — brand-forward hero; score lockup as second beat.

EOF
)"
```

---

### Task 7: De-card features, steps, FAQ; editorial strips

**Files:**
- Modify: `src/styles/main.css` (`.feature`, `.stp`, `.faq details`)
- Modify: `scripts/build-site.mjs` only if class names need `feature--editorial` (prefer CSS-only)

- [ ] **Step 1: Soften feature / step / FAQ chrome**

```css
.feature {
  background: transparent;
  border-radius: 0;
  padding: var(--space-5) 0;
  box-shadow: none;
  border-bottom: 1px solid var(--neutral-200);
}
.feature-grid {
  gap: 0;
}
.stp {
  background: transparent;
  box-shadow: none;
  border-radius: 0;
  padding: var(--space-5) 0;
  border-bottom: 1px solid var(--neutral-200);
}
.faq details {
  background: transparent;
  box-shadow: none;
  border-radius: 0;
  border: 0;
  border-bottom: 1px solid var(--neutral-200);
  margin-bottom: 0;
}
```

Do **not** remove card styles from `.booking-card`, `.est-card`, `.est-list`.

- [ ] **Step 2: Build + visual check** Why / How / FAQ look like hairline lists; booking/estimate still carded.

- [ ] **Step 3: Commit**

```bash
git add src/styles/main.css
git commit -m "$(cat <<'EOF'
feat: Phase 1 — de-card feature, step, and FAQ chrome.

EOF
)"
```

---

### Task 8: Trust meta rail (languages + specialties)

**Files:**
- Modify: `scripts/build-site.mjs` — insert rail after score beat or into summary
- Modify: `src/styles/main.css`
- Modify: i18n — `trust_rail.languages_label`, `trust_rail.specialties_label` (EN + all ui packs)

- [ ] **Step 1: Markup helper**

```js
const trustRail = `
  <aside class="trust-rail" aria-label="${e(t('trust_rail.aria'))}">
    <div class="wrap wrap--narrow">
      <div class="trust-rail__row">
        <span class="trust-rail__label">${e(t('trust_rail.languages_label'))}</span>
        <span class="trust-rail__values">${e(c.languagesSpoken.join(' · '))}</span>
      </div>
      <div class="trust-rail__row">
        <span class="trust-rail__label">${e(t('trust_rail.specialties_label'))}</span>
        <span class="trust-rail__values">${e(c.specialties.join(' · '))}</span>
      </div>
    </div>
  </aside>`;
```

Place after score beat in home `<main>`.

- [ ] **Step 2: CSS**

```css
.trust-rail {
  padding: var(--space-5) 0;
  border-bottom: 1px solid var(--neutral-200);
  background: var(--surface-white);
}
.trust-rail__row {
  display: grid;
  grid-template-columns: 8rem 1fr;
  gap: var(--space-4);
  font-size: 14px;
  margin-bottom: var(--space-3);
}
.trust-rail__row:last-child { margin-bottom: 0; }
.trust-rail__label {
  font-weight: 600;
  color: var(--brand-teal);
  text-transform: uppercase;
  letter-spacing: .06em;
  font-size: 11px;
}
.trust-rail__values { color: var(--neutral-700); }
@media (max-width: 600px) {
  .trust-rail__row { grid-template-columns: 1fr; gap: 4px; }
}
```

- [ ] **Step 3: i18n keys** in `source.en.json`:

```json
"trust_rail": {
  "aria": "Clinic languages and specialties",
  "languages_label": "Languages",
  "specialties_label": "Specialties"
}
```

Mirror into each `ui.*.json` (EN interim OK).

- [ ] **Step 4: Build + `/fa/` RTL check** (rows should mirror)

- [ ] **Step 5: Commit**

```bash
git add scripts/build-site.mjs src/styles/main.css src/data/i18n/
git commit -m "$(cat <<'EOF'
feat: Phase 1 — languages/specialties trust meta rail.

EOF
)"
```

---

### Task 9: Phase 1 ship gate

- [ ] **Step 1: `npm run build` + `npm run test:booking`**
- [ ] **Step 2: Manual** — first viewport: brand + one H1 + lead + CTA + photo; no score; score below; mid-page not card-grid heavy; booking/estimate still cards; EN + `/fa/`
- [ ] **Step 3: Mark Phase 1 complete (deploy optional before Phase 2)

---

## Phase 2 — Conversion

### Task 10: Extract + test review filter URL helpers

**Files:**
- Create: `src/js/review-url.js` (or inline helpers at top of `reviews.js` exported via dual package — prefer **separate pure module** tested from Node)
- Create: `scripts/test-review-url.mjs`

Because browser IIFE cannot easily `import`, put pure functions in `scripts/lib-review-url.mjs` and duplicate a thin copy inside `reviews.js`, **or** build a tiny shared file imported only by the test and paste the same functions into `reviews.js` with a comment `// keep in sync with scripts/lib-review-url.mjs`.

Preferred: **`scripts/lib-review-url.mjs`** as source of truth; **Task 11** copies verified functions into `reviews.js`.

- [ ] **Step 1: Write failing tests**

`scripts/lib-review-url.mjs`:

```js
export function parseReviewParams(search) {
  const p = new URLSearchParams(typeof search === 'string' ? search.replace(/^\?/, '') : '');
  const rating = p.get('rating');
  const language = p.get('language');
  const sort = p.get('sort');
  const q = p.get('q') || '';
  const allowedRating = new Set(['all', '5', '4', '3']);
  const allowedSort = new Set(['featured', 'newest', 'detailed', 'highest']);
  return {
    rating: allowedRating.has(rating) ? rating : 'all',
    language: language && /^[a-z]{2}$/.test(language) ? language : 'all',
    sort: allowedSort.has(sort) ? sort : 'featured',
    query: q.slice(0, 120)
  };
}

export function serializeReviewParams(state, defaults = { rating: 'all', language: 'all', sort: 'featured', query: '' }) {
  const p = new URLSearchParams();
  if (state.rating && state.rating !== defaults.rating) p.set('rating', state.rating);
  if (state.language && state.language !== defaults.language) p.set('language', state.language);
  if (state.sort && state.sort !== defaults.sort) p.set('sort', state.sort);
  if (state.query) p.set('q', state.query);
  const s = p.toString();
  return s ? '?' + s : '';
}
```

`scripts/test-review-url.mjs`:

```js
import { parseReviewParams, serializeReviewParams } from './lib-review-url.mjs';
let fail = 0;
const ok = (c, m) => { if (!c) { console.error('✗', m); fail++; } else console.log('✓', m); };

ok(parseReviewParams('?rating=5&sort=newest').rating === '5', 'parses rating');
ok(parseReviewParams('?rating=nope').rating === 'all', 'rejects bad rating');
ok(parseReviewParams('?sort=detailed').sort === 'detailed', 'parses sort');
ok(parseReviewParams('?q=hair').query === 'hair', 'parses q');
ok(serializeReviewParams({ rating: 'all', language: 'all', sort: 'featured', query: '' }) === '', 'defaults omit query');
ok(serializeReviewParams({ rating: '5', language: 'all', sort: 'newest', query: 'fue' }) === '?rating=5&sort=newest&q=fue', 'serialize');
if (fail) process.exit(1);
```

- [ ] **Step 2: Run tests — expect pass** (implement lib in same step if red)

Run: `node scripts/test-review-url.mjs`  
Expected: all ✓

- [ ] **Step 3: Commit**

```bash
git add scripts/lib-review-url.mjs scripts/test-review-url.mjs
git commit -m "$(cat <<'EOF'
feat: Phase 2 — review filter URL parse/serialize helpers + tests.

EOF
)"
```

---

### Task 11: Wire URL sync into `reviews.js`

**Files:**
- Modify: `src/js/reviews.js`

- [ ] **Step 1: Port helpers** into `reviews.js` (same logic as `lib-review-url.mjs`; comment sync note).

- [ ] **Step 2: On init**, before first `render()`:

```js
var parsed = parseReviewParams(window.location.search);
state.rating = parsed.rating;
state.language = parsed.language;
state.sort = parsed.sort;
state.query = parsed.query;
if (searchInput && state.query) searchInput.value = state.query;
// Sync chip aria-pressed / is-active to match state for rating/sort/language
```

Helper to press the matching chip:

```js
function syncChips(selector, value) {
  var chips = root.querySelectorAll(selector);
  Array.prototype.forEach.call(chips, function (chip) {
    var on = chip.getAttribute('data-value') === value;
    chip.setAttribute('aria-pressed', on ? 'true' : 'false');
    chip.classList.toggle('is-active', on);
  });
}
syncChips('[data-filter="rating"]', state.rating);
syncChips('[data-filter="sort"]', state.sort);
syncChips('[data-filter="language"]', state.language);
```

- [ ] **Step 3: On every filter change**, call:

```js
function writeUrl() {
  var qs = serializeReviewParams(state);
  var path = window.location.pathname + qs + window.location.hash;
  if (window.history && window.history.replaceState) {
    window.history.replaceState(null, '', path);
  }
}
```

Call `writeUrl()` from chip handlers and search debounce after updating state.

- [ ] **Step 4: Manual verify**

1. Open `/#reviews`, set 5★ + Newest, copy URL, hard refresh — filters restored  
2. Open `/fa/?rating=5&sort=newest` — works  
3. `?rating=nope` — falls back to all

- [ ] **Step 5: Commit**

```bash
git add src/js/reviews.js
git commit -m "$(cat <<'EOF'
feat: Phase 2 — deep-link review filters via query params.

EOF
)"
```

---

### Task 12: Booking — `name` attrs, blur validation, beforeunload

**Files:**
- Modify: `src/js/booking.js`

- [ ] **Step 1: Add `name` attributes** matching autofill on key fields:

```html
name="name"     <!-- bk-name, keep data-key="fullName" -->
name="email"
name="tel" / name="phone"
name="whatsapp" <!-- or name="phone" for wa if needed; use whatsapp -->
name="country"
name="message"
```

Example:

```js
'<input id="bk-name" class="bk-input" data-key="fullName" name="name" type="text" autocomplete="name" ...'
```

- [ ] **Step 2: Blur validation** for step 2 fields — after existing input/change listeners:

```js
function validateFieldBlur(el) {
  var key = el.getAttribute('data-key');
  if (state.step !== 2) return;
  if (key === 'fullName') {
    if (!state.fullName || state.fullName.trim().length < 2) setError('err-name', T('err_name', 'Please enter your name.'));
    else setError('err-name', '');
  }
  if (key === 'email' && state.email && !EMAIL_RE.test(state.email)) {
    setError('err-email', T('err_email', 'Please enter a valid email, or leave it blank.'));
  } else if (key === 'email') setError('err-email', '');
}
form.addEventListener('blur', function (e) {
  if (e.target && e.target.getAttribute('data-key')) validateFieldBlur(e.target);
}, true);
```

Keep Continue/`validateStep` as source of truth for progression.

- [ ] **Step 3: Dirty `beforeunload`**

```js
var dirty = false;
var submittedOk = false;
form.addEventListener('input', function () { dirty = true; });
form.addEventListener('change', function () { dirty = true; });

function onBeforeUnload(e) {
  if (!dirty || submittedOk) return;
  e.preventDefault();
  e.returnValue = '';
}
window.addEventListener('beforeunload', onBeforeUnload);

// In successful showResult(true, ...) and when replacing form with result:
// submittedOk = true; dirty = false;
// On WA fallback click intentional navigation: submittedOk = true before navigate
```

Clear listeners or set `submittedOk = true` in `showResult` for both ok and err if user may retry — for err keep dirty true; for ok/`showResult(true)` set submittedOk.

- [ ] **Step 4: Run `npm run test:booking`** — still pass (API unchanged)

- [ ] **Step 5: Manual** — mid-form refresh warns; after success, refresh does not warn

- [ ] **Step 6: Commit**

```bash
git add src/js/booking.js
git commit -m "$(cat <<'EOF'
feat: Phase 2 — booking autofill names, blur hints, leave warning.

EOF
)"
```

---

### Task 13: Phase 2 + full program final gate

- [ ] **Step 1: Automated**

```bash
npm run build
npm run test:booking
node scripts/test-review-url.mjs
node scripts/check-phase0-css.mjs
node scripts/check-phase0-images.mjs
```

- [ ] **Step 2: Manual final checklist**

| Check | Pass? |
|-------|-------|
| Phase 0 scroll-margin `#book` | |
| Hero photo + brand-forward, score below | |
| Features/FAQ hairline; booking/estimate cards | |
| Trust rail languages/specialties | |
| `/fa/` RTL | |
| Filter URL round-trip | |
| Booking leave warn / success clear | |
| `wrangler pages dev dist` booking submit if credentials available | |

- [ ] **Step 3: Final commit only if stray fixes remain**

```bash
git status
```

Document ship: deploy Phase 0–2 in order if not already deployed per phase.

---

## Self-review (plan vs spec)

| Spec requirement | Task(s) |
|------------------|---------|
| scroll-margin-top anchors | Task 1 |
| Replace `transition: all` | Task 1 |
| Image width/height | Task 2 |
| Search labels | Task 3 (verify; already partly done) |
| Lang switch aria i18n | Task 3 |
| est-add ≥44px | Task 1 |
| text-wrap balance | Task 1 |
| Atmospheric hero / brand-forward / score second beat | Tasks 5–6 |
| De-card Why/FAQ/features; keep booking/estimate cards | Task 7 |
| Trust meta rail | Task 8 |
| Filter URL sync | Tasks 10–11 |
| Booking blur / name / beforeunload | Task 12 |
| No section reorder | Not tasked (correct) |
| Brand tokens / API contract unchanged | Locked in file map |
| EN + `/fa/` QA | Tasks 4, 9, 13 |

**Placeholders:** none intentionally left as TBD. Hero asset V1 is explicit OG/copy path. Locale strings may start as English interim in `ui.*.json` — called out in Tasks 3 and 8.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-15-phased-editorial-pass.md`. Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration  

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints  

Which approach?
