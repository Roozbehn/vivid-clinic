#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Static-site generator for the Vivid Clinic reviews landing page.
//   node scripts/build-site.mjs            → builds dist/ from real data
//   node scripts/build-site.mjs --demo     → builds a preview with the synthetic
//                                            fixture (for layout verification only;
//                                            never deploy a demo build)
//   --out <file>                           → write the page to dist/<file>
//
// Compliance: when the dataset has 0 reviews, the page renders a clean empty
// state — never placeholder/fake reviews. Self-serving Review/AggregateRating
// structured data is intentionally omitted (see SCHEMA note below).
//
// i18n: the canonical build additionally emits 13 localized page sets under
// dist/<code>/{index.html, consultation/index.html} from src/data/i18n/ui.<code>.json.
// English output is byte-identical to the pre-i18n build except for the hreflang
// block (verified by scripts/verify-i18n.mjs).
// ─────────────────────────────────────────────────────────────────────────────

import { writeFileSync, mkdirSync, copyFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import {
  ROOT, DATA_DIR, CLINIC_PATH, REVIEWS_PATH, readJson,
  computeSummary, computeThemes, relativeDate, escapeHtml, THEME_LABELS
} from './lib.mjs';

const args = process.argv.slice(2);
const DEMO = args.includes('--demo');
const outArg = args.includes('--out') ? args[args.indexOf('--out') + 1] : 'index.html';

const DIST = join(ROOT, 'dist');
const SITE_URL = 'https://vivid.clinic';
const INITIAL = 12, STEP = 12, FEATURED_MAX = 24;

const clinic = readJson(CLINIC_PATH);
const dataset = DEMO ? readJson(join(ROOT, 'scripts', 'fixtures', 'demo-reviews.json')) : readJson(REVIEWS_PATH);
const bookingOptions = readJson(join(DATA_DIR, 'booking-options.json'));
const estimatePricing = readJson(join(DATA_DIR, 'estimate-pricing.json'));
// Customer photos from the Google listing (optional — gallery renders only when present).
const mediaPath = join(DATA_DIR, 'google-media.json');
const googleMedia = existsSync(mediaPath) ? readJson(mediaPath) : { items: [] };

// Hydrate reviews: compute relativeDate at build time.
const now = new Date();
// Recompute relativeDate from publishedAt; if an export only carried a relative date
// (e.g. "3 months ago") and no timestamp, keep whatever it provided.
const reviews = (dataset.reviews || []).map((r) => ({
  ...r,
  relativeDate: r.publishedAt ? relativeDate(r.publishedAt, now) : (r.relativeDate || '')
}));
const hasReviews = reviews.length > 0;

// Indexing control. A waiting-state page (no real reviews yet) is emitted as `noindex`
// so it is never indexed — and never presented to ads/campaign traffic — as if it were a
// finished reviews page. When real reviews are imported, the build flips to `index`
// automatically and writes the sitemap. Override: --index / --noindex, or INDEXABLE=true|false.
const envIdx = process.env.INDEXABLE;
const indexable = (args.includes('--index') || envIdx === 'true')
  ? true
  : (args.includes('--noindex') || envIdx === 'false') ? false : hasReviews;
const robotsMeta = indexable ? 'index, follow, max-image-preview:large' : 'noindex, follow';

// Trust the file summary, but recompute distribution/etc. for safety.
const computed = computeSummary(reviews);
const summary = {
  ...computed,
  totalReviewCount: Math.max(dataset.summary?.totalReviewCount || 0, computed.totalReviewCount),
  averageRating: dataset.summary?.averageRating && !hasReviews ? dataset.summary.averageRating : computed.averageRating
};
const themes = computeThemes(reviews);
const lastUpdated = dataset.meta?.lastImportedAt ? new Date(dataset.meta.lastImportedAt) : null;

const c = clinic;
const gmaps = c.googleBusinessProfile.mapsUrl;
const waUrl = c.contact.whatsappUrl;
const consultUrl = c.contact.consultationUrl;

/* ---------------- i18n ----------------
   Catalogs: src/data/i18n/source.en.json is the extracted English catalog; the
   templates below render THROUGH it (so the EN build is the catalog, verified
   byte-for-byte against the pre-i18n baseline). ui.<code>.json are the 13
   translation packs (same key shape; `_meta.seo` carries titles/descriptions). */
const I18N_DIR = join(DATA_DIR, 'i18n');
const EN_CATALOG = readJson(join(I18N_DIR, 'source.en.json'));
const LOCALES = [
  { code: 'ar', hreflang: 'ar', htmlLang: 'ar', dir: 'rtl', og: 'ar_AR' },
  { code: 'bg', hreflang: 'bg', htmlLang: 'bg', dir: 'ltr', og: 'bg_BG' },
  { code: 'de', hreflang: 'de', htmlLang: 'de', dir: 'ltr', og: 'de_DE' },
  { code: 'es', hreflang: 'es', htmlLang: 'es', dir: 'ltr', og: 'es_ES' },
  { code: 'fa', hreflang: 'fa', htmlLang: 'fa', dir: 'rtl', og: 'fa_IR' },
  { code: 'fr', hreflang: 'fr', htmlLang: 'fr', dir: 'ltr', og: 'fr_FR' },
  { code: 'he', hreflang: 'he', htmlLang: 'he', dir: 'rtl', og: 'he_IL' },
  { code: 'it', hreflang: 'it', htmlLang: 'it', dir: 'ltr', og: 'it_IT' },
  { code: 'nl', hreflang: 'nl', htmlLang: 'nl', dir: 'ltr', og: 'nl_NL' },
  { code: 'ru', hreflang: 'ru', htmlLang: 'ru', dir: 'ltr', og: 'ru_RU' },
  { code: 'tr', hreflang: 'tr', htmlLang: 'tr', dir: 'ltr', og: 'tr_TR' },
  { code: 'uk', hreflang: 'uk', htmlLang: 'uk', dir: 'ltr', og: 'uk_UA' },
  { code: 'zh', hreflang: 'zh', htmlLang: 'zh-CN', dir: 'ltr', og: 'zh_CN' }
];
// Language autonyms (each language named in its own script) — the standard for switchers,
// so visitors can find their language regardless of the page's current language.
const AUTONYMS = {
  en: 'English', ar: 'العربية', bg: 'Български', de: 'Deutsch', es: 'Español', fa: 'فارسی',
  fr: 'Français', he: 'עברית', it: 'Italiano', nl: 'Nederlands', ru: 'Русский', tr: 'Türkçe',
  uk: 'Українська', zh: '中文'
};
const LOCALE_PACKS = new Map(LOCALES.map((l) => [l.code, readJson(join(I18N_DIR, `ui.${l.code}.json`))]));
// Review-text translations (src/data/i18n/reviews.<code>.json) — display-layer overlay only:
// the verbatim original stays server-rendered behind a "Show original" toggle, and entries
// are keyed by review id + a hash of the source text so re-imports invalidate stale ones.
const REVIEW_I18N = new Map(LOCALES.map((l) => {
  const p = join(I18N_DIR, `reviews.${l.code}.json`);
  return [l.code, existsSync(p) ? (readJson(p).items || null) : null];
}));
const shortHash = (...parts) => createHash('sha1').update(parts.join(' ')).digest('hex').slice(0, 12);

/* Review text and owner reply are keyed SEPARATELY. They change independently:
   the clinic answering a two-year-old review does not change a word of that
   review, so it must not throw away a good translation of it. (The original
   single `src` hash covered both, which meant one round of replies would have
   silently un-translated every localized page.)

   Catalogs generated before the split carry only `src` = hash(text + ' ' + reply)
   and are still honoured — see the legacy branch. New catalogs should emit
   `srcText` and `srcReply`. */
const reviewTextHash = (r) => shortHash(r.originalText || '');
const reviewReplyHash = (r) => shortHash(r.ownerReply || '');
const legacyHash = (r) => shortHash(r.originalText || '', r.ownerReply || '');
const legacyHashNoReply = (r) => shortHash(r.originalText || '', '');

const reviewLoc = (items, r) => {
  const rt = items ? items[r.id] : null;
  if (!rt) return null;

  const textOk = rt.srcText
    ? rt.srcText === reviewTextHash(r)
    // Legacy: the entry is valid if the review TEXT is unchanged, whether or not
    // a reply has been added since the catalog was generated.
    : (rt.src === legacyHash(r) || rt.src === legacyHashNoReply(r));
  if (!textOk) return null;

  const replyOk = rt.srcReply ? rt.srcReply === reviewReplyHash(r) : rt.src === legacyHash(r);
  // A stale reply translation must never be shown next to a different reply —
  // drop it and the card falls back to the reply exactly as written on Google.
  return replyOk ? rt : { ...rt, reply: '' };
};
const lookup = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
// {token} interpolation — tokens with no provided value are left intact (harness catches leaks).
const fmt = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? vars[k] : m));
const us = (v) => String(v).replace(/-/g, '_'); // slug → catalog key (hyphens → underscores)
// hreflang block: 15 links (en + 13 locales + x-default), identical on every page of a type.
// `sub` is '' for home-type pages, 'consultation/' for consultation-type pages.
const hreflangBlock = (sub) => [
  `<link rel="alternate" hreflang="en" href="${SITE_URL}/${sub}">`,
  ...LOCALES.map((l) => `<link rel="alternate" hreflang="${l.hreflang}" href="${SITE_URL}/${l.code}/${sub}">`),
  `<link rel="alternate" hreflang="x-default" href="${SITE_URL}/${sub}">`
].join('\n  ');

/* ---------------- helpers ---------------- */
const e = escapeHtml;
const longDate = (d) =>
  d ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

function initials(name) {
  const p = String(name || '?').trim().split(/\s+/);
  return ((p[0] || '')[0] || '?').toUpperCase() + (p[1] ? p[1][0].toUpperCase() : '');
}
// Only Google's CDN may appear in an avatar <img> — anything else renders as initials.
const safePhoto = (u) => (typeof u === 'string' && /^https:\/\/[a-z0-9.-]*googleusercontent\.com\//i.test(u)) ? u : '';

/* Self-hosted Google Business Profile photo → absolute site path.
   Only files the media importer wrote under src/assets/gbp/ are accepted, and
   only if they actually exist on disk — a path in the JSON that no longer has
   a file behind it must drop out of the gallery, not ship as a broken image. */
const safeLocalPhoto = (p) => {
  if (typeof p !== 'string' || !/^assets\/gbp\/[A-Za-z0-9._-]+\.(jpe?g|png|webp)$/i.test(p)) return '';
  return existsSync(join(ROOT, 'src', p)) ? `/${p}` : '';
};

/* ---------------- icons (inline, lucide-style) ---------------- */
const ico = {
  whatsapp: '<svg class="ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M.06 24l1.7-6.2A11.9 11.9 0 1112 24a11.9 11.9 0 01-5.9-1.6L.06 24zM6.6 20.1l.4.2a9.9 9.9 0 005 1.4A9.9 9.9 0 102.1 11.6a9.9 9.9 0 001.5 5.3l.3.4-1 3.7 3.7-.9zM18 14.4c-.3-.1-1.6-.8-1.8-.9-.3-.1-.4-.1-.6.1l-.8 1c-.2.2-.3.2-.6.1a8 8 0 01-2.4-1.5 9 9 0 01-1.6-2c-.2-.3 0-.4.1-.6l.5-.5.3-.5v-.5l-.9-2c-.2-.5-.4-.5-.6-.5h-.5a1 1 0 00-.7.3 3 3 0 00-1 2.2 5.2 5.2 0 001.1 2.8 12 12 0 004.6 4 5.3 5.3 0 003.2.7c.6-.1 1.6-.7 1.9-1.3.2-.7.2-1.2.1-1.3z"/></svg>',
  calendar: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="17" rx="2"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/></svg>',
  pin: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 22s7-6.1 7-12a7 7 0 10-14 0c0 5.9 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  external: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1h5"/></svg>',
  search: '<svg class="si" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>',
  shield: '<svg class="es-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  info: '<svg class="di" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/></svg>'
};
const featureIcons = {
  pin: '<svg class="fi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 22s7-6.1 7-12a7 7 0 10-14 0c0 5.9 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  globe: '<svg class="fi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18"/></svg>',
  concierge: '<svg class="fi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 20h16M6 20v-5a6 6 0 1112 0v5M12 7V4M9 4h6"/></svg>',
  plan: '<svg class="fi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 5h10M9 12h10M9 19h10"/><path d="M4.5 5h.01M4.5 12h.01M4.5 19h.01"/></svg>',
  sparkle: '<svg class="fi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 3l1.8 4.9L18.7 9.7 13.8 11.5 12 16.4 10.2 11.5 5.3 9.7 10.2 7.9z"/></svg>',
  layers: '<svg class="fi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></svg>'
};
const themeIcon = '<svg class="ti" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';

/* ---------------- JSON-LD (shared entities) ----------------
   SCHEMA NOTE (compliance): We include Organization/MedicalClinic identity data
   (verified NAP, geo, hours, sameAs) and a FAQPage. We DELIBERATELY DO NOT emit
   self-serving Review or AggregateRating structured data. Google's review-snippet
   guidelines disallow rich-result markup for reviews a business collects about
   itself on its own site; adding it risks a manual action. The real Google rating
   already shows on the Google listing, which we link to prominently.
   i18n: the MedicalClinic/Organization identity is ONE shared entity — its @id
   and URLs stay canonical (English) on every localized page. */
const organizationLd = {
  '@context': 'https://schema.org',
  '@type': ['MedicalClinic', 'Organization'],
  '@id': `${SITE_URL}/#clinic`,
  name: c.name,
  url: SITE_URL,
  logo: c.logo,
  image: c.logo,
  telephone: c.contact.phonePrimary,
  email: c.contact.emailGeneral,
  priceRange: c.priceRange,
  address: {
    '@type': 'PostalAddress',
    streetAddress: c.address.streetAddress,
    addressLocality: c.address.addressLocality,
    addressRegion: c.address.addressRegion,
    postalCode: c.address.postalCode,
    addressCountry: c.address.addressCountry
  },
  geo: { '@type': 'GeoCoordinates', latitude: c.geo.latitude, longitude: c.geo.longitude },
  hasMap: gmaps,
  openingHoursSpecification: c.openingHours.map((o) => ({
    '@type': 'OpeningHoursSpecification', dayOfWeek: o.days, opens: o.opens, closes: o.closes
  })),
  areaServed: 'Worldwide',
  availableLanguage: c.languagesSpoken,
  // Wikidata entity in sameAs only (schema graph) — not in the visible footer links.
  sameAs: [c.businessSite, ...c.sameAs, ...(c.wikidata ? [c.wikidata] : [])]
};

/* Patient photos (customer uploads from the Google listing) — used by both the
   gallery section and the ImageGallery JSON-LD, so computed once up here. */
/* Google's media/customers URLs are short-lived signed URLs that start
   returning 403 within weeks, so the gallery renders ONLY the self-hosted
   copies the importer downloaded into src/assets/gbp/. An item without a
   local file on disk is dropped rather than hot-linked. */
const galleryItems = (googleMedia.items || [])
  .map((m) => {
    const fullUrl = safeLocalPhoto(m.file);
    if (!fullUrl) return null;
    return { ...m, fullUrl, gridUrl: safeLocalPhoto(m.grid) || fullUrl };
  })
  .filter(Boolean);

const galleryMissing = (googleMedia.items || []).length - galleryItems.length;
if (galleryMissing > 0) {
  console.warn(`  ! ${galleryMissing} listing photo(s) have no local file in src/assets/gbp/ — run \`npm run import:media\` to re-download them.`);
}

// WebApplication — the estimate tool, described strictly as a FREE planning aid
// (no Offer/price markup: medical pricing is estimate-only, confirmed after consultation).
// Shared entity — stays English on localized pages (crawler-facing, single @id).
const webAppLd = {
  '@context': 'https://schema.org', '@type': 'WebApplication',
  '@id': `${SITE_URL}/consultation/#estimator`,
  name: 'Vivid Clinic Treatment Cost Estimator',
  url: `${SITE_URL}/consultation/#estimate`,
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Any (web browser)',
  isAccessibleForFree: true,
  provider: { '@id': `${SITE_URL}/#clinic` },
  description: 'Free planning tool showing indicative starting prices for treatments at Vivid Clinic, Istanbul. Estimates only — no online payment; final pricing is confirmed after a medical consultation.'
};

// ImageGallery — customer photos from the public Google listing, uploader credited.
// Shared entity (single @id, canonical URLs).
const galleryLd = galleryItems.length ? {
  '@context': 'https://schema.org', '@type': 'ImageGallery',
  '@id': `${SITE_URL}/#patient-photos`, url: `${SITE_URL}/#photos`,
  name: 'Photos from patients on Google',
  about: { '@id': `${SITE_URL}/#clinic` },
  image: galleryItems.map((m) => ({
    '@type': 'ImageObject',
    // Canonical, permanent URLs on our own origin (Google's expire).
    contentUrl: `${SITE_URL}${m.fullUrl}`,
    thumbnailUrl: `${SITE_URL}${m.gridUrl}`,
    creditText: m.uploader || 'Google user',
    ...(m.createdAt ? { uploadDate: m.createdAt.slice(0, 10) } : {})
  }))
} : null;

const photoDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '';

/* ============================================================================
   Page renderer — parameterized by locale.
   `locale` is null for English (current live behavior, byte-identical to the
   pre-i18n build except the hreflang block) or an entry of LOCALES.
   ========================================================================== */
function renderPages(locale) {
  const pack = locale ? LOCALE_PACKS.get(locale.code) : null;
  // Catalog lookup with EN fallback: strings missing from a pack fall back to English.
  const t = (path) => {
    if (pack) {
      const v = lookup(pack, path);
      if (v !== undefined && v !== null) return v;
    }
    return lookup(EN_CATALOG, path);
  };
  const tf = (path, vars) => fmt(t(path), vars);
  const isRtl = !!locale && locale.dir === 'rtl';
  // RTL pages: isolate Latin/digit runs (prices, ratings) interpolated into RTL text.
  const bdi = (s) => (isRtl ? `<bdi>${s}</bdi>` : s);
  const base = locale ? `/${locale.code}/` : '/';
  const homeUrl = `${SITE_URL}${base}`;
  const consultPageUrl = `${homeUrl}consultation/`;
  const inLang = locale ? locale.htmlLang : 'en';
  const htmlTag = `<html lang="${locale ? locale.htmlLang : 'en'}"${isRtl ? ' dir="rtl"' : ''}>`;
  const seo = {
    homeTitle: locale ? pack._meta.seo.home_title : t('meta.home_title'),
    homeDesc: locale ? pack._meta.seo.home_description : t('meta.home_description'),
    consultTitle: locale ? pack._meta.seo.consult_title : t('meta.consult_title'),
    consultDesc: locale ? pack._meta.seo.consult_description : t('meta.consult_description')
  };

  /* localized relative dates — mirrors lib.mjs relativeDate() via the catalog
     (the EN catalog values reproduce lib.mjs output exactly). */
  const relDate = (iso) => {
    if (!iso) return '';
    const then = new Date(iso);
    if (isNaN(then)) return '';
    const days = Math.floor((now - then) / 86400000);
    if (days < 1) return t('relative_dates.today');
    if (days < 2) return t('relative_dates.yesterday');
    if (days < 30) return tf('relative_dates.days_ago', { n: days });
    const months = Math.floor(days / 30);
    if (months < 12) return months === 1 ? t('relative_dates.a_month_ago') : tf('relative_dates.months_ago', { n: months });
    const years = Math.floor(days / 365);
    return years === 1 ? t('relative_dates.a_year_ago') : tf('relative_dates.years_ago', { n: years });
  };
  const locReviews = reviews.map((r) => ({
    ...r,
    relativeDate: r.publishedAt ? relDate(r.publishedAt) : (r.relativeDate || '')
  }));

  function stars(n, cls) {
    n = Math.max(0, Math.min(5, parseInt(n, 10) || 0));
    let s = `<span class="stars ${cls || ''}" role="img" aria-label="${e(tf('common.stars_aria', { n }))}">`;
    for (let i = 1; i <= 5; i++) {
      s += `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="${i <= n ? 'full' : 'empty'}" d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z"/></svg>`;
    }
    return s + '</span>';
  }
  const langName = (code2) => (t('language_names') || {})[code2] || '';
  const reviewI18n = locale ? REVIEW_I18N.get(locale.code) : null;
  function reviewCard(r) {
    const loc = reviewI18n ? reviewLoc(reviewI18n, r) : null;
    const photo = safePhoto(r.reviewerPhotoUrl);
    let h = `<article class="review-card" tabindex="0">`;
    h += `<div class="rc-head"><div class="rc-avatar" aria-hidden="true">${e(initials(r.reviewerName))}${photo ? `<img src="${e(photo)}" alt="" width="44" height="44" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}</div>`;
    h += `<div><div class="rc-name">${e(r.reviewerName)}</div><div class="rc-date">${e(r.relativeDate || '')}</div></div>`;
    if (r.isFeatured) h += `<span class="featured-flag" style="margin-left:auto">${e(t('reviews_ui.card_featured_flag'))}</span>`;
    h += `</div><div>${stars(r.rating, 'stars--sm')}</div>`;
    if (loc && loc.translated && r.originalText) {
      // Localized display text; the verbatim original stays one tap away.
      const from = langName(r.originalLanguage);
      const show = t('reviews_ui.card_show_original'), hide = t('reviews_ui.card_hide_original');
      h += `<p class="rc-body">${e(loc.text)}</p>`;
      h += `<div class="rc-orig-wrap"><span class="tlabel">${from ? e(tf('reviews_ui.card_auto_translated', { language: from })) : e(t('reviews_ui.card_auto_translated_generic'))}</span> <button type="button" class="rc-orig-toggle" aria-expanded="false" data-show="${e(show)}" data-hide="${e(hide)}">${e(show)}</button>`;
      h += `<div class="rc-orig" hidden dir="auto"><p class="rc-body">${e(r.originalText)}</p>${r.ownerReply ? `<div class="rc-reply"><span class="rlabel">${e(t('reviews_ui.card_owner_reply_label'))}</span>${e(r.ownerReply)}</div>` : ''}</div></div>`;
    } else if (loc && r.originalText) {
      // Source review is already in this page's language — shown as-is, no chip.
      h += `<p class="rc-body">${e(loc.text)}</p>`;
    } else {
      if (r.originalText) h += `<p class="rc-body">${e(r.originalText)}</p>`;
      if (r.translatedText) {
        const from = langName(r.originalLanguage);
        h += `<div class="rc-translation"><span class="tlabel">${from ? e(tf('reviews_ui.card_translated_from', { language: from })) : e(t('reviews_ui.card_translated_by_google'))}</span>${e(r.translatedText)}</div>`;
      }
    }
    if (r.ownerReply) h += `<div class="rc-reply"><span class="rlabel">${e(t('reviews_ui.card_owner_reply_label'))}</span>${e(loc && loc.translated && loc.reply ? loc.reply : r.ownerReply)}</div>`;
    h += `<a class="rc-foot" href="${e(gmaps)}" target="_blank" rel="noopener nofollow" data-track="google_profile_click"><span class="gmark">G</span><span>${e(t('reviews_ui.card_review_on_google'))}</span></a>`;
    return h + `</article>`;
  }

  /* featured-first ordering for the server-rendered batch */
  const ordered = [...locReviews].sort((a, b) => {
    if (!!b.isFeatured !== !!a.isFeatured) return b.isFeatured ? 1 : -1;
    return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
  });
  const serverCards = ordered.slice(0, Math.min(FEATURED_MAX, ordered.length));

  /* ---------------- FAQ (also drives FAQPage schema) ---------------- */
  const statsSentence = hasReviews ? ` ${tf('faq.a1_stats', {
    total: summary.totalReviewCount, avg: summary.averageRating,
    five_star_count: summary.ratingDistribution[5], four_star_count: summary.ratingDistribution[4]
  })}` : '';
  const faqs = [
    [t('faq.q1'), tf('faq.a1', { stats_sentence: statsSentence })],
    [t('faq.q2'), t('faq.a2')],
    [t('faq.q3'), t('faq.a3')],
    [t('faq.q4'), t('faq.a4')],
    [t('faq.q5'), t('faq.a5')],
    [t('faq.q6'), t('faq.a6')]
  ];

  /* Booking-specific FAQ — shown in the booking flow and on /consultation/. */
  // Pull "from" prices out of the live price list so FAQ examples never drift from the data.
  const fromPrice = (slug) => {
    const s = estimatePricing.services.find((x) => x.value === slug);
    return s ? `€${s.fromPrice.toLocaleString('en-GB')}` : null;
  };
  const exampleNames = t('booking_faq.price_example_treatments');
  const exampleJoiner = locale && locale.code === 'fa' ? '، ' : ', ';
  const priceExamples = [
    [exampleNames[0], fromPrice('hair-transplant-treatment')],
    [exampleNames[1], fromPrice('rhinoplasty')],
    [exampleNames[2], fromPrice('breast-implant')],
    [exampleNames[3], fromPrice('gastric-sleeve')]
  ].filter(([, p]) => p).map(([n, p]) => tf('booking_faq.price_example_item', { name: n, price: bdi(p) })).join(exampleJoiner);
  const bookingFaqs = [
    [t('booking_faq.q1'), t('booking_faq.a1')],
    [t('booking_faq.q2'), t('booking_faq.a2')],
    [t('booking_faq.q3'), t('booking_faq.a3')],
    [t('booking_faq.q4'), tf('booking_faq.a4', { price_examples: priceExamples })],
    [t('booking_faq.q5'), t('booking_faq.a5')],
    [t('booking_faq.q6'), t('booking_faq.a6')]
  ];
  const allFaqs = faqs.concat(bookingFaqs);

  /* ---------------- JSON-LD (per-page graph) ---------------- */
  const webpageLd = {
    '@context': 'https://schema.org', '@type': 'WebPage',
    '@id': `${homeUrl}#webpage`, url: homeUrl,
    name: seo.homeTitle,
    ...(locale ? { description: seo.homeDesc } : {}),
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: { '@id': `${SITE_URL}/#clinic` },
    inLanguage: inLang
  };
  const faqGraph = (items) => ({
    '@context': 'https://schema.org', '@type': 'FAQPage',
    ...(locale ? { inLanguage: inLang } : {}),
    mainEntity: items.map(([q, a]) => ({
      '@type': 'Question', name: q,
      acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') }
    }))
  });

  // WebSite entity — site-name recognition in search.
  const websiteLd = {
    '@context': 'https://schema.org', '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`, url: `${SITE_URL}/`,
    name: t('schema_extras.website_name'), publisher: { '@id': `${SITE_URL}/#clinic` }, inLanguage: inLang
  };

  const ldBlocks = [organizationLd, websiteLd, webpageLd, faqGraph(allFaqs), webAppLd, galleryLd]
    .filter(Boolean)
    .map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`).join('\n  ');

  /* ---------------- sections ---------------- */
  const bookingHref = '#book'; // both pages embed the booking flow under #book
  // `sub` is '' on home-type pages, 'consultation/' on consultation pages, so the
  // switcher jumps to the equivalent page in the chosen language.
  const langSwitcher = (sub) => `<select class="lang-switch" aria-label="${e(t('header.language_label'))}">
          <option value="/${sub}"${locale ? '' : ' selected'}>${AUTONYMS.en}</option>
          ${LOCALES.map((l) => `<option value="/${l.code}/${sub}"${locale && locale.code === l.code ? ' selected' : ''}>${AUTONYMS[l.code]}</option>`).join('\n          ')}
        </select>`;
  const headerCtas = (sub) => `
      <div class="header-cta">
        ${langSwitcher(sub)}
        <a class="btn btn--secondary" href="${e(gmaps)}" target="_blank" rel="noopener nofollow" data-track="google_profile_click">${e(t('common.view_on_google'))}</a>
        <a class="btn btn--primary" href="${e(waUrl)}" target="_blank" rel="noopener" data-track="whatsapp_click">${ico.whatsapp}${e(t('common.whatsapp'))}</a>
      </div>`;

  // "{score} / 5" pattern split around the interpolated score (locales may reorder).
  const scoreParts = String(t('hero.rating_score_out_of')).split('{score}');
  const ratingBadge = hasReviews ? `
        <div class="rating-badge">
          <div>${scoreParts[0] ? `<span class="out">${e(scoreParts[0])}</span>` : ''}<span class="score">${bdi(summary.averageRating.toFixed(1))}</span><span class="out">${e(scoreParts[1] ?? '')}</span></div>
          ${stars(Math.round(summary.averageRating), 'stars--lg')}
          <div class="count">${e(tf('hero.rating_based_on', { count: summary.totalReviewCount.toLocaleString('en-GB') }))}</div>
          <div class="src"><span class="gmark" aria-hidden="true" style="font-weight:700">G</span> ${e(t('hero.rating_source'))}</div>
        </div>` : '';

  const heroSection = `
  <section class="hero" id="top">
    <div class="wrap">
      <p class="hero-brand">${e(t('header.brand_name'))}</p>
      <p class="eyebrow">${e(t('hero.eyebrow'))}</p>
      <h1>${e(t('hero.h1'))}</h1>
      <p class="lead">${e(t('hero.lead'))}</p>
      <p class="hero-definition">${e(t('hero.definition'))}</p>
      <div class="hero-cta-row">
        <a class="btn btn--primary" href="#book" data-track="consultation_click">${ico.calendar}${e(t('common.book_free_consultation'))}</a>
        <a class="btn btn--ghost-tint" href="${e(waUrl)}" target="_blank" rel="noopener" data-track="whatsapp_click">${ico.whatsapp}${e(t('common.contact_on_whatsapp'))}</a>
      </div>
      <p class="trust-note"><span class="g">G</span> ${e(t('hero.trust_note'))}</p>
    </div>
  </section>
  ${hasReviews ? `
  <section class="section score-beat" id="score" aria-label="${e(t('summary.eyebrow'))}">
    <div class="wrap wrap--narrow">
      ${ratingBadge}
    </div>
  </section>` : ''}`;

  const langs = Array.isArray(c.languagesSpoken) ? c.languagesSpoken : [];
  const specs = Array.isArray(c.specialties) ? c.specialties : [];
  const trustRail = `
  <aside class="trust-rail" aria-label="${e(t('trust_rail.aria'))}">
    <div class="wrap wrap--narrow">
      <div class="trust-rail__row">
        <span class="trust-rail__label">${e(t('trust_rail.languages_label'))}</span>
        <span class="trust-rail__values">${e(langs.join(' · '))}</span>
      </div>
      <div class="trust-rail__row">
        <span class="trust-rail__label">${e(t('trust_rail.specialties_label'))}</span>
        <span class="trust-rail__values">${e(specs.join(' · '))}</span>
      </div>
    </div>
  </aside>`;

  const distLabel = (star) => tf(star === 1 ? 'summary.dist_label_singular' : 'summary.dist_label_plural', { n: star });
  const distRows = [5, 4, 3, 2, 1].map((star) => {
    const n = summary.ratingDistribution[star] || 0;
    const pct = summary.totalReviewCount ? Math.round((n / Math.max(locReviews.length, 1)) * 100) : 0;
    return `<div class="dist-row"><span class="lbl">${e(distLabel(star))}</span><div class="dist-bar"><span style="width:${pct}%"></span></div><span class="num">${n}</span></div>`;
  }).join('\n            ');

  const summarySection = hasReviews ? `
  <section class="section section--white" id="summary" aria-labelledby="summary-h">
    <div class="wrap">
      <p class="eyebrow">${e(t('summary.eyebrow'))}</p>
      <h2 id="summary-h">${e(t('summary.heading'))}</h2>
      <div class="summary-grid">
        <div class="summary-figure">
          <div class="big">${bdi(summary.averageRating.toFixed(1))}</div>
          ${stars(Math.round(summary.averageRating), 'stars--lg')}
          <div class="meta">${e(tf('summary.meta_review_count', { count: summary.totalReviewCount.toLocaleString('en-GB') }))}${summary.fiveStarPercentage ? ` · ${e(tf('summary.meta_five_star_pct', { pct: summary.fiveStarPercentage }))}` : ''}</div>
          ${summary.latestReviewDate ? `<div class="meta">${e(tf('summary.meta_latest_review', { date: longDate(new Date(summary.latestReviewDate)) }))}</div>` : ''}
          <div class="meta" style="margin-top:8px"><span style="font-weight:700">G</span> ${e(t('summary.meta_source'))}</div>
          <div style="margin-top:20px"><a class="btn btn--primary" href="#book" data-track="consultation_click">${ico.calendar}${e(t('common.book_free_consultation'))}</a></div>
        </div>
        <div>
          ${distRows}
          <!-- Text alternative to the distribution bars, for screen readers.
               The .sr-only class MUST sit on this wrapper div, never on the
               <table>: CSS table sizing ignores width:1px (min-content wins), so
               an .sr-only table computes ~538px wide and, being absolutely
               positioned, drags the document's scroll width with it — 186px of
               horizontal scroll on a 375px viewport, on every locale. A block
               wrapper honours the 1px box and clips the table inside it, while
               the table keeps display:table and its full semantics. -->
          <div class="sr-only">
            <table>
              <caption>${e(tf('summary.sr_table_caption', { count: summary.totalReviewCount, avg: summary.averageRating }))}</caption>
              <thead><tr><th scope="col">${e(t('summary.sr_th_rating'))}</th><th scope="col">${e(t('summary.sr_th_count'))}</th></tr></thead>
              <tbody>
                ${[5, 4, 3, 2, 1].map((star) => `<tr><th scope="row">${e(distLabel(star))}</th><td>${summary.ratingDistribution[star] || 0}</td></tr>`).join('\n                ')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </section>` : '';

  const reviewsBody = hasReviews ? `
      <div class="filters" id="filters">
        <div class="group" role="group" aria-label="${e(t('reviews_ui.filter_rating_aria'))}">
          <button class="chip is-active" data-filter="rating" data-value="all" aria-pressed="true">${e(t('reviews_ui.chip_all_ratings'))}</button>
          <button class="chip" data-filter="rating" data-value="5" aria-pressed="false">${e(t('reviews_ui.chip_5_star'))}</button>
          <button class="chip" data-filter="rating" data-value="4" aria-pressed="false">${e(t('reviews_ui.chip_4_star'))}</button>
          <button class="chip" data-filter="rating" data-value="3" aria-pressed="false">${e(t('reviews_ui.chip_3_and_below'))}</button>
        </div>
        <div class="group" role="group" aria-label="${e(t('reviews_ui.sort_aria'))}">
          <button class="chip is-active" data-filter="sort" data-value="featured" aria-pressed="true">${e(t('reviews_ui.chip_sort_featured'))}</button>
          <button class="chip" data-filter="sort" data-value="newest" aria-pressed="false">${e(t('reviews_ui.chip_sort_newest'))}</button>
          <button class="chip" data-filter="sort" data-value="detailed" aria-pressed="false">${e(t('reviews_ui.chip_sort_detailed'))}</button>
        </div>
        <div class="search-field">
          ${ico.search}
          <label class="sr-only" for="review-search">${e(t('reviews_ui.search_label'))}</label>
          <input type="search" id="review-search" placeholder="${e(t('reviews_ui.search_placeholder'))}" autocomplete="off">
        </div>
      </div>
      <p class="filter-meta" id="filter-meta" aria-live="polite">${e(tf('reviews_ui.showing_of', { shown: Math.min(INITIAL, locReviews.length), total: locReviews.length }))}</p>${reviewI18n ? `
      <p class="translation-note">${e(t('reviews_ui.translation_note'))}</p>` : ''}
      <div class="review-grid" id="review-grid">
        ${serverCards.map(reviewCard).join('\n        ')}
      </div>
      <p class="no-results" id="no-results">${e(t('reviews_ui.no_results'))} <button class="chip" onclick="location.reload()">${e(t('reviews_ui.reset'))}</button></p>
      <div class="load-more-row" id="load-more-row"${locReviews.length > INITIAL ? '' : ' style="display:none"'}>
        <button class="btn btn--secondary" id="load-more">${e(t('reviews_ui.load_more'))}</button>
      </div>
      <p style="text-align:center;margin-top:32px"><a class="btn btn--primary" href="#book" data-track="consultation_click">${ico.calendar}${e(t('common.book_free_consultation'))}</a></p>` : `
      <div class="empty-state">
        ${ico.shield}
        <h3>${e(t('reviews_ui.empty_title'))}</h3>
        <p style="max-width:560px;margin:0 auto;color:var(--neutral-700)">${e(t('reviews_ui.empty_body'))}</p>
        <div class="es-actions">
          <a class="btn btn--primary" href="#book" data-track="consultation_click">${ico.calendar}${e(t('common.book_free_consultation'))}</a>
          <a class="btn btn--secondary" href="${e(gmaps)}" target="_blank" rel="noopener nofollow" data-track="google_profile_click">${ico.external}${e(t('reviews_ui.empty_cta_read_on_google'))}</a>
          <a class="btn btn--whatsapp" href="${e(waUrl)}" target="_blank" rel="noopener" data-track="whatsapp_click">${ico.whatsapp}${e(t('reviews_ui.empty_cta_whatsapp'))}</a>
        </div>
      </div>`;

  const reviewsSection = `
  <section class="section" id="reviews" aria-labelledby="reviews-h">
    <div class="wrap" id="reviews-app" data-initial="${INITIAL}" data-step="${STEP}">
      <p class="eyebrow">${e(t('reviews_ui.eyebrow'))}</p>
      <h2 id="reviews-h">${e(hasReviews ? t('reviews_ui.heading_with_reviews') : t('reviews_ui.heading_empty'))}</h2>
      ${reviewsBody}
    </div>
  </section>`;

  const features = [
    [featureIcons.pin, t('features.pin_title'), t('features.pin_body')],
    [featureIcons.globe, t('features.globe_title'), t('features.globe_body')],
    [featureIcons.concierge, t('features.concierge_title'), t('features.concierge_body')],
    [featureIcons.plan, t('features.plan_title'), t('features.plan_body')],
    [featureIcons.sparkle, t('features.sparkle_title'), t('features.sparkle_body')],
    [featureIcons.layers, t('features.layers_title'), t('features.layers_body')]
  ];
  const whySection = `
  <section class="section section--white" id="why" aria-labelledby="why-h">
    <div class="wrap">
      <p class="eyebrow">${e(t('why.eyebrow'))}</p>
      <h2 id="why-h">${e(t('why.heading'))}</h2>
      <div class="feature-grid">
        ${features.map(([icon, ft, fd]) => `<div class="feature">${icon}<h3>${ft}</h3><p>${fd}</p></div>`).join('\n        ')}
      </div>
      <div class="disclaimer" style="margin-top:32px" role="note">
        ${ico.info}
        <span>${e(t('common.medical_disclaimer'))}</span>
      </div>
    </div>
  </section>`;

  const themesSection = (hasReviews && themes.length) ? `
  <section class="section" id="themes" aria-labelledby="themes-h">
    <div class="wrap">
      <p class="eyebrow">${e(t('themes.eyebrow'))}</p>
      <h2 id="themes-h">${e(t('themes.heading'))}</h2>
      <p class="lead" style="margin-bottom:32px">${e(t('themes.lead'))}</p>
      <div class="theme-grid">
        ${themes.map((th) => `<div class="theme">${themeIcon}<div><div class="tt">${e(t(`themes.label_${th.key}`) ?? th.label)}</div><div class="tc">${e(tf(th.count === 1 ? 'themes.count_singular' : 'themes.count_plural', { count: th.count }))}</div></div></div>`).join('\n        ')}
      </div>
    </div>
  </section>` : '';

  /* Patient photos gallery — customer uploads from the public Google listing.
     COMPLIANCE: the API provides no review linkage, so these are presented as
     standalone listing photos with uploader attribution — never tied to a review.
     (galleryItems computed above, shared with the ImageGallery JSON-LD.) */
  const photosSection = galleryItems.length ? `
  <section class="section section--white" id="photos" aria-labelledby="photos-h">
    <div class="wrap">
      <p class="eyebrow">${e(t('gallery.eyebrow'))}</p>
      <h2 id="photos-h">${e(t('gallery.heading'))}</h2>
      <p class="lead" style="margin-bottom:32px">${e(t('gallery.lead'))}</p>
      <div class="pg-grid">
        ${galleryItems.map((m) => {
          const gw = Number(m.width) > 0 ? Math.round(Number(m.width)) : 400;
          const gh = Number(m.height) > 0 ? Math.round(Number(m.height)) : 500;
          return `<a class="pg-item" href="${e(m.fullUrl)}" target="_blank" rel="noopener" data-track="google_photo_click"><img src="${e(m.gridUrl)}" alt="${fmt(e(t('gallery.photo_alt')), { uploader: e(m.uploader || t('gallery.uploader_fallback_alt')) })}" width="${gw}" height="${gh}" loading="lazy" decoding="async"><span class="pg-cap">${e(m.uploader || t('gallery.uploader_fallback_caption'))}${m.createdAt ? ' · ' + e(photoDate(m.createdAt)) : ''}</span></a>`;
        }).join('\n        ')}
      </div>
      <p style="text-align:center;margin-top:32px"><a class="btn btn--secondary" href="${e(gmaps)}" target="_blank" rel="noopener nofollow" data-track="google_profile_click">${ico.external}${e(t('gallery.see_all_on_google'))}</a></p>
    </div>
  </section>` : '';

  const visitParts = String(t('cta_band.visit_note')).split('{site_link}');
  const ctaSection = `
  <section class="section section--tint cta-band" id="contact" aria-labelledby="cta-h">
    <div class="wrap">
      <p class="eyebrow">${e(t('cta_band.eyebrow'))}</p>
      <h2 id="cta-h">${e(t('cta_band.heading'))}</h2>
      <p class="lead">${e(t('cta_band.lead'))}</p>
      <div class="row">
        <a class="btn btn--on-tint" href="#book" data-track="consultation_click">${ico.calendar}${e(t('common.book_free_consultation'))}</a>
        <a class="btn btn--ghost-tint" href="#estimate" data-track="estimate_click">${e(t('cta_band.btn_estimate'))}</a>
        <a class="btn btn--whatsapp" href="${e(waUrl)}" target="_blank" rel="noopener" data-track="whatsapp_click">${ico.whatsapp}${e(t('cta_band.btn_whatsapp'))}</a>
        <a class="btn btn--ghost-tint" href="${e(c.contact.phonePrimaryHref)}" data-track="consultation_click">${e(tf('cta_band.btn_call', { phone: c.contact.phonePrimary }))}</a>
      </div>
      <p style="margin-top:24px;font-size:14px;color:rgba(250,247,242,.75)">${e(visitParts[0] ?? '')}<a href="${e(c.contact.contactPageUrl)}" target="_blank" rel="noopener" style="color:var(--brand-cream);text-decoration:underline">${e(t('cta_band.visit_link_text'))}</a>${e(visitParts[1] ?? '')}</p>
    </div>
  </section>`;

  const faqSectionHtml = (items, heading) => `
  <section class="section section--white" id="faq" aria-labelledby="faq-h">
    <div class="wrap">
      <p class="eyebrow">${e(t('faq.eyebrow'))}</p>
      <h2 id="faq-h" style="text-align:center">${e(heading)}</h2>
      <div class="faq">
        ${items.map(([q, a]) => `<details><summary>${e(q)}<span class="plus" aria-hidden="true">+</span></summary><div class="answer"><p>${a}</p></div></details>`).join('\n        ')}
      </div>
    </div>
  </section>`;
  const faqSection = faqSectionHtml(allFaqs, t('faq.heading_main'));

  const footer = `
  <footer class="site-footer">
    <div class="wrap">
      <div class="cols">
        <div>
          <div class="fbrand">${e(t('footer.brand'))}</div>
          <p style="font-size:14px;color:rgba(250,247,242,.75);max-width:34ch">${e(t('footer.about'))}</p>
          <p style="font-size:14px;margin-top:12px">${e(c.address.streetAddress)}<br>${e(c.address.addressLocality)}, ${e(c.address.addressRegion)} ${e(c.address.postalCode)}<br>${e(c.address.addressCountryName)}</p>
        </div>
        <div>
          <h3>${e(t('footer.col_heading_clinic'))}</h3>
          <ul>
            <li><a href="#estimate">${e(t('footer.link_estimate'))}</a></li>
            <li><a href="${bookingHref}">${e(t('common.book_a_consultation'))}</a></li>
            <li><a href="${e(c.businessSite)}" target="_blank" rel="noopener">${e(t('footer.link_main_site'))}</a></li>
            <li><a href="${e(c.contact.consultationUrl)}" target="_blank" rel="noopener">${e(t('footer.link_consultation'))}</a></li>
            <li><a href="${e(c.contact.galleryUrl)}" target="_blank" rel="noopener">${e(t('footer.link_gallery'))}</a></li>
            <li><a href="${e(gmaps)}" target="_blank" rel="noopener nofollow">${e(t('footer.link_google_reviews'))}</a></li>
            <li><a href="${e(waUrl)}" target="_blank" rel="noopener">${e(tf('footer.link_whatsapp', { number: c.contact.whatsappDisplay }))}</a></li>
            <li><a href="${e(c.contact.phonePrimaryHref)}">${e(c.contact.phonePrimary)}</a></li>
          </ul>
        </div>
        <div>
          <h3>${e(t('footer.col_heading_follow'))}</h3>
          <ul>
            ${c.sameAs.map((u) => `<li><a href="${e(u)}" target="_blank" rel="noopener">${e(u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a></li>`).join('\n            ')}
          </ul>
        </div>
      </div>
      <div class="disclaimer" style="margin-top:40px;background:rgba(250,247,242,.06);border-color:rgba(184,148,90,.4);color:rgba(250,247,242,.85)" role="note">
        ${ico.info}
        <span>${e(t('footer.disclaimer'))}</span>
      </div>
      <div class="legal">
        <span>${e(tf('footer.copyright', { year: now.getFullYear() }))}</span>
        <span><a href="${e(c.contact.privacyUrl)}" target="_blank" rel="noopener">${e(t('footer.link_privacy'))}</a> · <a href="${e(c.contact.legalUrl)}" target="_blank" rel="noopener">${e(t('footer.link_legal'))}</a></span>
        <span>${e(lastUpdated ? tf('footer.reviews_last_updated', { date: longDate(lastUpdated) }) : t('footer.reviews_update_note'))}</span>
      </div>
      <nav class="lang-links" aria-label="Language">
        <a href="/" hreflang="en"${locale ? '' : ' aria-current="true"'}>${AUTONYMS.en}</a>
        ${LOCALES.map((l) => `<a href="/${l.code}/" hreflang="${l.hreflang}"${locale && locale.code === l.code ? ' aria-current="true"' : ''}>${AUTONYMS[l.code]}</a>`).join('\n        ')}
      </nav>
    </div>
  </footer>
  <script>document.querySelectorAll('.lang-switch').forEach(function(s){s.addEventListener('change',function(){location.href=this.value;});});</script>`;

  const mobileCta = `
  <nav class="mobile-cta" aria-label="${e(t('mobile_cta.nav_aria'))}">
    <a class="btn btn--whatsapp" href="${e(waUrl)}" target="_blank" rel="noopener" data-track="whatsapp_click">${ico.whatsapp}${e(t('common.whatsapp'))}</a>
    <a class="btn btn--on-tint" href="${bookingHref}" data-track="consultation_click">${ico.calendar}${e(t('common.start_consultation'))}</a>
  </nav>`;

  /* data island for client-side filtering (only when populated) */
  const island = hasReviews
    ? `<script type="application/json" id="reviews-data">${JSON.stringify(locReviews.map((r) => {
        const loc = reviewI18n ? reviewLoc(reviewI18n, r) : null;
        return {
        reviewerName: r.reviewerName, reviewerPhotoUrl: safePhoto(r.reviewerPhotoUrl), rating: r.rating, originalText: r.originalText,
        translatedText: r.translatedText || '', originalLanguage: r.originalLanguage || 'en',
        publishedAt: r.publishedAt || '', relativeDate: r.relativeDate || '',
        ownerReply: r.ownerReply || '', isFeatured: !!r.isFeatured,
        ...(loc ? { localizedText: loc.text || '', localizedTranslated: !!loc.translated, localizedReply: loc.reply || '' } : {})
        };
      })).replace(/</g, '\\u003c')}</script>`
    : '';

  /* window.__I18N blob — localized pages only. Carries the client-JS string groups;
     English pages get no blob (the JS falls back to its inline English literals). */
  const i18nBlob = locale
    ? `<script>window.__I18N = ${JSON.stringify({
        locale: locale.code, dir: locale.dir,
        js_reviews: t('js_reviews'), js_estimate: t('js_estimate'), js_booking: t('js_booking'),
        booking_options: t('booking_options'), relative_dates: t('relative_dates'),
        language_names: t('language_names'),
        // extra groups: strings single-sourced in the catalog but re-rendered client-side
        reviews_ui: t('reviews_ui'), common: t('common')
      }).replace(/</g, '\\u003c')}</script>\n  `
    : '';

  /* ---------------- estimate widget ---------------- */
  // Localized copy of the pricing data (names/descriptions/labels/disclaimers from
  // the catalog, aligned by index/slug with the EN data). EN uses the file as-is.
  const locPricing = locale ? {
    ...estimatePricing,
    lastUpdatedLabel: t('estimate_data.last_updated_label'),
    disclaimers: t('estimate_data.disclaimers'),
    categories: estimatePricing.categories.map((cat) => ({
      ...cat, label: t(`estimate_data.category_labels.${us(cat.value)}`) ?? cat.label
    })),
    services: estimatePricing.services.map((s, i) => ({
      ...s,
      name: t('treatments')[i] ?? s.name,
      categoryLabel: t(`estimate_data.category_labels.${us(s.category)}`) ?? s.categoryLabel,
      description: t(`treatment_descriptions.${us(s.value)}`) ?? s.description
    })),
    packages: estimatePricing.packages.map((p, i) => ({
      ...p,
      name: t('bundles')[i] ?? p.name,
      description: t(`bundle_descriptions.${us(p.value)}`) ?? p.description
    }))
  } : estimatePricing;

  const estimateIsland = `<script type="application/json" id="estimate-data">${JSON.stringify(locPricing).replace(/</g, '\\u003c')}</script>`;
  /* Server-rendered indicative price table — semantic HTML for AI/crawler extraction
     (the interactive tool renders client-side; this makes the real numbers citable). */
  const PRICE_TABLE_SLUGS = [
    'hair-transplant-treatment', 'rhinoplasty', 'revision-rhinoplasty', 'face-lift',
    'upper-and-lower-blepharoplasty', 'liposuction-360', 'tummy-tuck-liposuction-360',
    'breast-implant', 'breast-lift', 'breast-implant-lift', 'gynecomastia',
    'gastric-sleeve', 'gastric-balloon', 'hollywood-smile-zirconium-crown', 'botox-per-1ml'
  ];
  const priceRows = PRICE_TABLE_SLUGS
    .map((v) => locPricing.services.find((s) => s.value === v)).filter(Boolean);
  const priceTable = priceRows.length ? `
      <div class="price-guide">
        <h3 id="price-h">${e(t('price_table.heading'))}</h3>
        <p style="font-size:15px;color:var(--neutral-700)">${tf('price_table.intro', { last_reviewed: locPricing.lastUpdatedLabel ? tf('price_table.intro_last_reviewed_fragment', { date: e(locPricing.lastUpdatedLabel) }) : '' })}</p>
        <!-- A table cannot shrink below its min-content width, so on a 320px
             screen this one is ~315px inside a 272px column and pushes the whole
             page sideways. The scroll container absorbs that instead. -->
        <div class="table-scroll" tabindex="0" role="region" aria-labelledby="price-h">
          <table class="price-table">
            <caption class="sr-only">${e(t('price_table.sr_caption'))}</caption>
            <thead><tr><th scope="col">${e(t('price_table.th_treatment'))}</th><th scope="col">${e(t('price_table.th_price'))}</th></tr></thead>
            <tbody>
              ${priceRows.map((s) => `<tr><th scope="row">${e(s.name)}</th><td>${tf('price_table.cell_from_price', { price: bdi(s.fromPrice.toLocaleString('en-GB')) })}</td></tr>`).join('\n              ')}
            </tbody>
          </table>
        </div>
      </div>` : '';

  const estimateSection = `
  <section class="section" id="estimate" aria-labelledby="est-h">
    <div class="wrap">
      <p class="eyebrow">${e(t('estimate.eyebrow'))}</p>
      <h2 id="est-h">${e(t('estimate.heading'))}</h2>
      <p class="lead booking-intro">${e(t('estimate.lead'))}</p>
      <div id="estimate-app" data-whatsapp="${e(c.contact.whatsappNumber)}">
        <noscript>
          <p>${e(t('estimate.noscript_body'))}</p>
          <p style="margin-top:12px"><a class="btn btn--whatsapp" href="${e(waUrl)}" target="_blank" rel="noopener">${ico.whatsapp}${e(t('estimate.noscript_whatsapp'))}</a></p>
        </noscript>
      </div>
      ${priceTable}
    </div>
  </section>`;

  /* ---------------- booking flow ---------------- */
  const bookingIsland = `<script type="application/json" id="booking-options">${JSON.stringify(bookingOptions).replace(/</g, '\\u003c')}</script>`;

  const complianceNote = `
      <div class="compliance-note" role="note">
        <ul>
          <li>${e(t('booking.compliance_1'))}</li>
          <li>${e(t('booking.compliance_2'))}</li>
          <li>${e(t('booking.compliance_3'))}</li>
          <li>${e(t('booking.compliance_4'))}</li>
        </ul>
      </div>`;

  const bookingSection = `
  <section class="section section--white" id="book" aria-labelledby="book-h">
    <div class="wrap">
      <p class="eyebrow">${e(t('booking.eyebrow'))}</p>
      <h2 id="book-h">${e(t('booking.heading'))}</h2>
      <p class="lead booking-intro">${e(t('booking.lead'))}</p>
      <div class="booking-card">
        <div id="booking-app" data-whatsapp="${e(c.contact.whatsappNumber)}" data-business="${e(c.businessSite)}" data-reviews-href="${base}">
          <noscript>
            <p>${e(t('booking.noscript_body'))}</p>
            <p style="display:flex;gap:12px;flex-wrap:wrap;margin-top:12px">
              <a class="btn btn--whatsapp" href="${e(waUrl)}" target="_blank" rel="noopener">${ico.whatsapp}${e(t('common.contact_on_whatsapp'))}</a>
              <a class="btn btn--secondary" href="${e(consultUrl)}" target="_blank" rel="noopener">${e(t('booking.noscript_form_link'))}</a>
            </p>
          </noscript>
        </div>
      </div>
      ${complianceNote}
    </div>
  </section>`;

  const howItWorks = (() => {
    const steps = [
      [t('how_it_works.step1_title'), t('how_it_works.step1_body')],
      [t('how_it_works.step2_title'), t('how_it_works.step2_body')],
      [t('how_it_works.step3_title'), t('how_it_works.step3_body')],
      [t('how_it_works.step4_title'), t('how_it_works.step4_body')]
    ];
    return `
  <section class="section" id="how-it-works" aria-labelledby="hiw-h">
    <div class="wrap">
      <p class="eyebrow">${e(t('how_it_works.eyebrow'))}</p>
      <h2 id="hiw-h">${e(t('how_it_works.heading'))}</h2>
      <div class="steps-grid">
        ${steps.map(([st, sd], i) => `<div class="stp"><div class="n">${i + 1}</div><h3>${e(st)}</h3><p>${e(sd)}</p></div>`).join('\n        ')}
      </div>
    </div>
  </section>`;
  })();

  const whyBookSection = `
  <section class="section section--white" id="why-book" aria-labelledby="whyb-h">
    <div class="wrap">
      <p class="eyebrow">${e(t('why_book.eyebrow'))}</p>
      <h2 id="whyb-h">${e(t('why_book.heading'))}</h2>
      <div class="feature-grid">
        ${features.map(([icon, ft, fd]) => `<div class="feature">${icon}<h3>${ft}</h3><p>${fd}</p></div>`).join('\n        ')}
      </div>
      <div class="disclaimer" style="margin-top:32px" role="note">${ico.info}<span>${e(t('common.medical_disclaimer'))}</span></div>
    </div>
  </section>`;

  const internationalSection = `
  <section class="section" id="international" aria-labelledby="intl-h">
    <div class="wrap">
      <p class="eyebrow">${e(t('international.eyebrow'))}</p>
      <h2 id="intl-h">${e(t('international.heading'))}</h2>
      <p class="lead">${e(t('international.lead'))}</p>
      <div class="feature-grid" style="margin-top:32px">
        <div class="feature">${featureIcons.globe}<h3>${e(t('international.f1_title'))}</h3><p>${e(t('international.f1_body'))}</p></div>
        <div class="feature">${featureIcons.concierge}<h3>${e(t('international.f2_title'))}</h3><p>${e(t('international.f2_body'))}</p></div>
        <div class="feature">${featureIcons.plan}<h3>${e(t('international.f3_title'))}</h3><p>${e(t('international.f3_body'))}</p></div>
      </div>
      <div class="disclaimer" style="margin-top:32px" role="note">${ico.info}<span>${e(t('international.disclaimer'))}</span></div>
    </div>
  </section>`;

  const metaDesc = seo.homeDesc;
  const ogImage = `${SITE_URL}/assets/og-vivid-clinic-reviews.jpg`;
  const ogImageAlt = t('meta.og_image_alt');

  const html = `<!doctype html>
${htmlTag}
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${e(seo.homeTitle)}</title>
  <meta name="description" content="${e(metaDesc)}">
  <link rel="canonical" href="${homeUrl}">
  ${hreflangBlock('')}
  <meta name="robots" content="${robotsMeta}">
  <meta name="theme-color" content="#0E4B4E">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${e(t('meta.og_site_name'))}">
  <meta property="og:title" content="${e(seo.homeTitle)}">
  <meta property="og:description" content="${e(metaDesc)}">
  <meta property="og:url" content="${homeUrl}">
  <meta property="og:image" content="${e(ogImage)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:alt" content="${e(ogImageAlt)}">
  <meta property="og:locale" content="${locale ? locale.og : 'en_GB'}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${e(seo.homeTitle)}">
  <meta name="twitter:description" content="${e(metaDesc)}">
  <meta name="twitter:image" content="${e(ogImage)}">
  <meta name="twitter:image:alt" content="${e(ogImageAlt)}">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/assets/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap">
  <link rel="stylesheet" href="/styles/main.css">
  ${ldBlocks}
</head>
<body>
  <a class="skip-link" href="#reviews">${e(t('header.skip_to_reviews'))}</a>
  <header class="site-header">
    <div class="wrap">
      <a class="brand-lockup" href="${base}">
        <span class="brand-name">${e(t('header.brand_name'))}<span class="brand-sub">${e(t('header.brand_sub_home'))}</span></span>
      </a>
      ${headerCtas('')}
    </div>
  </header>
  <main>
    ${heroSection}
    ${trustRail}
    ${summarySection}
    ${reviewsSection}
    ${photosSection}
    ${estimateSection}
    ${bookingSection}
    ${howItWorks}
    ${whySection}
    ${themesSection}
    ${ctaSection}
    ${faqSection}
  </main>
  ${footer}
  ${mobileCta}
  ${i18nBlob}${island}
  ${bookingIsland}
  ${estimateIsland}
  <script src="/js/reviews.js" defer></script>
  <script src="/js/estimate.js" defer></script>
  <script src="/js/booking.js" defer></script>
</body>
</html>
`;

  /* ---------------- /consultation/ page (always indexable: complete booking content, no reviews) ---------------- */
  const consultRobots = 'index, follow, max-image-preview:large';
  const consultDesc = seo.consultDesc;
  const consultationLd = [
    organizationLd,
    {
      '@context': 'https://schema.org', '@type': 'WebPage',
      '@id': `${consultPageUrl}#webpage`, url: consultPageUrl,
      name: seo.consultTitle,
      ...(locale ? { description: consultDesc } : {}),
      isPartOf: { '@id': `${SITE_URL}/#website` }, about: { '@id': `${SITE_URL}/#clinic` }, inLanguage: inLang
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t('reviews_ui.heading_empty'), item: homeUrl },
        { '@type': 'ListItem', position: 2, name: t('common.book_a_consultation'), item: consultPageUrl }
      ]
    },
    webAppLd,
    faqGraph(bookingFaqs)
  ].map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`).join('\n  ');

  const consultationHero = `
  <section class="hero" id="top">
    <div class="wrap" style="grid-template-columns:1fr;max-width:820px">
      <div>
        <p class="eyebrow">${e(t('consult_hero.eyebrow'))}</p>
        <h1>${e(t('consult_hero.h1'))}</h1>
        <p class="lead">${e(t('consult_hero.lead'))}</p>
        <div class="hero-cta-row">
          <a class="btn btn--primary" href="#book" data-track="consultation_click">${ico.calendar}${e(t('common.start_consultation'))}</a>
          <a class="btn btn--whatsapp" href="${e(waUrl)}" target="_blank" rel="noopener" data-track="whatsapp_click">${ico.whatsapp}${e(t('common.contact_on_whatsapp'))}</a>
          <a class="btn btn--secondary" href="${base}">${ico.external}${e(t('common.read_patient_reviews'))}</a>
        </div>
      </div>
    </div>
  </section>`;

  const consultationHtml = `<!doctype html>
${htmlTag}
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${e(seo.consultTitle)}</title>
  <meta name="description" content="${e(consultDesc)}">
  <link rel="canonical" href="${consultPageUrl}">
  ${hreflangBlock('consultation/')}
  <meta name="robots" content="${consultRobots}">
  <meta name="theme-color" content="#0E4B4E">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${e(t('meta.og_site_name'))}">
  <meta property="og:title" content="${e(seo.consultTitle)}">
  <meta property="og:description" content="${e(consultDesc)}">
  <meta property="og:url" content="${consultPageUrl}">
  <meta property="og:image" content="${e(ogImage)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:alt" content="${e(ogImageAlt)}">
  <meta property="og:locale" content="${locale ? locale.og : 'en_GB'}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${e(seo.consultTitle)}">
  <meta name="twitter:description" content="${e(consultDesc)}">
  <meta name="twitter:image" content="${e(ogImage)}">
  <meta name="twitter:image:alt" content="${e(ogImageAlt)}">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/assets/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap">
  <link rel="stylesheet" href="/styles/main.css">
  ${consultationLd}
</head>
<body>
  <a class="skip-link" href="#book">${e(t('header.skip_to_booking'))}</a>
  <header class="site-header">
    <div class="wrap">
      <a class="brand-lockup" href="${base}">
        <span class="brand-name">${e(t('header.brand_name'))}<span class="brand-sub">${e(t('header.brand_sub_consult'))}</span></span>
      </a>
      ${headerCtas('consultation/')}
    </div>
  </header>
  <main>
    ${consultationHero}
    ${estimateSection}
    ${bookingSection}
    ${howItWorks}
    ${whyBookSection}
    ${internationalSection}
    ${faqSectionHtml(bookingFaqs, t('faq.heading_booking'))}
  </main>
  ${footer}
  ${mobileCta}
  ${i18nBlob}${bookingIsland}
  ${estimateIsland}
  <script src="/js/estimate.js" defer></script>
  <script src="/js/booking.js" defer></script>
</body>
</html>
`;

  return { html, consultationHtml };
}

/* ---------------- render ---------------- */
const { html, consultationHtml } = renderPages(null);

/* ---------------- write outputs ---------------- */
mkdirSync(join(DIST, 'styles'), { recursive: true });
mkdirSync(join(DIST, 'js'), { recursive: true });
mkdirSync(join(DIST, 'assets'), { recursive: true });
mkdirSync(join(DIST, 'reviews'), { recursive: true });
mkdirSync(join(DIST, 'consultation'), { recursive: true });

writeFileSync(join(DIST, outArg), html);
// /reviews/ alias + /consultation/ page — only for the canonical build.
if (!DEMO && outArg === 'index.html') {
  writeFileSync(join(DIST, 'reviews', 'index.html'), html);
  writeFileSync(join(DIST, 'consultation', 'index.html'), consultationHtml);
}

// Localized page sets — canonical build only. dist/<code>/ → https://vivid.clinic/<code>/
if (!DEMO && outArg === 'index.html') {
  for (const locale of LOCALES) {
    const pages = renderPages(locale);
    mkdirSync(join(DIST, locale.code, 'consultation'), { recursive: true });
    writeFileSync(join(DIST, locale.code, 'index.html'), pages.html);
    writeFileSync(join(DIST, locale.code, 'consultation', 'index.html'), pages.consultationHtml);
  }
}

copyFileSync(join(ROOT, 'src', 'styles', 'main.css'), join(DIST, 'styles', 'main.css'));
copyFileSync(join(ROOT, 'src', 'js', 'reviews.js'), join(DIST, 'js', 'reviews.js'));
copyFileSync(join(ROOT, 'src', 'js', 'booking.js'), join(DIST, 'js', 'booking.js'));
copyFileSync(join(ROOT, 'src', 'js', 'estimate.js'), join(DIST, 'js', 'estimate.js'));
copyFileSync(join(ROOT, 'src', 'assets', 'og-vivid-clinic-reviews.jpg'), join(DIST, 'assets', 'og-vivid-clinic-reviews.jpg'));
copyFileSync(join(ROOT, 'src', 'assets', 'hero-atmosphere.jpg'), join(DIST, 'assets', 'hero-atmosphere.jpg'));

// Self-hosted Google listing photos → dist/assets/gbp/. Copy only what the
// gallery actually references, so a pruned photo cannot linger in a deploy.
if (galleryItems.length) {
  mkdirSync(join(DIST, 'assets', 'gbp'), { recursive: true });
  const wanted = new Set(galleryItems.flatMap((m) => [m.fullUrl, m.gridUrl].map((u) => u.replace(/^\/assets\/gbp\//, ''))));
  for (const name of wanted) {
    copyFileSync(join(ROOT, 'src', 'assets', 'gbp', name), join(DIST, 'assets', 'gbp', name));
  }
  console.log(`  Copied ${wanted.size} listing photo file(s) → dist/assets/gbp/`);
}

// favicon (brand monogram)
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0E4B4E"/><text x="32" y="44" font-family="Georgia, 'Cormorant Garamond', serif" font-size="40" font-weight="700" fill="#FAF7F2" text-anchor="middle">V</text><circle cx="48" cy="18" r="4" fill="#B8945A"/></svg>`;
writeFileSync(join(DIST, 'assets', 'favicon.svg'), favicon);

// robots.txt + sitemap.xml (canonical build only).
// We always allow crawling (so Google can READ the noindex tag). The sitemap is only
// written when the page is indexable — a sitemap must never advertise a noindex URL.
if (!DEMO) {
  const today = now.toISOString().slice(0, 10);
  // Multilingual sitemap (Google's xhtml:link format): every URL of a language cluster
  // lists all its alternates, so Google can pick the right language version per searcher.
  // /reviews/ is deliberately NOT listed — it canonicalizes to / and a sitemap must only
  // advertise canonical URLs. /consultation/ has no review dependency — always indexable;
  // the home cluster is listed only when the reviews page is indexable.
  const altBlock = (sub) => [
    { hl: 'en', href: `${SITE_URL}/${sub}` },
    ...LOCALES.map((l) => ({ hl: l.hreflang, href: `${SITE_URL}/${l.code}/${sub}` })),
    { hl: 'x-default', href: `${SITE_URL}/${sub}` }
  ].map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hl}" href="${a.href}"/>`).join('\n');
  const urlEntry = (loc, pr, sub) =>
    `  <url>\n    <loc>${loc}</loc>\n${altBlock(sub)}\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${pr}</priority>\n  </url>`;

  const entries = [];
  if (indexable) {
    entries.push(urlEntry(`${SITE_URL}/`, '1.0', ''));
    for (const l of LOCALES) entries.push(urlEntry(`${SITE_URL}/${l.code}/`, '0.8', ''));
  }
  entries.push(urlEntry(`${SITE_URL}/consultation/`, '0.9', 'consultation/'));
  for (const l of LOCALES) entries.push(urlEntry(`${SITE_URL}/${l.code}/consultation/`, '0.7', 'consultation/'));

  // robots.txt always allows crawling and always references the sitemap (the
  // consultation page is always in it). The noindex meta on / handles de-indexing.
  writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  writeFileSync(join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    entries.join('\n') + `\n</urlset>\n`);
}

// llms.txt (https://llmstxt.org) — a concise, factual map of the site for AI systems.
// Data-driven from clinic.json + the live review summary so it stays current on refresh.
if (!DEMO) {
  const languageLines = LOCALES.map((l) => {
    const pack = LOCALE_PACKS.get(l.code);
    return `- [${pack._meta.language} (${l.code})](${SITE_URL}/${l.code}/) · [consultation](${SITE_URL}/${l.code}/consultation/)`;
  }).join('\n');
  const llms = `# Vivid Clinic — Reviews & Consultation (vivid.clinic)

> Official patient-reviews and consultation-booking site for Vivid Clinic, a medical aesthetics and hair restoration clinic in Bakırköy, Istanbul, Türkiye. ${hasReviews ? `Displays ${summary.totalReviewCount} verified patient reviews imported from the clinic's Google Business Profile via the official API (average rating ${summary.averageRating}/5).` : 'Reviews are imported from the clinic’s Google Business Profile via the official API.'} Reviews are shown verbatim and are never edited or fabricated.

Key facts:
- Clinic: ${c.name}, ${c.address.streetAddress}, ${c.address.addressLocality}, ${c.address.addressRegion} ${c.address.postalCode}, Türkiye
- Specialties: ${c.specialties.join(', ')}
- Languages: ${c.languagesSpoken.join(', ')}
- Contact: WhatsApp ${c.contact.whatsappDisplay} · ${c.contact.emailGeneral} · ${c.contact.phonePrimary}
- Hours: ${c.openingHoursHuman}
${hasReviews ? `- Google reviews: ${summary.totalReviewCount} total, ${summary.averageRating}/5 average, ${summary.fiveStarPercentage}% five-star (source: Google Business Profile)\n` : ''}- Consultations are free; no online payment is taken on this site. Estimates are indicative only — final pricing is confirmed after a medical consultation. Patient experiences are individual and may vary.

## Pages

- [Patient reviews](${SITE_URL}/): ${hasReviews ? `${summary.totalReviewCount} verified Google reviews` : 'Verified Google reviews'} with rating summary, review themes, and patient photos from the public Google listing
- [Book a consultation](${SITE_URL}/consultation/): free consultation request form and an indicative treatment-cost estimate tool (${estimatePricing.services.length} treatments)
- [Sitemap](${SITE_URL}/sitemap.xml)

## Languages

Localized versions (interface and guidance translated; review text stays in each reviewer's original words):

${languageLines}

## Related

- [Main clinic website](${c.businessSite}): treatments, doctors, before/after gallery, contact
- [Google Business Profile listing](${gmaps}): the original source of every review shown on this site
`;
  writeFileSync(join(DIST, 'llms.txt'), llms);

  // 404.html — Cloudflare Pages serves this with a real 404 status for missing paths,
  // which also disables the SPA fallback (fixes soft-404s: unknown URLs no longer 200).
  const notFound = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page not found | Vivid Clinic</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/styles/main.css">
</head>
<body>
<main class="section" style="min-height:70vh;display:grid;place-items:center;text-align:center">
  <div class="wrap">
    <p class="eyebrow">Error 404</p>
    <h1>This page doesn’t exist</h1>
    <p class="lead" style="margin:0 auto 32px">The page you’re looking for isn’t here — but the reviews and consultation form are.</p>
    <p style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;max-width:none">
      <a class="btn btn--primary" href="/">Read patient reviews</a>
      <a class="btn btn--secondary" href="/consultation/">Book a consultation</a>
    </p>
  </div>
</main>
</body>
</html>
`;
  writeFileSync(join(DIST, '404.html'), notFound);
}

console.log(`✓ Built ${join('dist', outArg)} ${DEMO ? '(DEMO — synthetic fixture, do not deploy)' : ''}`);
console.log(`  Reviews rendered: ${reviews.length}${hasReviews ? '' : ' (empty state)'}  ·  avg ${summary.averageRating || '—'}  ·  themes ${themes.length}`);
console.log(`  Reviews page (/) indexing: ${indexable ? 'INDEXABLE (index, follow)' : 'NOINDEX (waiting state — no real reviews)'}`);
console.log(`  Estimate widget: ${estimatePricing.services.length} treatments, ${estimatePricing.packages.length} bundles (#estimate)`);
console.log(`  Booking flow: embedded on / (#book) + /consultation/ (always indexable)`);
if (!DEMO) console.log(`  Also wrote: dist/reviews/index.html, dist/consultation/index.html, robots.txt, sitemap.xml, js/booking.js, assets/favicon.svg`);
if (!DEMO && outArg === 'index.html') {
  console.log(`  i18n: ${LOCALES.length} locales (${LOCALES.map((l) => l.code).join(', ')}) → dist/<code>/index.html + dist/<code>/consultation/index.html · hreflang ×15 on every page · sitemap +${indexable ? LOCALES.length * 2 : LOCALES.length} URLs`);
}
