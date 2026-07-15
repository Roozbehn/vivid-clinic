/* Vivid Clinic reviews — progressive enhancement.
   No framework, no dependencies. Server renders the first batch of cards (works
   with JS disabled); this script enables filtering, search, sort and load-more,
   and fires privacy-safe analytics events (no review text or names are sent).
   i18n: on localized pages the build injects window.__I18N with the catalog
   groups; every user-facing literal goes through T() with the English literal
   as fallback, so English pages (no blob) behave identically. */
(function () {
  'use strict';

  var root = document.getElementById('reviews-app');
  if (!root) return;
  var dataEl = document.getElementById('reviews-data');
  if (!dataEl) return;

  var REVIEWS = [];
  try { REVIEWS = JSON.parse(dataEl.textContent) || []; } catch (e) { return; }
  if (!REVIEWS.length) return;

  var INITIAL = parseInt(root.getAttribute('data-initial'), 10) || 12;
  var STEP = parseInt(root.getAttribute('data-step'), 10) || 12;

  var grid = document.getElementById('review-grid');
  var noResults = document.getElementById('no-results');
  var loadMoreBtn = document.getElementById('load-more');
  var loadMoreRow = document.getElementById('load-more-row');
  var countMeta = document.getElementById('filter-meta');

  var state = { rating: 'all', language: 'all', sort: 'featured', query: '', shown: INITIAL };

  /* ---------- URL sync helpers (keep in sync with scripts/lib-review-url.mjs) ---------- */
  function parseReviewParams(search) {
    var p = new URLSearchParams(typeof search === 'string' ? String(search).replace(/^\?/, '') : '');
    var rating = p.get('rating');
    var language = p.get('language');
    var sort = p.get('sort');
    var q = p.get('q') || '';
    var allowedRating = { all: 1, '5': 1, '4': 1, '3': 1 };
    var allowedSort = { featured: 1, newest: 1, detailed: 1, highest: 1 };
    return {
      rating: allowedRating[rating] ? rating : 'all',
      language: language && /^[a-z]{2}$/.test(language) ? language : 'all',
      sort: allowedSort[sort] ? sort : 'featured',
      query: q.slice(0, 120)
    };
  }
  function serializeReviewParams(s) {
    var p = new URLSearchParams();
    if (s.rating && s.rating !== 'all') p.set('rating', s.rating);
    if (s.language && s.language !== 'all') p.set('language', s.language);
    if (s.sort && s.sort !== 'featured') p.set('sort', s.sort);
    if (s.query) p.set('q', s.query);
    var qs = p.toString();
    return qs ? '?' + qs : '';
  }
  function writeUrl() {
    var qs = serializeReviewParams(state);
    var path = window.location.pathname + qs + window.location.hash;
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', path);
    }
  }
  function syncChips(selector, value) {
    var chips = root.querySelectorAll(selector);
    Array.prototype.forEach.call(chips, function (chip) {
      var on = chip.getAttribute('data-value') === value;
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
      chip.classList.toggle('is-active', on);
    });
  }

  /* ---------- i18n (English fallback when no blob is present) ---------- */
  var I18N = window.__I18N || null;
  function T(group, key, fb) {
    var g = I18N && I18N[group];
    var v = g ? g[key] : null;
    return v == null ? fb : v;
  }
  function TF(s, vars) {
    return String(s).replace(/\{(\w+)\}/g, function (m, k) { return vars && k in vars ? vars[k] : m; });
  }

  /* ---------- analytics (privacy-safe) ---------- */
  function track(event, params) {
    var payload = Object.assign({ event: event }, params || {});
    if (window.dataLayer && typeof window.dataLayer.push === 'function') window.dataLayer.push(payload);
    if (typeof window.gtag === 'function') window.gtag('event', event, params || {});
  }

  /* ---------- helpers ---------- */
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function initials(name) {
    var parts = String(name || '?').trim().split(/\s+/);
    return ((parts[0] || '')[0] || '?').toUpperCase() + (parts[1] ? parts[1][0].toUpperCase() : '');
  }
  function starsSvg(n) {
    n = Math.max(0, Math.min(5, parseInt(n, 10) || 0)); // coerce: never interpolate untrusted input
    var out = '<span class="stars stars--sm" role="img" aria-label="' +
      escapeHtml(TF(T('common', 'stars_aria', '{n} out of 5 stars'), { n: n })) + '">';
    for (var i = 1; i <= 5; i++) {
      out += '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="' + (i <= n ? 'full' : 'empty') +
        '" d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z"/></svg>';
    }
    return out + '</span>';
  }
  var LANG_LABEL = (I18N && I18N.language_names) ||
    { en: 'English', tr: 'Turkish', ar: 'Arabic', de: 'German', fr: 'French', es: 'Spanish', ru: 'Russian', el: 'Greek', zh: 'Chinese' };
  function langName(code) { return LANG_LABEL[code] || (code ? code : ''); }

  function safePhoto(u) {
    // Only Google's CDN may appear in an avatar <img>; anything else falls back to initials.
    return (typeof u === 'string' && /^https:\/\/[a-z0-9.-]*googleusercontent\.com\//i.test(u)) ? u : '';
  }
  function cardHtml(r) {
    var photo = safePhoto(r.reviewerPhotoUrl);
    var html = '<article class="review-card" tabindex="0">';
    html += '<div class="rc-head"><div class="rc-avatar" aria-hidden="true">' + escapeHtml(initials(r.reviewerName)) +
      (photo ? '<img src="' + escapeHtml(photo) + '" alt="" width="44" height="44" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">' : '') + '</div>';
    html += '<div><div class="rc-name">' + escapeHtml(r.reviewerName) + '</div>';
    html += '<div class="rc-date">' + escapeHtml(r.relativeDate || '') + '</div></div>';
    if (r.isFeatured) html += '<span class="featured-flag" style="margin-left:auto">' + escapeHtml(T('reviews_ui', 'card_featured_flag', 'Featured')) + '</span>';
    html += '</div>';
    html += '<div>' + starsSvg(r.rating) + '</div>';
    if (r.localizedText && r.localizedTranslated && r.originalText) {
      // Localized display text (locale pages); verbatim original behind a toggle.
      var fromLang2 = langName(r.originalLanguage);
      var showLbl = T('reviews_ui', 'card_show_original', 'Show original');
      var hideLbl = T('reviews_ui', 'card_hide_original', 'Hide original');
      html += '<p class="rc-body">' + escapeHtml(r.localizedText) + '</p>';
      html += '<div class="rc-orig-wrap"><span class="tlabel">' +
        (fromLang2
          ? escapeHtml(TF(T('reviews_ui', 'card_auto_translated', 'Auto-translated from {language}'), { language: fromLang2 }))
          : escapeHtml(T('reviews_ui', 'card_auto_translated_generic', 'Auto-translated'))) +
        '</span> <button type="button" class="rc-orig-toggle" aria-expanded="false" data-show="' + escapeHtml(showLbl) + '" data-hide="' + escapeHtml(hideLbl) + '">' + escapeHtml(showLbl) + '</button>' +
        '<div class="rc-orig" hidden dir="auto"><p class="rc-body">' + escapeHtml(r.originalText) + '</p>' +
        (r.ownerReply ? '<div class="rc-reply"><span class="rlabel">' + escapeHtml(T('reviews_ui', 'card_owner_reply_label', 'Response from Vivid Clinic')) + '</span>' + escapeHtml(r.ownerReply) + '</div>' : '') +
        '</div></div>';
    } else if (r.localizedText && r.originalText) {
      html += '<p class="rc-body">' + escapeHtml(r.localizedText) + '</p>';
    } else {
      if (r.originalText) html += '<p class="rc-body">' + escapeHtml(r.originalText) + '</p>';
      if (r.translatedText) {
        var fromLang = langName(r.originalLanguage);
        html += '<div class="rc-translation"><span class="tlabel">' +
          (fromLang
            ? escapeHtml(TF(T('reviews_ui', 'card_translated_from', 'Translated from {language}'), { language: fromLang }))
            : escapeHtml(T('reviews_ui', 'card_translated_by_google', 'Translated by Google'))) +
          '</span>' + escapeHtml(r.translatedText) + '</div>';
      }
    }
    if (r.ownerReply) {
      html += '<div class="rc-reply"><span class="rlabel">' + escapeHtml(T('reviews_ui', 'card_owner_reply_label', 'Response from Vivid Clinic')) + '</span>' + escapeHtml(r.localizedTranslated && r.localizedReply ? r.localizedReply : r.ownerReply) + '</div>';
    }
    html += '<div class="rc-foot"><span class="gmark">G</span><span>' + escapeHtml(T('reviews_ui', 'card_review_on_google', 'Review on Google')) + '</span></div>';
    html += '</article>';
    return html;
  }

  function detailScore(r) { return (r.originalText || '').length; }

  function applyFilters() {
    var list = REVIEWS.filter(function (r) {
      if (state.rating !== 'all' && String(r.rating) !== state.rating) return false;
      if (state.language !== 'all' && (r.originalLanguage || 'en') !== state.language) return false;
      if (state.query) {
        var hay = ((r.originalText || '') + ' ' + (r.translatedText || '') + ' ' + (r.localizedText || '') + ' ' + (r.reviewerName || '')).toLowerCase();
        if (hay.indexOf(state.query.toLowerCase()) === -1) return false;
      }
      return true;
    });
    list.sort(function (a, b) {
      if (state.sort === 'newest') return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
      if (state.sort === 'detailed') return detailScore(b) - detailScore(a);
      if (state.sort === 'highest') return b.rating - a.rating;
      // featured: featured first, then newest
      if (!!b.isFeatured !== !!a.isFeatured) return b.isFeatured ? 1 : -1;
      return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
    });
    return list;
  }

  function render() {
    var list = applyFilters();
    var visible = list.slice(0, state.shown);
    grid.innerHTML = visible.map(cardHtml).join('');
    noResults.style.display = list.length === 0 ? 'block' : 'none';
    loadMoreRow.style.display = list.length > state.shown ? 'block' : 'none';
    if (countMeta) {
      countMeta.textContent = list.length === REVIEWS.length
        ? TF(T('reviews_ui', 'showing_of', 'Showing {shown} of {total} reviews'), { shown: visible.length, total: REVIEWS.length })
        : TF(T('js_reviews',
            list.length === 1 ? 'showing_matching_singular' : 'showing_matching_plural',
            list.length === 1 ? 'Showing {shown} of {matching} matching review' : 'Showing {shown} of {matching} matching reviews'),
          { shown: visible.length, matching: list.length });
    }
  }

  /* ---------- wire controls ---------- */
  function onChipGroup(selector, key, evtName) {
    var chips = root.querySelectorAll(selector);
    Array.prototype.forEach.call(chips, function (chip) {
      chip.addEventListener('click', function () {
        Array.prototype.forEach.call(chips, function (c) { c.setAttribute('aria-pressed', 'false'); c.classList.remove('is-active'); });
        chip.setAttribute('aria-pressed', 'true'); chip.classList.add('is-active');
        state[key] = chip.getAttribute('data-value');
        state.shown = INITIAL;
        render();
        writeUrl();
        track(evtName, { value: state[key] });
      });
    });
  }
  onChipGroup('[data-filter="rating"]', 'rating', 'review_filter_used');
  onChipGroup('[data-filter="language"]', 'language', 'review_filter_used');
  onChipGroup('[data-filter="sort"]', 'sort', 'review_filter_used');

  var searchInput = document.getElementById('review-search');
  if (searchInput) {
    var t;
    searchInput.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        state.query = searchInput.value.trim();
        state.shown = INITIAL;
        render();
        writeUrl();
        if (state.query) track('review_search_used', { length: state.query.length });
      }, 200);
    });
  }

  /* hydrate filters from URL before first render */
  var parsed = parseReviewParams(window.location.search);
  state.rating = parsed.rating;
  state.language = parsed.language;
  state.sort = parsed.sort;
  state.query = parsed.query;
  if (searchInput && state.query) searchInput.value = state.query;
  syncChips('[data-filter="rating"]', state.rating);
  syncChips('[data-filter="sort"]', state.sort);
  syncChips('[data-filter="language"]', state.language);

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function () {
      state.shown += STEP;
      render();
      track('load_more_reviews', { shown: state.shown });
    });
  }

  /* outbound CTA + page view tracking */
  Array.prototype.forEach.call(document.querySelectorAll('[data-track]'), function (el) {
    el.addEventListener('click', function () { track(el.getAttribute('data-track'), {}); });
  });
  track('review_page_view', { reviews: REVIEWS.length });

  /* "Show original" toggle on auto-translated reviews — delegated so it works for
     both the server-rendered batch and client re-renders. */
  root.addEventListener('click', function (ev) {
    var btn = ev.target.closest ? ev.target.closest('.rc-orig-toggle') : null;
    if (!btn) return;
    var wrap = btn.closest('.rc-orig-wrap');
    var orig = wrap && wrap.querySelector('.rc-orig');
    if (!orig) return;
    var opening = orig.hidden;
    orig.hidden = !opening;
    btn.setAttribute('aria-expanded', String(opening));
    btn.textContent = opening ? (btn.getAttribute('data-hide') || 'Hide original') : (btn.getAttribute('data-show') || 'Show original');
    track('review_show_original', { open: opening });
  });

  render();
})();
