#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Fallback importer: normalize an AUTHORIZED review export (CSV / JSON / XLSX)
// into src/data/google-reviews.json — the same schema the GBP API importer writes.
//
//   node scripts/import-export.mjs <file> [--source "Google Business Profile"] [--complete]
//
// Use this only with a review export the business owner is authorized to use
// (e.g. from the GBP dashboard, a third-party tool already connected by the owner).
// This script NEVER scrapes Google Maps and NEVER fabricates reviews — it only
// reshapes data you already have.
//
// Column names are matched flexibly (case/space-insensitive) against common
// synonyms. The script prints exactly which columns it mapped so you can correct
// the export if something is off.
// ─────────────────────────────────────────────────────────────────────────────

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { extname } from 'node:path';
import {
  REVIEWS_PATH, computeSummary,
  parseTranslation, detectLanguage, deriveTags, starRatingToInt, fallbackId
} from './lib.mjs';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const source = args.includes('--source') ? args[args.indexOf('--source') + 1] : 'Manual export';
const complete = args.includes('--complete');

function fail(msg) { console.error('\n✖ ' + msg + '\n'); process.exit(1); }

if (!file) {
  fail('Usage: node scripts/import-export.mjs <file.csv|file.json|file.xlsx> [--source "..."] [--complete]\n' +
       '  See README-reviews.md → "Authorized export fallback".');
}
if (!existsSync(file)) fail(`File not found: ${file}`);

/* ---------------- flexible column mapping ---------------- */
const norm = (s) => String(s || '').toLowerCase().replace(/[\s_\-./]+/g, '');
const SYNONYMS = {
  id: ['id', 'reviewid', 'reviewidentifier', 'reviewname'],
  reviewerName: ['reviewername', 'name', 'reviewer', 'author', 'authorname', 'customer', 'customername', 'displayname', 'fullname', 'user', 'username'],
  rating: ['rating', 'stars', 'star', 'score', 'ratingvalue', 'starrating', 'rate', 'overall'],
  originalText: ['originaltext', 'text', 'review', 'reviewtext', 'comment', 'content', 'body', 'message', 'feedback', 'reviewbody'],
  translatedText: ['translatedtext', 'translation', 'translated', 'translatedcomment', 'english', 'translatedreview'],
  originalLanguage: ['originallanguage', 'language', 'lang', 'locale'],
  publishedAt: ['publishedat', 'date', 'time', 'published', 'createtime', 'created', 'createdat', 'datetime', 'reviewdate', 'posted', 'postedon', 'timestamp'],
  updatedAt: ['updatedat', 'updated', 'updatetime', 'modified', 'lastupdated'],
  ownerReply: ['ownerreply', 'reply', 'response', 'ownerresponse', 'replytext', 'businessreply', 'replycomment'],
  ownerReplyAt: ['ownerreplyat', 'replydate', 'responsedate', 'replytime'],
  reviewUrl: ['reviewurl', 'url', 'link', 'permalink'],
  isFeatured: ['isfeatured', 'featured', 'highlight', 'highlighted', 'pinned']
};

function buildHeaderMap(headers) {
  const normalized = headers.map((h) => ({ raw: h, n: norm(h) }));
  const map = {};
  for (const [field, syns] of Object.entries(SYNONYMS)) {
    const hit = normalized.find((h) => syns.includes(h.n));
    if (hit) map[field] = hit.raw;
  }
  return map;
}

/* ---------------- value parsers ---------------- */
function parseRating(v) {
  if (typeof v === 'number') return Math.max(0, Math.min(5, Math.round(v)));
  const s = String(v ?? '').trim();
  if (!s) return 0;
  const enumVal = starRatingToInt(s.toUpperCase());
  if (enumVal) return enumVal;
  const starGlyphs = (s.match(/[★⭐]/g) || []).length;
  if (starGlyphs) return Math.min(5, starGlyphs);
  const m = s.match(/([0-5])(?:[.,]\d+)?/);
  if (m) return Math.max(0, Math.min(5, Math.round(parseFloat(m[1]))));
  return 0;
}
function toIso(v) {
  const s = String(v ?? '').trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d) ? null : d.toISOString();
}
const LANG_NAME_TO_CODE = { english: 'en', turkish: 'tr', türkçe: 'tr', arabic: 'ar', german: 'de', deutsch: 'de', french: 'fr', français: 'fr', spanish: 'es', español: 'es', russian: 'ru', greek: 'el', chinese: 'zh' };
function normLang(v, text) {
  const s = String(v ?? '').trim().toLowerCase();
  if (!s) return detectLanguage(text).code;
  if (/^[a-z]{2}$/.test(s)) return s;
  return LANG_NAME_TO_CODE[s] || detectLanguage(text).code;
}
const truthy = (v) => /^(1|true|yes|y|featured|✓)$/i.test(String(v ?? '').trim());

/* ---------------- CSV parser (quotes, commas, newlines in fields) ---------------- */
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  text = text.replace(/^﻿/, ''); // strip BOM
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (ch === '\r') { /* ignore, handled by \n */ }
    else field += ch;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1)
    .filter((r) => r.some((c) => String(c).trim() !== ''))
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
}

/* ---------------- load rows from file ---------------- */
async function loadRows(path) {
  const ext = extname(path).toLowerCase();
  if (ext === '.json') {
    const parsed = JSON.parse(readFileSync(path, 'utf8'));
    const arr = Array.isArray(parsed) ? parsed : (parsed.reviews || []);
    if (!Array.isArray(arr)) fail('JSON must be an array of reviews or an object with a "reviews" array.');
    return arr;
  }
  if (ext === '.csv' || ext === '.tsv') {
    return parseCsv(readFileSync(path, 'utf8'));
  }
  if (ext === '.xlsx' || ext === '.xls') {
    let XLSX;
    try { XLSX = await import('xlsx'); }
    catch {
      fail('XLSX support needs the optional "xlsx" package.\n' +
           '  Either run:  npm install xlsx   then re-run this command,\n' +
           '  or open the file and "Save As / Export" to CSV and pass the .csv instead.');
    }
    const wb = XLSX.read(readFileSync(path));
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { defval: '' });
  }
  fail(`Unsupported file type "${ext}". Use .csv, .json, or .xlsx.`);
}

/* ---------------- normalize ---------------- */
function normalizeRow(row, headerMap) {
  const get = (field) => {
    // JSON rows may already use canonical keys; otherwise use the mapped header.
    if (field in row) return row[field];
    const col = headerMap[field];
    return col != null ? row[col] : undefined;
  };
  const ratingRaw = get('rating');
  const rating = parseRating(ratingRaw);

  const textRaw = get('originalText');
  const translatedRaw = get('translatedText');
  let originalText = String(textRaw ?? '').trim();
  let translatedText = String(translatedRaw ?? '').trim();
  if (!translatedText && /\(Translated by Google\)/i.test(originalText)) {
    const parsed = parseTranslation(originalText);
    originalText = parsed.originalText;
    translatedText = parsed.translatedText;
  }

  const reviewerName = String(get('reviewerName') ?? '').trim() || 'Google user';
  const publishedAt = toIso(get('publishedAt'));
  const lang = normLang(get('originalLanguage'), originalText || translatedText);
  const id = String(get('id') ?? '').trim() || fallbackId({ reviewerName, rating, publishedAt, originalText });

  return {
    id,
    source,
    reviewerName,
    rating,
    originalText,
    translatedText,
    originalLanguage: lang,
    publishedAt,
    updatedAt: toIso(get('updatedAt')),
    relativeDate: publishedAt ? '' : String(get('publishedAt') ?? '').trim(), // keep relative text if no timestamp
    ownerReply: String(get('ownerReply') ?? '').trim(),
    ownerReplyAt: toIso(get('ownerReplyAt')),
    reviewUrl: String(get('reviewUrl') ?? '').trim(),
    isFeatured: truthy(get('isFeatured')),
    tags: deriveTags(`${originalText} ${translatedText}`)
  };
}

/* ---------------- run ---------------- */
(async () => {
  const rows = await loadRows(file);
  if (!rows.length) fail('No rows found in the file.');

  const headers = Object.keys(rows[0] || {});
  const headerMap = buildHeaderMap(headers);
  console.log('→ Detected columns:');
  for (const field of Object.keys(SYNONYMS)) {
    const mapped = headerMap[field] || (field in (rows[0] || {}) ? field : null);
    if (mapped) console.log(`    ${field.padEnd(16)} ← "${mapped}"`);
  }
  if (!headerMap.rating && !('rating' in (rows[0] || {}))) {
    fail('Could not find a rating column. Rename your rating column to "rating" (or stars/score) and retry.');
  }

  const warnings = [];
  const normalized = [];
  const seen = new Set();
  rows.forEach((row, i) => {
    const r = normalizeRow(row, headerMap);
    if (r.rating < 1 || r.rating > 5) { warnings.push(`row ${i + 2}: unparseable rating — skipped.`); return; }
    if (seen.has(r.id)) { warnings.push(`row ${i + 2}: duplicate id "${r.id}" — skipped.`); return; }
    seen.add(r.id);
    normalized.push(r);
  });

  normalized.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
  const summary = computeSummary(normalized);

  const out = {
    meta: {
      source,
      sourceComplete: complete,
      lastImportedAt: new Date().toISOString(),
      locationResource: null,
      generator: 'import-export.mjs',
      notes: `Normalized from authorized export "${file}". Original text/names/ratings/dates preserved as provided.` +
        (complete ? '' : ' Marked NOT complete — pass --complete only if this export is the full review set.')
    },
    summary,
    reviews: normalized
  };
  writeFileSync(REVIEWS_PATH, JSON.stringify(out, null, 2) + '\n');

  console.log(`\n✓ Normalized ${normalized.length} review(s) → ${REVIEWS_PATH}`);
  console.log(`  Average ${summary.averageRating}★ · 5★ ${summary.ratingDistribution[5]} 4★ ${summary.ratingDistribution[4]} 3★ ${summary.ratingDistribution[3]} 2★ ${summary.ratingDistribution[2]} 1★ ${summary.ratingDistribution[1]}`);
  console.log(`  With owner replies: ${summary.reviewsWithOwnerReply} · latest: ${summary.latestReviewDate || '—'} · complete set: ${complete ? 'yes' : 'NO (rating summary not authoritative)'}`);
  warnings.slice(0, 20).forEach((w) => console.warn('  ⚠ ' + w));
  if (warnings.length > 20) console.warn(`  …and ${warnings.length - 20} more warnings.`);
  console.log('\n  Next: `npm run validate` then `npm run build`.\n');
})();
