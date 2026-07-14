#!/usr/bin/env node
// Validate data/google-reviews.json: required fields, rating range, valid dates,
// duplicate ids, and summary consistency. Exits non-zero on any error so it can
// gate a build in CI. Warnings do not fail the build.

import { REVIEWS_PATH, readJson, computeSummary } from './lib.mjs';

const errors = [];
const warnings = [];

let data;
try {
  data = readJson(REVIEWS_PATH);
} catch (e) {
  console.error('✖ Cannot read/parse google-reviews.json:', e.message);
  process.exit(1);
}

if (!data || typeof data !== 'object') errors.push('Top-level value is not an object.');
const reviews = Array.isArray(data.reviews) ? data.reviews : (errors.push('`reviews` is not an array.'), []);

const ids = new Set();
const ISO = /^\d{4}-\d{2}-\d{2}/;

reviews.forEach((r, i) => {
  const at = `reviews[${i}]`;
  if (!r.id) errors.push(`${at}: missing id.`);
  else if (ids.has(r.id)) errors.push(`${at}: duplicate id "${r.id}".`);
  else ids.add(r.id);

  if (typeof r.reviewerName !== 'string' || !r.reviewerName.trim()) errors.push(`${at}: missing reviewerName.`);
  if (!Number.isInteger(r.rating) || r.rating < 1 || r.rating > 5) errors.push(`${at}: rating out of range (${r.rating}).`);
  if (typeof r.originalText !== 'string') errors.push(`${at}: originalText must be a string.`);
  if (!r.source) warnings.push(`${at}: missing source.`);
  if (r.publishedAt && !ISO.test(r.publishedAt)) warnings.push(`${at}: publishedAt is not ISO-like ("${r.publishedAt}").`);
  if (r.translatedText && !r.originalText) warnings.push(`${at}: has translation but empty original.`);
});

// Summary cross-check (uses computed values from text-bearing reviews;
// the official API total may legitimately exceed array length when rating-only
// reviews are not returned — flagged as info, not an error).
if (data.summary && reviews.length) {
  const computed = computeSummary(reviews);
  if (data.summary.averageRating && Math.abs(data.summary.averageRating - computed.averageRating) > 0.6) {
    warnings.push(`Summary averageRating (${data.summary.averageRating}) differs notably from computed (${computed.averageRating}).`);
  }
  if (data.summary.totalReviewCount < reviews.length) {
    errors.push(`summary.totalReviewCount (${data.summary.totalReviewCount}) < number of reviews (${reviews.length}).`);
  }
}

// Compliance tripwire: catch obvious placeholder/fake text if anyone hand-edits.
const PLACEHOLDER = /\b(lorem ipsum|placeholder|sample review|dummy|test review|john doe|jane doe)\b/i;
reviews.forEach((r, i) => {
  if (PLACEHOLDER.test(r.originalText) || PLACEHOLDER.test(r.reviewerName)) {
    errors.push(`reviews[${i}]: looks like placeholder/fake content ("${r.reviewerName}"). Reviews must be authentic.`);
  }
});

console.log(`Validated ${reviews.length} review(s).`);
warnings.forEach((w) => console.warn('  ⚠ ' + w));
if (errors.length) {
  console.error(`\n✖ ${errors.length} error(s):`);
  errors.forEach((e) => console.error('  • ' + e));
  process.exit(1);
}
console.log(reviews.length === 0
  ? '✓ Empty dataset is valid (site will render the empty state — no fake reviews).'
  : '✓ All checks passed.');
