#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Import Vivid Clinic reviews from the AUTHORIZED Google Business Profile API.
//
// Compliance:
//   • Uses the official GBP API only (no scraping of Maps/GBP pages).
//   • Preserves original text, reviewer display name, rating, dates, source.
//   • Keeps Google translations as a separate, labeled field — never replaces
//     the original.
//   • Writes nothing fabricated. If 0 reviews are returned, it writes an empty
//     dataset and the site renders its empty state.
//
// Credentials: see .env.example and README-reviews.md.
// Reviews live on the legacy My Business API v4 reviews endpoint.
// ─────────────────────────────────────────────────────────────────────────────

import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ROOT, REVIEWS_PATH, readJson,
  starRatingToInt, parseTranslation, detectLanguage, deriveTags,
  computeSummary, fallbackId
} from './lib.mjs';

// Minimal .env loader (no dependency).
function loadEnv() {
  const envPath = join(ROOT, '.env');
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in process.env)) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
  }
}
loadEnv();

const {
  GBP_CLIENT_ID, GBP_CLIENT_SECRET, GBP_REFRESH_TOKEN,
  GBP_ACCOUNT_ID, GBP_LOCATION_ID, GBP_LOCATION_TITLE = 'Vivid Clinic'
} = process.env;

function fail(msg) {
  console.error('\n✖ ' + msg + '\n');
  process.exit(1);
}

if (!GBP_CLIENT_ID || !GBP_CLIENT_SECRET || !GBP_REFRESH_TOKEN) {
  fail(
    'Missing Google Business Profile credentials.\n' +
    '  Copy .env.example → .env and set GBP_CLIENT_ID, GBP_CLIENT_SECRET, GBP_REFRESH_TOKEN.\n' +
    '  Full setup: README-reviews.md → "Getting Google Business Profile API credentials".\n' +
    '  Until then the site renders its empty state (no fake reviews) — that is by design.'
  );
}

async function api(url, token, { method = 'GET' } = {}) {
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${method} ${url}\n  → HTTP ${res.status}: ${body.slice(0, 600)}`);
  }
  return res.json();
}

async function getAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GBP_CLIENT_ID,
      client_secret: GBP_CLIENT_SECRET,
      refresh_token: GBP_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    })
  });
  if (!res.ok) {
    throw new Error(`Token refresh failed: HTTP ${res.status}: ${(await res.text()).slice(0, 400)}`);
  }
  const json = await res.json();
  if (!json.access_token) throw new Error('Token refresh returned no access_token.');
  return json.access_token;
}

async function resolveAccount(token) {
  if (GBP_ACCOUNT_ID) return GBP_ACCOUNT_ID.startsWith('accounts/') ? GBP_ACCOUNT_ID : `accounts/${GBP_ACCOUNT_ID}`;
  const data = await api('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', token);
  const accounts = data.accounts || [];
  if (!accounts.length) throw new Error('No GBP accounts visible to this credential.');
  console.log(`  Found ${accounts.length} account(s); using "${accounts[0].accountName || accounts[0].name}".`);
  return accounts[0].name; // accounts/{id}
}

async function resolveLocation(token, account) {
  if (GBP_LOCATION_ID) {
    const lid = GBP_LOCATION_ID.replace(/^.*locations\//, '');
    return { accountId: account.replace('accounts/', ''), locationId: lid, title: GBP_LOCATION_TITLE };
  }
  const readMask = 'name,title';
  let pageToken = '';
  const locations = [];
  do {
    const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${account}/locations` +
      `?readMask=${readMask}&pageSize=100${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const data = await api(url, token);
    locations.push(...(data.locations || []));
    pageToken = data.nextPageToken || '';
  } while (pageToken);

  if (!locations.length) throw new Error('Account has no locations.');
  const match = locations.find(
    (l) => (l.title || '').toLowerCase().trim() === GBP_LOCATION_TITLE.toLowerCase().trim()
  ) || locations[0];
  const locationId = (match.name || '').replace(/^.*locations\//, '');
  console.log(`  Using location "${match.title}" (locations/${locationId}).`);
  return { accountId: account.replace('accounts/', ''), locationId, title: match.title };
}

async function fetchAllReviews(token, accountId, locationId) {
  const base = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews`;
  const all = [];
  let pageToken = '';
  let totalReviewCount = null;
  let averageRating = null;
  do {
    const url = `${base}?pageSize=50&orderBy=updateTime desc${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const data = await api(url, token);
    if (totalReviewCount === null && typeof data.totalReviewCount === 'number') totalReviewCount = data.totalReviewCount;
    if (averageRating === null && typeof data.averageRating === 'number') averageRating = data.averageRating;
    all.push(...(data.reviews || []));
    pageToken = data.nextPageToken || '';
    process.stdout.write(`\r  Fetched ${all.length}${totalReviewCount ? ' / ' + totalReviewCount : ''} reviews…`);
  } while (pageToken);
  process.stdout.write('\n');
  return { reviews: all, totalReviewCount, averageRating };
}

function normalize(raw) {
  const { originalText, translatedText } = parseTranslation(raw.comment);
  const langBasis = originalText || translatedText;
  const lang = detectLanguage(langBasis);
  const rating = starRatingToInt(raw.starRating);
  const reviewerName = raw.reviewer?.displayName || 'Google user';
  const publishedAt = raw.createTime || null;
  const id = raw.reviewId || raw.name?.split('/').pop() ||
    fallbackId({ reviewerName, rating, publishedAt, originalText });
  // Public Google profile photo shown beside the review on Maps. Only accept
  // Google's own CDN so nothing else can ever be injected into an <img src>.
  const rawPhoto = raw.reviewer?.profilePhotoUrl || '';
  const reviewerPhotoUrl = /^https:\/\/[a-z0-9.-]*googleusercontent\.com\//i.test(rawPhoto) ? rawPhoto : '';
  return {
    id,
    source: 'Google Business Profile',
    reviewerName,
    reviewerPhotoUrl,
    rating,
    originalText,
    translatedText,
    originalLanguage: lang.code,
    publishedAt,
    updatedAt: raw.updateTime || null,
    relativeDate: '', // computed at build time
    ownerReply: raw.reviewReply?.comment || '',
    ownerReplyAt: raw.reviewReply?.updateTime || null,
    reviewUrl: '',
    isFeatured: false,
    tags: deriveTags(`${originalText} ${translatedText}`)
  };
}

function dedupe(reviews) {
  const seen = new Set();
  const out = [];
  for (const r of reviews) {
    const key = r.id;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

(async () => {
  try {
    console.log('→ Authenticating with Google Business Profile API…');
    const token = await getAccessToken();

    console.log('→ Resolving account & location…');
    const account = await resolveAccount(token);
    const { accountId, locationId, title } = await resolveLocation(token, account);

    console.log('→ Fetching reviews (paginated)…');
    const { reviews: raw, totalReviewCount, averageRating } = await fetchAllReviews(token, accountId, locationId);

    let normalized = dedupe(raw.map(normalize));
    // Newest first by published date.
    normalized.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));

    const summary = computeSummary(normalized);
    // Trust the API's official totals when present (they include rating-only reviews).
    if (typeof totalReviewCount === 'number' && totalReviewCount > 0) summary.totalReviewCount = totalReviewCount;
    if (typeof averageRating === 'number' && averageRating > 0) {
      summary.averageRating = Math.round(averageRating * 10) / 10;
    }

    const out = {
      meta: {
        source: 'Google Business Profile API',
        sourceComplete: true,
        lastImportedAt: new Date().toISOString(),
        locationResource: `accounts/${accountId}/locations/${locationId}`,
        locationTitle: title,
        generator: 'import-google-reviews.mjs',
        notes: 'Imported from the official Google Business Profile API. Original text, names, ratings and dates preserved verbatim. Google translations stored separately.'
      },
      summary,
      reviews: normalized
    };

    writeFileSync(REVIEWS_PATH, JSON.stringify(out, null, 2) + '\n');
    console.log(`\n✓ Imported ${normalized.length} review(s) with text/ratings.`);
    console.log(`  Official total: ${summary.totalReviewCount} · average ${summary.averageRating}★`);
    console.log(`  Written to ${REVIEWS_PATH}`);
    console.log('  Next: `npm run validate` then `npm run build`.\n');
  } catch (err) {
    fail('Import failed.\n  ' + err.message);
  }
})();
