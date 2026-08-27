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

import { writeFileSync, existsSync, readFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { ROOT, DATA_DIR } from './lib.mjs';

const MEDIA_PATH = join(DATA_DIR, 'google-media.json');
const GOOGLE_CDN = /^https:\/\/[a-z0-9.-]*googleusercontent\.com\//i;

// ── Self-hosting ─────────────────────────────────────────────────────────────
// Google's media/customers endpoint returns SHORT-LIVED SIGNED URLs
// (lh3.googleusercontent.com/gpms-cs-s/…). They start returning HTTP 403 within
// weeks, which silently breaks every gallery image on the deployed site.
// So we do not hot-link them: we download the bytes here, while the URLs are
// still valid, and the site serves its own copies from /assets/gbp/.
// The remote URLs are still recorded for provenance, but are never rendered.
const MEDIA_ASSET_DIR = join(ROOT, 'src', 'assets', 'gbp');
const MEDIA_ASSET_REL = 'assets/gbp';           // public path, relative to site root
const FULL_SIZE = 1600;                          // lightbox / click-through
const GRID_SIZE = 640;                           // gallery grid (2x of ~320 CSS px)

// Rewrite Google's size suffix (`=s0`, `=s300`, `=s640-c` …) to the size we want.
const sized = (url, px) => /=s\d+(-[a-z0-9]+)*$/i.test(url)
  ? url.replace(/=s\d+(-[a-z0-9]+)*$/i, `=s${px}`)
  : `${url}=s${px}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Google's CDN rate-limits bulk downloads (HTTP 429). Without a retry, a photo
// that gets throttled would silently vanish from the gallery, so back off and
// try again before giving up on it.
async function download(url, attempt = 1) {
  const MAX_ATTEMPTS = 4;
  let res;
  try {
    res = await fetch(url);
  } catch (err) {
    if (attempt >= MAX_ATTEMPTS) throw err;
    await sleep(attempt * 2000);
    return download(url, attempt + 1);
  }
  if (res.status === 429 || res.status >= 500) {
    if (attempt >= MAX_ATTEMPTS) throw new Error(`HTTP ${res.status} after ${MAX_ATTEMPTS} attempts`);
    const retryAfter = Number(res.headers.get('retry-after')) || 0;
    await sleep(Math.max(retryAfter * 1000, attempt * 3000));
    return download(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get('content-type') || '';
  if (!/^image\//i.test(type)) throw new Error(`not an image (${type || 'no content-type'})`);
  return Buffer.from(await res.arrayBuffer());
}

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

    // Deterministic dedupe (hash of the full-size bytes, first occurrence wins)
    // + download to src/assets/gbp/ so the site never depends on Google's
    // expiring signed URLs.
    console.log(`→ Downloading and deduplicating ${photos.length} photo(s)…`);
    mkdirSync(MEDIA_ASSET_DIR, { recursive: true });
    const seen = new Set();
    const keptFiles = new Set();
    const items = [];
    let failed = 0;
    for (const m of photos) {
      const source = m.googleUrl || m.thumbnailUrl;
      try {
        const fullBuf = await download(sized(source, FULL_SIZE));
        const hash = createHash('sha256').update(fullBuf).digest('hex');
        if (seen.has(hash)) continue;
        seen.add(hash);

        const id = ((m.name || '').split('/').pop() || hash.slice(0, 16)).replace(/[^A-Za-z0-9_-]/g, '');
        // Hash suffix = cache-busting: if Google ever swaps the bytes behind a
        // media id, the filename changes and no stale copy can be served.
        const stem = `${id}-${hash.slice(0, 8)}`;
        const fullName = `${stem}.jpg`;
        const gridName = `${stem}-${GRID_SIZE}.jpg`;

        await sleep(250);                       // be a polite client
        const gridBuf = await download(sized(source, GRID_SIZE));
        await sleep(250);
        writeFileSync(join(MEDIA_ASSET_DIR, fullName), fullBuf);
        writeFileSync(join(MEDIA_ASSET_DIR, gridName), gridBuf);
        keptFiles.add(fullName);
        keptFiles.add(gridName);

        items.push({
          id,
          // Local, self-hosted copies — these are what the site renders.
          file: `${MEDIA_ASSET_REL}/${fullName}`,
          grid: `${MEDIA_ASSET_REL}/${gridName}`,
          bytes: fullBuf.length,
          sha256: hash,
          // Provenance only. These Google URLs expire (HTTP 403) — never render them.
          photoUrl: m.googleUrl,
          thumbnailUrl: m.thumbnailUrl || m.googleUrl,
          uploader: m.attribution?.profileName || '',
          createdAt: m.createTime || null,
          width: m.dimensions?.widthPixels || null,
          height: m.dimensions?.heightPixels || null
        });
      } catch (err) {
        // Unreadable photo → skip the item rather than fail the whole import,
        // but say so: a silent skip is how a gallery quietly shrinks.
        failed++;
        console.warn(`  ! skipped ${(m.name || '').split('/').pop() || 'photo'}: ${err.message}`);
      }
    }

    // Prune orphaned files from previous imports so the repo does not accumulate
    // copies of photos the clinic's listing no longer shows.
    let pruned = 0;
    for (const f of readdirSync(MEDIA_ASSET_DIR)) {
      if (f === '.gitkeep' || keptFiles.has(f)) continue;
      unlinkSync(join(MEDIA_ASSET_DIR, f));
      pruned++;
    }

    const out = {
      meta: {
        source: 'Google Business Profile API (media/customers)',
        lastImportedAt: new Date().toISOString(),
        locationResource: `accounts/${loc.accountId}/locations/${loc.locationId}`,
        notes: 'Customer-uploaded photos from the public Google listing. The API provides no review linkage; the site must never attribute a photo to a specific review.',
        hosting: `Photo bytes are downloaded at import time and served from /${MEDIA_ASSET_REL}/. The photoUrl/thumbnailUrl fields are Google signed URLs kept for provenance only — they expire (HTTP 403) and must never be rendered.`
      },
      items
    };
    writeFileSync(MEDIA_PATH, JSON.stringify(out, null, 2) + '\n');
    const mb = (items.reduce((n, i) => n + (i.bytes || 0), 0) / 1048576).toFixed(1);
    console.log(`\n✓ Imported ${items.length} unique photo(s) (${photos.length - items.length - failed} duplicate, ${failed} unreadable, dropped).`);
    console.log(`  Downloaded to src/${MEDIA_ASSET_REL}/ — ${items.length * 2} file(s), ${mb} MB full-size${pruned ? `; pruned ${pruned} orphan(s)` : ''}.`);
    console.log(`  Written to ${MEDIA_PATH}\n`);
  } catch (err) {
    fail('Media import failed.\n  ' + err.message);
  }
})();
