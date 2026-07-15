/** Pure helpers for review filter query params. Keep in sync with src/js/reviews.js. */

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
    query: q.slice(0, 120),
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
