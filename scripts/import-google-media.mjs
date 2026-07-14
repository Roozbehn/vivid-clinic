#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Import customer-uploaded photos from the AUTHORIZED Google Business Profile
// API (v4 media/customers endpoint) → src/data/google-media.json.
//
// Compliance:
//   • Official API only — no scraping.
//   • These are photos customers posted publicly on the Google listing. The API
//     provides NO review linkage, so the site presents them as a standalone
//     "photos from patients on Google" gallery and NEVER claims a photo belongs
//     to a specific review.
//   • Uploader attribution is preserved exactly as Google provides it.
//   • Only googleusercontent.com URLs are accepted (same allowlist as avatars).
//   • Byte-identical duplicates are dropped deterministically (content hash),
//     so re-uploads of the same photo never show twice.
//
// Credentials: same .env as import-google-reviews.mjs.
// ─────────────────────────────────────────────────────────────────────────────

import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { ROOT, DATA_DIR } from './lib.mjs';

const MEDIA_PATH = join(DATA_DIR, 'google-media.json');
const GOOGLE_CDN = /^https:\/\/[a-z0-9.-]*googleusercontent\.com\//i;

function loadEnv() {
  const envPath = join(ROOT, '.env');
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}
loadEnv();

const { GBP_CLIENT_ID, GBP_CLIENT_SECRET, GBP_REFRESH_TOKEN } = process.env;

function fail(msg) { console.error('\n✖ ' + msg + '\n'); process.exit(1); }
if (!GBP_CLIENT_ID || !GBP_CLIENT_SECRET || !GBP_REFRESH_TOKEN) {
  fail('Missing GBP credentials in .env (see import-google-reviews.mjs / README-reviews.md).');
}

async function getAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GBP_CLIENT_ID, client_secret: GBP_CLIENT_SECRET,
      refresh_token: GBP_REFRESH_TOKEN, grant_type: 'refresh_token'
    })
  });
  if (!res.ok) throw new Error(`Token refresh failed: HTTP ${res.status}`);
  const json = await res.json();
  if (!json.access_token) throw new Error('No access_token in refresh response.');
  return json.access_token;
}

// Resolve account/location the same way the review importer does (reads the
// locationResource the review import recorded, to avoid a second discovery pass).
function knownLocation() {
  const reviewsPath = join(DATA_DIR, 'google-reviews.json');
  if (existsSync(reviewsPath)) {
    const meta = JSON.parse(readFileSync(reviewsPath, 'utf8')).meta || {};
    const m = (meta.locationResource || '').match(/^accounts\/(\d+)\/locations\/(\d+)$/);
    if (m) return { accountId: m[1], locationId: m[2] };
  }
  return null;
}

(async () => {
  try {
    console.log('→ Authenticating with Google Business Profile API…');
    const token = await getAccessToken();
    const loc = knownLocation();
    if (!loc) fail('No locationResource in google-reviews.json — run `npm run import` first.');

    console.log('→ Fetching customer media…');
    const base = `https://mybusiness.googleapis.com/v4/accounts/${loc.accountId}/locations/${loc.locationId}/media/customers`;
    const all = [];
    let pageToken = '';
    do {
      const url = `${base}?pageSize=100${pageToken ? `&pageToken=${pageToken}` : ''}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`GET media/customers → HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const data = await res.json();
      all.push(...(data.mediaItems || []));
      pageToken = data.nextPageToken || '';
    } while (pageToken);

    // Photos only, Google CDN only.
    const photos = all.filter((m) =>
      (m.mediaFormat === 'PHOTO') &&
      GOOGLE_CDN.test(m.googleUrl || '') &&
      GOOGLE_CDN.test(m.thumbnailUrl || m.googleUrl || ''));

    // Deterministic dedupe: hash thumbnail bytes, keep first occurrence.
    console.log(`→ Deduplicating ${photos.length} photo(s) by content hash…`);
    const seen = new Set();
    const items = [];
    for (const m of photos) {
      try {
        const r = await fetch(m.thumbnailUrl || m.googleUrl);
        const buf = Buffer.from(await r.arrayBuffer());
        const hash = createHash('sha256').update(buf).digest('hex');
        if (seen.has(hash)) continue;
        seen.add(hash);
        items.push({
          id: (m.name || '').split('/').pop() || hash.slice(0, 16),
          photoUrl: m.googleUrl,
          thumbnailUrl: m.thumbnailUrl || m.googleUrl,
          uploader: m.attribution?.profileName || '',
          createdAt: m.createTime || null,
          width: m.dimensions?.widthPixels || null,
          height: m.dimensions?.heightPixels || null
        });
      } catch {
        // unreadable thumbnail → skip item rather than fail the import
      }
    }

    const out = {
      meta: {
        source: 'Google Business Profile API (media/customers)',
        lastImportedAt: new Date().toISOString(),
        locationResource: `accounts/${loc.accountId}/locations/${loc.locationId}`,
        notes: 'Customer-uploaded photos from the public Google listing. The API provides no review linkage; the site must never attribute a photo to a specific review.'
      },
      items
    };
    writeFileSync(MEDIA_PATH, JSON.stringify(out, null, 2) + '\n');
    console.log(`\n✓ Imported ${items.length} unique photo(s) (${photos.length - items.length} duplicate/unreadable dropped).`);
    console.log(`  Written to ${MEDIA_PATH}\n`);
  } catch (err) {
    fail('Media import failed.\n  ' + err.message);
  }
})();
