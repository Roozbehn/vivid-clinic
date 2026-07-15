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
console.log('review-url tests ok');
