#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// i18n verification harness for the multilingual build (see I18N-SPEC.md).
//   node scripts/verify-i18n.mjs
//
// Runs the build, then checks every localized page for:
//   1. <html lang>/dir, self-canonical, exactly 15 hreflang links, og:locale
//   2. localized <title> matches the pack's _meta.seo
//   3. no English sentinel leakage outside <script> blocks / review-card text
//   4. no raw unsubstituted {token} in visible text outside <script>
//   5. window.__I18N blob parses and contains the required groups
//   6. JSON-LD blocks parse; FAQPage inLanguage correct
// Plus the EN diff invariant: dist/index.html + dist/consultation/index.html
// differ from the pre-i18n baselines ONLY by the hreflang block, and
// sitemap.xml only by the added locale entries.
// Exits non-zero on any failure.
// ─────────────────────────────────────────────────────────────────────────────

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, readJson } from './lib.mjs';

const SITE_URL = 'https://vivid.clinic';
const DIST = join(ROOT, 'dist');
const I18N_DIR = join(ROOT, 'src', 'data', 'i18n');
const BASELINE_DIR = process.env.I18N_BASELINE_DIR ||
  '/private/tmp/claude-501/-Users-roozbehnazari-Desktop-Vivid-Competitors-XML/be610502-82f0-4862-aa78-3c326b8dbd59/scratchpad/baseline';

const LOCALES = [
  { code: 'ar', htmlLang: 'ar', dir: 'rtl', og: 'ar_AR' },
  { code: 'bg', htmlLang: 'bg', dir: 'ltr', og: 'bg_BG' },
  { code: 'de', htmlLang: 'de', dir: 'ltr', og: 'de_DE' },
  { code: 'es', htmlLang: 'es', dir: 'ltr', og: 'es_ES' },
  { code: 'fa', htmlLang: 'fa', dir: 'rtl', og: 'fa_IR' },
  { code: 'fr', htmlLang: 'fr', dir: 'ltr', og: 'fr_FR' },
  { code: 'he', htmlLang: 'he', dir: 'rtl', og: 'he_IL' },
  { code: 'it', htmlLang: 'it', dir: 'ltr', og: 'it_IT' },
  { code: 'nl', htmlLang: 'nl', dir: 'ltr', og: 'nl_NL' },
  { code: 'ru', htmlLang: 'ru', dir: 'ltr', og: 'ru_RU' },
  { code: 'tr', htmlLang: 'tr', dir: 'ltr', og: 'tr_TR' },
  { code: 'uk', htmlLang: 'uk', dir: 'ltr', og: 'uk_UA' },
  { code: 'zh', htmlLang: 'zh-CN', dir: 'ltr', og: 'zh_CN' }
];

const SENTINELS = [
  'Book a Free Consultation', 'Read the reviews', 'How much do treatments cost',
  'Frequently Asked Questions', 'No payment is taken online', 'results vary',
  'Get an estimate', 'Patient photos', 'All reviews are', 'Opening hours'
];
const REQUIRED_GROUPS = ['js_reviews', 'js_estimate', 'js_booking', 'booking_options', 'relative_dates', 'language_names'];

/* ---------- tally ---------- */
const counts = {}; // checkName -> { pass, fail }
const failures = [];
function check(name, cond, detail) {
  const c = (counts[name] ||= { pass: 0, fail: 0 });
  if (cond) c.pass++;
  else { c.fail++; failures.push(`${name}: ${detail}`); }
}

/* ---------- helpers ---------- */
const decodeEntities = (s) => String(s)
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const stripScripts = (html) => html.replace(/<script[\s\S]*?<\/script>/gi, '');
// remove verbatim review-card text nodes (original review text / translations /
// owner replies / reviewer names stay in their source language by design)
const stripReviewText = (html) => html
  .replace(/<p class="rc-body">[\s\S]*?<\/p>/g, '')
  .replace(/<div class="rc-translation">[\s\S]*?<\/div>/g, '')
  .replace(/<div class="rc-reply">[\s\S]*?<\/div>/g, '')
  .replace(/<div class="rc-name">[\s\S]*?<\/div>/g, '');

/* ---------- 0. build exits 0 ---------- */
try {
  execFileSync(process.execPath, [join(ROOT, 'scripts', 'build-site.mjs')], { stdio: 'pipe' });
  check('0-build-exit-0', true);
} catch (err) {
  check('0-build-exit-0', false, `build exited ${err.status}: ${String(err.stderr || err.message).slice(0, 400)}`);
}

/* ---------- per-locale page checks ---------- */
for (const l of LOCALES) {
  const pack = readJson(join(I18N_DIR, `ui.${l.code}.json`));
  const pages = [
    { type: 'home', file: join(DIST, l.code, 'index.html'), url: `${SITE_URL}/${l.code}/`, enUrl: `${SITE_URL}/`, title: pack._meta.seo.home_title },
    { type: 'consultation', file: join(DIST, l.code, 'consultation', 'index.html'), url: `${SITE_URL}/${l.code}/consultation/`, enUrl: `${SITE_URL}/consultation/`, title: pack._meta.seo.consult_title }
  ];
  for (const p of pages) {
    const id = `${l.code}/${p.type}`;
    if (!existsSync(p.file)) { check('1-head', false, `${id}: missing file ${p.file}`); continue; }
    const html = readFileSync(p.file, 'utf8');

    // 1 — html lang/dir, self-canonical, 15 hreflang links, og:locale
    const m = html.match(/<html lang="([^"]*)"( dir="rtl")?>/);
    check('1-head', !!m && m[1] === l.htmlLang, `${id}: html lang="${m && m[1]}" (want ${l.htmlLang})`);
    check('1-head', !!m && (!!m[2] === (l.dir === 'rtl')), `${id}: dir attr ${m && m[2] ? 'present' : 'absent'} (dir should be ${l.dir})`);
    check('1-head', html.includes(`<link rel="canonical" href="${p.url}">`), `${id}: canonical is not self (${p.url})`);
    const hrefLangs = html.match(/<link rel="alternate" hreflang="[^"]+" href="[^"]+">/g) || [];
    check('1-head', hrefLangs.length === 15, `${id}: ${hrefLangs.length} hreflang links (want 15)`);
    const sub = p.type === 'home' ? '' : 'consultation/';
    check('1-head', html.includes(`<link rel="alternate" hreflang="en" href="${SITE_URL}/${sub}">`), `${id}: hreflang=en missing/wrong`);
    check('1-head', html.includes(`<link rel="alternate" hreflang="x-default" href="${SITE_URL}/${sub}">`), `${id}: x-default missing/wrong`);
    check('1-head', html.includes(`<link rel="alternate" hreflang="${l.code}" href="${p.url}">`), `${id}: own hreflang missing/wrong`);
    check('1-head', html.includes(`<meta property="og:locale" content="${l.og}">`), `${id}: og:locale wrong (want ${l.og})`);
    check('1-head', html.includes(`<meta property="og:url" content="${p.url}">`), `${id}: og:url not localized`);

    // 2 — localized <title> from _meta.seo
    const tm = html.match(/<title>([\s\S]*?)<\/title>/);
    check('2-title', !!tm && decodeEntities(tm[1]) === p.title, `${id}: title "${tm && decodeEntities(tm[1])}" ≠ _meta.seo "${p.title}"`);

    // 3 — English sentinel leakage (outside scripts + verbatim review text)
    const visible = stripReviewText(stripScripts(html));
    const lowered = visible.toLowerCase();
    for (const s of SENTINELS) {
      check('3-sentinels', !lowered.includes(s.toLowerCase()), `${id}: sentinel leaked: "${s}"`);
    }

    // 4 — no raw unsubstituted {token} in visible text
    const tokens = visible.match(/\{[a-zA-Z_][a-zA-Z0-9_]*\}/g) || [];
    check('4-tokens', tokens.length === 0, `${id}: raw tokens: ${[...new Set(tokens)].join(', ')}`);

    // 5 — window.__I18N blob
    const bm = html.match(/<script>window\.__I18N = ([\s\S]*?)<\/script>/);
    let blob = null;
    try { blob = bm ? JSON.parse(bm[1]) : null; } catch { blob = null; }
    check('5-blob', !!blob, `${id}: __I18N blob missing or unparsable`);
    if (blob) {
      check('5-blob', blob.locale === l.code, `${id}: blob.locale=${blob.locale}`);
      check('5-blob', blob.dir === l.dir, `${id}: blob.dir=${blob.dir}`);
      for (const g of REQUIRED_GROUPS) {
        check('5-blob', blob[g] && typeof blob[g] === 'object' && Object.keys(blob[g]).length > 0, `${id}: blob missing group ${g}`);
      }
    }

    // 6 — JSON-LD parses; FAQPage inLanguage correct
    const ldMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    check('6-jsonld', ldMatches.length > 0, `${id}: no JSON-LD blocks`);
    let faqSeen = false;
    for (const [i, lm] of ldMatches.entries()) {
      let obj = null;
      try { obj = JSON.parse(lm[1]); } catch { /* handled below */ }
      check('6-jsonld', !!obj, `${id}: JSON-LD block #${i + 1} does not parse`);
      if (obj && obj['@type'] === 'FAQPage') {
        faqSeen = true;
        check('6-jsonld', obj.inLanguage === l.htmlLang, `${id}: FAQPage inLanguage=${obj.inLanguage} (want ${l.htmlLang})`);
      }
      if (obj && obj['@type'] === 'WebPage') {
        check('6-jsonld', obj.inLanguage === l.htmlLang && obj.url === p.url, `${id}: WebPage inLanguage/url not localized`);
      }
    }
    check('6-jsonld', faqSeen, `${id}: no FAQPage block found`);
  }
}

/* ---------- EN diff invariant ---------- */
const isHreflangLine = (line) => /^\s*<link rel="alternate" hreflang="[^"]+" href="[^"]+">\s*$/.test(line);
function enDiff(distFile, baselineFile, label) {
  if (!existsSync(baselineFile)) { check('7-en-diff', false, `${label}: baseline missing at ${baselineFile}`); return; }
  const dist = readFileSync(distFile, 'utf8').split('\n');
  // baseline may be pre- or post-i18n: strip hreflang from both sides before comparing
  const base = readFileSync(baselineFile, 'utf8').split('\n').filter((line) => !isHreflangLine(line));
  const removed = dist.filter(isHreflangLine);
  const kept = dist.filter((line) => !isHreflangLine(line));
  check('7-en-diff', removed.length === 15, `${label}: expected 15 hreflang lines in EN page, found ${removed.length}`);
  const same = kept.length === base.length && kept.every((line, i) => line === base[i]);
  if (!same) {
    let firstDiff = 'length mismatch';
    for (let i = 0; i < Math.max(kept.length, base.length); i++) {
      if (kept[i] !== base[i]) { firstDiff = `line ${i + 1}: "${(kept[i] || '').slice(0, 80)}" vs baseline "${(base[i] || '').slice(0, 80)}"`; break; }
    }
    check('7-en-diff', false, `${label}: non-hreflang difference — ${firstDiff}`);
  } else {
    check('7-en-diff', true);
  }
}
enDiff(join(DIST, 'index.html'), join(BASELINE_DIR, 'index.html'), 'dist/index.html');
enDiff(join(DIST, 'consultation', 'index.html'), join(BASELINE_DIR, 'consultation.html'), 'dist/consultation/index.html');

// sitemap: multilingual format — structural assertions (not a baseline diff).
{
  const xml = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
  const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) || [];
  const locs = urlBlocks.map((b) => (b.match(/<loc>([^<]+)<\/loc>/) || [])[1]);
  const expected = [
    `${SITE_URL}/`, ...LOCALES.map((l) => `${SITE_URL}/${l.code}/`),
    `${SITE_URL}/consultation/`, ...LOCALES.map((l) => `${SITE_URL}/${l.code}/consultation/`)
  ];
  check('7-en-diff', locs.length === expected.length && expected.every((u) => locs.includes(u)),
    `sitemap: loc set mismatch (${locs.length} urls, want ${expected.length})`);
  check('7-en-diff', !xml.includes(`${SITE_URL}/reviews/`), 'sitemap: must not list non-canonical /reviews/');
  const badAlt = urlBlocks.filter((b) => (b.match(/<xhtml:link /g) || []).length !== 15);
  check('7-en-diff', badAlt.length === 0, `sitemap: ${badAlt.length} url blocks without exactly 15 xhtml:link alternates`);
  check('7-en-diff', xml.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'), 'sitemap: missing xhtml namespace');
}

/* ---------- review-text translations (locale pages only) ---------- */
for (const l of LOCALES) {
  const home = readFileSync(join(DIST, l.code, 'index.html'), 'utf8');
  check('8-reviews-i18n', home.includes('class="translation-note"'), `${l.code}: translation note missing`);
  const toggles = (home.match(/rc-orig-toggle/g) || []).length;
  check('8-reviews-i18n', toggles >= 3, `${l.code}: only ${toggles} auto-translated toggles server-rendered (want ≥3)`);
  check('8-reviews-i18n', home.includes('localizedText'), `${l.code}: reviews island missing localizedText`);
}
{
  const enHome = readFileSync(join(DIST, 'index.html'), 'utf8');
  check('8-reviews-i18n',
    !enHome.includes('rc-orig-toggle') && !enHome.includes('translation-note') && !enHome.includes('localizedText'),
    'EN page must not contain the review-translation overlay');
}

/* ---------- report ---------- */
console.log('\ni18n verification results');
console.log('─'.repeat(60));
let totalPass = 0, totalFail = 0;
for (const [name, c] of Object.entries(counts).sort()) {
  totalPass += c.pass; totalFail += c.fail;
  console.log(`  ${c.fail === 0 ? '✓' : '✗'} ${name.padEnd(16)} pass ${String(c.pass).padStart(4)}   fail ${c.fail}`);
}
console.log('─'.repeat(60));
console.log(`  TOTAL: ${totalPass} passed, ${totalFail} failed  (${LOCALES.length} locales × 2 pages + EN diff)`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures.slice(0, 60)) console.log('  - ' + f);
  if (failures.length > 60) console.log(`  … and ${failures.length - 60} more`);
  process.exit(1);
}
console.log('\nAll green.');
