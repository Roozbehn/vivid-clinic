#!/usr/bin/env node
// Recompute derived summary stats from the reviews array and rewrite the
// `summary` block in google-reviews.json. Useful after a manual edit/import,
// or to refresh relativeDate-independent aggregates. Prints a readable report.

import { writeFileSync } from 'node:fs';
import { REVIEWS_PATH, readJson, computeSummary, computeThemes } from './lib.mjs';

const data = readJson(REVIEWS_PATH);
const reviews = data.reviews || [];
const computed = computeSummary(reviews);

// Preserve official API totals if they are larger (rating-only reviews).
const merged = { ...computed };
if (data.summary?.totalReviewCount > computed.totalReviewCount) {
  merged.totalReviewCount = data.summary.totalReviewCount;
}
if (data.summary?.averageRating && reviews.length === 0) {
  merged.averageRating = data.summary.averageRating;
}

data.summary = merged;
writeFileSync(REVIEWS_PATH, JSON.stringify(data, null, 2) + '\n');

const themes = computeThemes(reviews);
console.log('Review summary');
console.log('──────────────');
console.log(`  Total (official):  ${merged.totalReviewCount}`);
console.log(`  With text/rating:  ${reviews.length}`);
console.log(`  Average rating:    ${merged.averageRating}★`);
console.log(`  5-star share:      ${merged.fiveStarPercentage}%`);
console.log(`  Distribution:      5:${merged.ratingDistribution[5]} 4:${merged.ratingDistribution[4]} 3:${merged.ratingDistribution[3]} 2:${merged.ratingDistribution[2]} 1:${merged.ratingDistribution[1]}`);
console.log(`  With owner reply:  ${merged.reviewsWithOwnerReply}`);
console.log(`  Languages:         ${Object.entries(merged.languageDistribution).map(([k, v]) => `${k}:${v}`).join(' ') || '—'}`);
console.log(`  Latest review:     ${merged.latestReviewDate || '—'}`);
console.log(`  Themes present:    ${themes.map((t) => `${t.label} (${t.count})`).join(', ') || '—'}`);
console.log('✓ summary written.');
