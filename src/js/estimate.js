/* Vivid Clinic — treatment estimate widget (vanilla, no dependencies).
   INDICATIVE "from" estimate only — never a quote, no payment, no commitment.
   Feeds the booking flow (#book) or WhatsApp. Session-only state, no localStorage.
   Analytics carry no personal data and no per-person amounts.
   i18n: on localized pages the build injects window.__I18N (UI strings) and a
   localized #estimate-data island (treatment names/descriptions/labels). Every
   user-facing literal goes through T() with the English literal as fallback,
   so English pages (no blob) behave identically. */
(function () {
  'use strict';

  var app = document.getElementById('estimate-app');
  if (!app) return;
  var dataEl = document.getElementById('estimate-data');
  if (!dataEl) return;

  var DATA;
  try { DATA = JSON.parse(dataEl.textContent); } catch (e) { return; }

  var WA_NUMBER = app.getAttribute('data-whatsapp') || '';
  var SYM = DATA.currencySymbol || '€';

  /* ---------- i18n (English fallback when no blob is present) ---------- */
  var I18N = window.__I18N || null;
  var RTL = !!(I18N && I18N.dir === 'rtl');
  function T(key, fb) {
    var g = I18N && I18N.js_estimate;
    var v = g ? g[key] : null;
    return v == null ? fb : v;
  }
  function TF(s, vars) {
    return String(s).replace(/\{(\w+)\}/g, function (m, k) { return vars && k in vars ? vars[k] : m; });
  }
  // RTL: isolate Latin/digit runs (prices) interpolated into RTL text — HTML sites only.
  function iso(s) { return RTL ? '<bdi>' + s + '</bdi>' : s; }

  // index maps (O(1) lookups instead of repeated find())
  var byValue = new Map(DATA.services.map(function (s) { return [s.value, s]; }));
  var selected = new Set();

  // estimate category -> booking category (best-effort; treatment is confirmed in booking)
  var CATMAP = {
    'body-aesthetics': 'plastic-surgery', 'breast-aesthetics': 'plastic-surgery', 'nose': 'plastic-surgery',
    'face': 'plastic-surgery', 'eye': 'plastic-surgery', 'genital': 'plastic-surgery', 'ear': 'plastic-surgery',
    'dental-treatment': 'dentistry', 'weight-loss-surgeries': 'weight-loss', 'medical-aesthetic': 'medical-aesthetics',
    'check-up': 'other', 'hair-transplant': 'hair-transplant', 'eye-treatment-surgeries': 'other'
  };

  var state = { category: 'all', query: '' };

  function track(event, params) {
    var payload = Object.assign({ event: event }, params || {});
    if (window.dataLayer && typeof window.dataLayer.push === 'function') window.dataLayer.push(payload);
    if (typeof window.gtag === 'function') window.gtag('event', event, params || {});
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function money(n) { return SYM + Math.round(n).toLocaleString('en-GB'); }

  /* ---------- markup ---------- */
  var cats = [{ value: 'all', label: T('chip_all_treatments', 'All treatments') }].concat(DATA.categories);
  function build() {
    var chips = cats.map(function (c, i) {
      return '<button type="button" class="chip' + (i === 0 ? ' is-active' : '') + '" data-cat="' + esc(c.value) + '" aria-pressed="' + (i === 0) + '">' + esc(c.label) + '</button>';
    }).join('');
    var rows = DATA.services.map(function (s) {
      return '<li class="est-row" data-val="' + esc(s.value) + '" data-cat="' + esc(s.category) + '">' +
        '<div class="est-row-main"><span class="est-name">' + esc(s.name) + '</span>' +
        '<span class="est-desc">' + esc(s.description) + '</span></div>' +
        '<span class="est-price">' + TF(esc(T('price_from', 'from {price}')), { price: iso(money(s.fromPrice)) }) + '</span>' +
        '<button type="button" class="est-add" data-add="' + esc(s.value) + '" aria-label="' + TF(esc(T('add_aria', 'Add {name} to your estimate')), { name: esc(s.name) }) + '">' + esc(T('add', 'Add')) + '</button>' +
        '</li>';
    }).join('');
    app.innerHTML =
      '<div class="est-grid">' +
        '<div class="est-picker">' +
          '<div class="est-filters" role="group" aria-label="' + esc(T('filter_aria', 'Filter treatments by area')) + '">' + chips + '</div>' +
          '<div class="search-field est-search"><svg class="si" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>' +
            '<label for="est-q" class="sr-only">' + esc(T('search_label', 'Search treatments')) + '</label>' +
            '<input type="search" id="est-q" placeholder="' + esc(T('search_placeholder', 'Search treatments…')) + '" autocomplete="off"></div>' +
          '<p class="est-count" id="est-count" aria-live="polite"></p>' +
          '<ul class="est-list" id="est-list">' + rows + '</ul>' +
        '</div>' +
        '<aside class="est-summary" aria-label="' + esc(T('summary_aria', 'Your estimate')) + '">' +
          '<div class="est-card" id="est-card"></div>' +
        '</aside>' +
      '</div>';
  }
  build();

  var list = document.getElementById('est-list');
  var countEl = document.getElementById('est-count');
  var card = document.getElementById('est-card');
  var rowEls = Array.prototype.slice.call(list.querySelectorAll('.est-row'));

  /* ---------- filtering (toggle visibility, no re-render) ---------- */
  function applyFilter() {
    var q = state.query.toLowerCase();
    var shown = 0;
    for (var i = 0; i < rowEls.length; i++) {
      var el = rowEls[i];
      var okCat = state.category === 'all' || el.getAttribute('data-cat') === state.category;
      var okQ = !q || el.querySelector('.est-name').textContent.toLowerCase().indexOf(q) !== -1;
      var vis = okCat && okQ;
      el.classList.toggle('is-hidden', !vis);
      if (vis) shown++;
    }
    countEl.textContent =
      TF(T(shown === 1 ? 'count_singular' : 'count_plural', shown === 1 ? '{n} treatment' : '{n} treatments'), { n: shown }) +
      (state.category === 'all' && !q ? '' : T('count_shown_suffix', ' shown'));
  }

  /* ---------- totals ---------- */
  function compute() {
    var items = [];
    selected.forEach(function (v) { var s = byValue.get(v); if (s) items.push(s); });
    var subtotal = items.reduce(function (a, s) { return a + s.fromPrice; }, 0);
    var bundle = null, discount = 0;
    for (var p = 0; p < DATA.packages.length; p++) {
      var pk = DATA.packages[p];
      if (pk.procedures.length > 1 && pk.procedures.every(function (pv) { return selected.has(pv); })) {
        var base = pk.procedures.reduce(function (a, pv) { return a + (byValue.get(pv) ? byValue.get(pv).fromPrice : 0); }, 0);
        var d = base * pk.discount;
        if (d > discount) { discount = d; bundle = pk; }
      }
    }
    return { items: items, subtotal: subtotal, discount: discount, bundle: bundle, total: subtotal - discount };
  }

  function renderCard() {
    var c = compute();
    if (!c.items.length) {
      card.innerHTML = '<p class="eyebrow" style="margin-bottom:6px">' + esc(T('card_eyebrow', 'Your estimate')) + '</p>' +
        '<p class="est-empty">' + T('empty', 'Add one or more treatments to see an indicative “from” estimate. It’s free, with no payment and no commitment.') + '</p>' +
        disclaimerHtml();
      return;
    }
    var lines = c.items.map(function (s) {
      return '<div class="est-line"><span>' + esc(s.name) + '</span><span>' + TF(esc(T('price_from', 'from {price}')), { price: iso(money(s.fromPrice)) }) + '</span>' +
        '<button type="button" class="est-rm" data-rm="' + esc(s.value) + '" aria-label="' + TF(esc(T('remove_aria', 'Remove {name}')), { name: esc(s.name) }) + '">×</button></div>';
    }).join('');
    card.innerHTML =
      '<p class="eyebrow" style="margin-bottom:6px">' + esc(T('card_eyebrow', 'Your estimate')) + '</p>' +
      '<div class="est-lines">' + lines + '</div>' +
      (c.bundle ? '<div class="est-bundle">' + TF(esc(T('bundle_applied', 'Bundle “{name}” applied · −{amount}')), { name: esc(c.bundle.name), amount: iso(money(c.discount)) }) + '</div>' : '') +
      '<div class="est-total"><span>' + esc(T('total_label', 'Indicative total')) + '</span><strong>' + TF(esc(T('price_from', 'from {price}')), { price: iso(money(c.total)) }) + '</strong></div>' +
      '<div class="est-actions">' +
        '<button type="button" class="btn btn--primary" id="est-continue">' + esc(T('continue_to_consultation', 'Continue to consultation')) + '</button>' +
        '<a class="btn btn--whatsapp" id="est-wa" href="#" target="_blank" rel="noopener">' + esc(T('send_whatsapp', 'Send estimate on WhatsApp')) + '</a>' +
      '</div>' +
      disclaimerHtml();
    document.getElementById('est-continue').addEventListener('click', continueToBooking);
    var wa = document.getElementById('est-wa');
    wa.setAttribute('href', whatsappUrl(c));
    wa.addEventListener('click', function () { track('estimate_whatsapp_click', { count: c.items.length }); });
  }
  function disclaimerHtml() {
    var reviewed = DATA.lastUpdatedLabel ? '<li>' + TF(esc(T('disclaimer_last_reviewed', 'Indicative prices last reviewed {date}.')), { date: esc(DATA.lastUpdatedLabel) }) + '</li>' : '';
    return '<ul class="est-disclaimer">' + DATA.disclaimers.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + reviewed + '</ul>';
  }

  function whatsappUrl(c) {
    var names = c.items.map(function (s) { return s.name; }).join(', ');
    var lines = [T('wa_line_greeting', 'Hello Vivid Clinic, I used your estimate tool.'),
      TF(T('wa_line_treatments', '• Treatments: {names}'), { names: names }),
      TF(T('wa_line_estimate', '• Indicative estimate: from {price} (estimate only, to be confirmed)'), { price: money(c.total) }),
      T('wa_line_confirm', 'Please confirm the details and next steps.'), T('wa_line_sent_from', '(Sent from vivid.clinic)')];
    return 'https://api.whatsapp.com/send/?phone=' + encodeURIComponent(WA_NUMBER) + '&text=' + encodeURIComponent(lines.join('\n'));
  }

  function continueToBooking() {
    var c = compute();
    var first = c.items[0];
    var bookingCat = first ? (CATMAP[first.category] || 'other') : 'other';
    var msg = TF(T('booking_prefill_message', 'From the estimate tool — interested in: {names}. Indicative estimate from {price} (estimate only).'),
      { names: c.items.map(function (s) { return s.name; }).join(', '), price: money(c.total) });
    track('estimate_continue_to_booking', { count: c.items.length, category: bookingCat });
    document.dispatchEvent(new CustomEvent('vivid:prefill-booking', { detail: { category: bookingCat, treatment: 'other', message: msg } }));
    var book = document.getElementById('book');
    if (book) { try { book.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { location.hash = '#book'; } }
    else { location.href = '/consultation/#book'; }
  }

  /* ---------- events ---------- */
  app.addEventListener('click', function (e) {
    var add = e.target.getAttribute && e.target.getAttribute('data-add');
    var rm = e.target.getAttribute && e.target.getAttribute('data-rm');
    var cat = e.target.getAttribute && e.target.getAttribute('data-cat');
    if (add) {
      if (selected.has(add)) { selected.delete(add); e.target.textContent = T('add', 'Add'); e.target.closest('.est-row').classList.remove('is-selected'); }
      else { selected.add(add); e.target.textContent = T('added', 'Added ✓'); e.target.closest('.est-row').classList.add('is-selected'); track('estimate_procedure_selected', { category: (byValue.get(add) || {}).category }); }
      renderCard();
    } else if (rm) {
      selected.delete(rm); renderCard();
      var btn = list.querySelector('[data-add="' + rm + '"]');
      if (btn) { btn.textContent = T('add', 'Add'); btn.closest('.est-row').classList.remove('is-selected'); }
    } else if (cat) {
      state.category = cat;
      Array.prototype.forEach.call(app.querySelectorAll('[data-cat]'), function (b) { b.classList.toggle('is-active', b === e.target); b.setAttribute('aria-pressed', b === e.target); });
      applyFilter();
      track('estimate_filter_used', { category: cat });
    }
  });
  var searchEl = document.getElementById('est-q');
  var t;
  searchEl.addEventListener('input', function () {
    clearTimeout(t);
    t = setTimeout(function () { state.query = searchEl.value.trim(); applyFilter(); }, 150);
  });

  applyFilter();
  renderCard();
  track('estimate_start', {});
})();
