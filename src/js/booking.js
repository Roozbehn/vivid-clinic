/* Vivid Clinic — consultation booking flow (vanilla, no dependencies).
   Multi-step, accessible, mobile-first. Session-only state (NEVER localStorage).
   Submits to /api/booking; on any failure falls back to a prefilled WhatsApp message.
   Analytics events carry NO personal/medical data.
   i18n: on localized pages the build injects window.__I18N with the js_booking
   string group and booking_options label maps; every user-facing literal goes
   through T() with the English literal as fallback, and the options data
   (English labels in the #booking-options island) is relabelled from the
   booking_options group. English pages (no blob) behave identically. */
(function () {
  'use strict';

  var app = document.getElementById('booking-app');
  if (!app) return;
  var optEl = document.getElementById('booking-options');
  if (!optEl) return;

  var OPT;
  try { OPT = JSON.parse(optEl.textContent); } catch (e) { return; }

  var WA_NUMBER = app.getAttribute('data-whatsapp') || '';
  var BUSINESS_SITE = app.getAttribute('data-business') || 'https://vividclinic.net';
  var REVIEWS_HREF = app.getAttribute('data-reviews-href') || '/';
  var API = '/api/booking';
  var TOTAL = 5;

  /* ---------- i18n (English fallback when no blob is present) ---------- */
  var I18N = window.__I18N || null;
  function T(key, fb) {
    var g = I18N && I18N.js_booking;
    var v = g ? g[key] : null;
    return v == null ? fb : v;
  }
  function TF(s, vars) {
    return String(s).replace(/\{(\w+)\}/g, function (m, k) { return vars && k in vars ? vars[k] : m; });
  }
  // slug → catalog key ("plastic-surgery" → "plastic_surgery")
  function us(v) { return String(v).replace(/-/g, '_'); }
  // Relabel the (English) options island from the booking_options catalog group.
  // Values/slugs are untouched — only display labels change, so payloads stay stable.
  function localizeOptions(opt, L) {
    function relabel(listName, labels) {
      return (opt[listName] || []).map(function (o) {
        var lab = labels && labels[us(o.value)];
        return lab == null ? o : Object.assign({}, o, { label: lab });
      });
    }
    var out = Object.assign({}, opt);
    out.categories = (opt.categories || []).map(function (cat) {
      var catLab = L.category_labels && L.category_labels[us(cat.value)];
      var treatments = (cat.treatments || []).map(function (tr) {
        var lab = L.treatment_labels && L.treatment_labels[us(cat.value) + '__' + us(tr.value)];
        return lab == null ? tr : Object.assign({}, tr, { label: lab });
      });
      return Object.assign({}, cat, { label: catLab == null ? cat.label : catLab, treatments: treatments });
    });
    out.timelines = relabel('timelines', L.timeline_labels);
    out.languages = relabel('languages', L.language_labels);
    out.contactMethods = relabel('contactMethods', L.contact_method_labels);
    out.consultationTypes = relabel('consultationTypes', L.consultation_type_labels);
    out.timeRanges = relabel('timeRanges', L.time_range_labels);
    out.travelOptions = relabel('travelOptions', L.travel_option_labels);
    out.transferOptions = relabel('transferOptions', L.transfer_option_labels);
    out.previousTreatmentOptions = relabel('previousTreatmentOptions', L.previous_treatment_labels);
    if (L.countries && L.countries.length === (opt.countries || []).length) out.countries = L.countries;
    return out;
  }
  if (I18N && I18N.booking_options) OPT = localizeOptions(OPT, I18N.booking_options);

  /* ---------- state (session only) ---------- */
  var state = {
    step: 1,
    category: '', treatment: '', timeline: '',
    fullName: '', email: '', phone: '', whatsapp: '', country: '',
    preferredLanguage: '', preferredContactMethod: '', bestTimeToContact: '',
    consultationType: '', preferredDate: '', preferredTimeRange: '',
    travelingToIstanbul: '', needsTransferHotelSupport: '',
    message: '', previousTreatment: '',
    contactConsent: false, medicalDisclaimerAccepted: false, privacyAccepted: false, marketingConsent: false,
    utm: {}, formStartedAt: Date.now()
  };
  captureUtm();

  /* ---------- analytics (no PII) ---------- */
  function track(event, params) {
    var payload = Object.assign({ event: event }, params || {});
    if (window.dataLayer && typeof window.dataLayer.push === 'function') window.dataLayer.push(payload);
    if (typeof window.gtag === 'function') window.gtag('event', event, params || {});
  }

  function captureUtm() {
    try {
      var p = new URLSearchParams(window.location.search);
      ['source', 'medium', 'campaign', 'term', 'content'].forEach(function (k) {
        var v = p.get('utm_' + k);
        if (v) state.utm[k] = v.slice(0, 120);
      });
    } catch (e) { /* ignore */ }
  }

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function labelFor(list, value) {
    for (var i = 0; i < list.length; i++) if (list[i].value === value) return list[i].label;
    return value || '';
  }
  function categoryObj(v) { return OPT.categories.filter(function (c) { return c.value === v; })[0] || null; }
  function chips(name, list) {
    return '<div class="bk-options">' + list.map(function (o) {
      return '<label class="bk-chip"><input type="radio" name="' + name + '" value="' + esc(o.value) + '"><span>' + esc(o.label) + '</span></label>';
    }).join('') + '</div>';
  }
  function selectOpts(list, placeholder) {
    return '<option value="">' + esc(placeholder || T('placeholder_select_default', 'Select…')) + '</option>' +
      list.map(function (o) { return '<option value="' + esc(o.value) + '">' + esc(o.label) + '</option>'; }).join('');
  }

  /* ---------- markup ---------- */
  function progressHtml() {
    var names = [
      T('progress_step1', 'Treatment'), T('progress_step2', 'Contact'), T('progress_step3', 'Consultation'),
      T('progress_step4', 'Details'), T('progress_step5', 'Confirm')
    ];
    return '<ol class="booking-progress" aria-hidden="true">' + names.map(function (n) {
      return '<li><span class="bar"></span><span class="plabel">' + esc(n) + '</span></li>';
    }).join('') + '</ol>';
  }

  function formHtml() {
    var cats = OPT.categories;
    var countryOpts = (OPT.countries || []).map(function (c) { return '<option value="' + esc(c) + '"></option>'; }).join('');
    var privacyLink = '<a href="' + esc(BUSINESS_SITE) + '/privacy-policy/" target="_blank" rel="noopener">' +
      esc(T('consent_privacy_link_text', 'Privacy / KVKK notice')) + '</a>';
    var privacyLabel = esc(T('consent_privacy', 'I have read and agree to the {privacy_link}.')).replace('{privacy_link}', privacyLink);
    return '' +
      '<form id="bk-form" novalidate autocomplete="on">' +
      progressHtml() +
      '<p class="booking-stepmeta" id="bk-stepmeta" aria-live="polite"></p>' +

      // honeypot (bots fill this; humans never see it)
      '<div class="bk-hp" aria-hidden="true"><label>' + esc(T('honeypot_label', 'Company')) + '<input type="text" name="company" tabindex="-1" autocomplete="off"></label></div>' +

      // STEP 1
      '<fieldset class="booking-step is-active" data-step="1">' +
        '<legend class="step-h" tabindex="-1">' + esc(T('step1_legend', 'What are you interested in?')) + '</legend>' +
        '<p class="step-sub">' + esc(T('step1_sub', 'This helps us route you to the right specialist. You can change details later with the coordinator.')) + '</p>' +
        '<div class="bk-field"><label for="bk-category">' + esc(T('label_treatment_area', 'Treatment area')) + '<span class="bk-req">*</span></label>' +
          '<select id="bk-category" class="bk-select" data-key="category" aria-describedby="err-category">' + selectOpts(cats, T('placeholder_select_area', 'Select a treatment area…')) + '</select>' +
          '<div class="bk-error" id="err-category"></div></div>' +
        '<div class="bk-field"><label for="bk-treatment">' + esc(T('label_treatment', 'Treatment')) + '<span class="bk-req">*</span></label>' +
          '<select id="bk-treatment" class="bk-select" data-key="treatment" aria-describedby="err-treatment" disabled><option value="">' + esc(T('placeholder_choose_area_first', 'Choose a treatment area first…')) + '</option></select>' +
          '<div class="bk-error" id="err-treatment"></div></div>' +
        '<div class="bk-field"><span class="bk-legend">' + esc(T('label_timeline', 'Timeline')) + '<span class="bk-req">*</span></span>' +
          chips('timeline', OPT.timelines) +
          '<div class="bk-error" id="err-timeline"></div></div>' +
      '</fieldset>' +

      // STEP 2
      '<fieldset class="booking-step" data-step="2">' +
        '<legend class="step-h" tabindex="-1">' + esc(T('step2_legend', 'How can we reach you?')) + '</legend>' +
        '<p class="step-sub">' + esc(T('step2_sub', 'A coordinator will use these details only to respond to your request.')) + '</p>' +
        '<div class="bk-grid">' +
          '<div class="bk-field"><label for="bk-name">' + esc(T('label_full_name', 'Full name')) + '<span class="bk-req">*</span></label><input id="bk-name" class="bk-input" data-key="fullName" name="name" type="text" autocomplete="name" maxlength="120" aria-describedby="err-name"><div class="bk-error" id="err-name"></div></div>' +
          '<div class="bk-field"><label for="bk-country">' + esc(T('label_country', 'Country')) + '</label><input id="bk-country" class="bk-input" data-key="country" name="country" type="text" list="bk-countries" autocomplete="country-name" maxlength="80"><datalist id="bk-countries">' + countryOpts + '</datalist></div>' +
          '<div class="bk-field"><label for="bk-email">' + esc(T('label_email', 'Email')) + '</label><input id="bk-email" class="bk-input" data-key="email" name="email" type="email" inputmode="email" autocomplete="email" spellcheck="false" autocapitalize="off" maxlength="200" aria-describedby="err-email"><div class="bk-error" id="err-email"></div></div>' +
          '<div class="bk-field"><label for="bk-phone">' + esc(T('label_phone', 'Phone number')) + '</label><input id="bk-phone" class="bk-input" data-key="phone" name="tel" type="tel" inputmode="tel" autocomplete="tel" maxlength="40"></div>' +
          '<div class="bk-field"><label for="bk-whatsapp">' + esc(T('label_whatsapp_number', 'WhatsApp number')) + '</label><input id="bk-whatsapp" class="bk-input" data-key="whatsapp" name="whatsapp" type="tel" inputmode="tel" maxlength="40"></div>' +
          '<div class="bk-field"><label for="bk-language">' + esc(T('label_preferred_language', 'Preferred language')) + '</label><select id="bk-language" class="bk-select" data-key="preferredLanguage">' + selectOpts(OPT.languages) + '</select></div>' +
        '</div>' +
        '<p class="bk-help" style="margin-top:-8px;margin-bottom:16px">' + esc(T('help_one_contact_method', 'Please give us at least one way to reach you — email, phone, or WhatsApp.')) + '</p>' +
        '<div class="bk-error" id="err-contact"></div>' +
        '<div class="bk-field"><span class="bk-legend">' + esc(T('label_preferred_contact_method', 'Preferred contact method')) + '<span class="bk-req">*</span></span>' + chips('preferredContactMethod', OPT.contactMethods) + '<div class="bk-error" id="err-contactMethod"></div></div>' +
        '<div class="bk-field"><label for="bk-besttime">' + esc(T('label_best_time', 'Best time to contact you')) + '</label><input id="bk-besttime" class="bk-input" data-key="bestTimeToContact" type="text" maxlength="120" placeholder="' + esc(T('placeholder_best_time', 'e.g. weekday afternoons, my local time')) + '"></div>' +
      '</fieldset>' +

      // STEP 3
      '<fieldset class="booking-step" data-step="3">' +
        '<legend class="step-h" tabindex="-1">' + esc(T('step3_legend', 'Consultation & travel')) + '</legend>' +
        '<p class="step-sub">' + esc(T('step3_sub', 'Tell us how you would like to talk. Nothing here is final — it just helps us prepare.')) + '</p>' +
        '<div class="bk-field"><span class="bk-legend">' + esc(T('label_consultation_type', 'How would you like your consultation?')) + '<span class="bk-req">*</span></span>' + chips('consultationType', OPT.consultationTypes) + '<div class="bk-error" id="err-consultationType"></div></div>' +
        '<div class="bk-grid">' +
          '<div class="bk-field"><label for="bk-date">' + esc(T('label_preferred_date', 'Preferred date')) + '</label><input id="bk-date" class="bk-input" data-key="preferredDate" type="date"></div>' +
          '<div class="bk-field"><span class="bk-legend" style="margin-bottom:6px">' + esc(T('label_preferred_time', 'Preferred time')) + '</span>' + chips('preferredTimeRange', OPT.timeRanges) + '</div>' +
        '</div>' +
        '<div class="bk-field"><span class="bk-legend">' + esc(T('label_traveling', 'Are you planning to travel to Istanbul?')) + '</span>' + chips('travelingToIstanbul', OPT.travelOptions) + '</div>' +
        '<div class="bk-field"><span class="bk-legend">' + esc(T('label_transfer_support', 'Would you like help with travel coordination (transfers, accommodation)?')) + '</span>' + chips('needsTransferHotelSupport', OPT.transferOptions) + '<div class="bk-help">' + esc(T('help_transfer_support', 'The coordinator can answer travel-coordination questions — this is not a guaranteed service quote.')) + '</div></div>' +
      '</fieldset>' +

      // STEP 4
      '<fieldset class="booking-step" data-step="4">' +
        '<legend class="step-h" tabindex="-1">' + esc(T('step4_legend', 'Anything else? (optional)')) + '</legend>' +
        '<p class="step-sub">' + esc(T('step4_sub', 'Keep it short — the coordinator will follow up for the rest.')) + '</p>' +
        '<div class="bk-field"><label for="bk-message">' + esc(T('label_message', 'Your message or goal')) + '</label><textarea id="bk-message" class="bk-textarea" data-key="message" name="message" maxlength="2000" placeholder="' + esc(T('placeholder_message', 'e.g. what you would like to improve, any questions')) + '"></textarea><div class="bk-help">' + esc(T('help_message', 'Please don’t include urgent medical information here.')) + '</div></div>' +
        '<div class="bk-field"><span class="bk-legend">' + esc(T('label_previous_treatment', 'Have you had a previous treatment in this area?')) + '</span>' + chips('previousTreatment', OPT.previousTreatmentOptions) + '</div>' +
        '<div class="compliance-note" style="margin-top:0"><strong style="font-size:14px">' + esc(T('photos_heading', 'Photos')) + '</strong><p class="bk-help" style="margin-top:6px">' + esc(T('photos_help', 'You can share photos later with the coordinator on WhatsApp if needed — there’s no photo upload here, so nothing sensitive is stored on this site.')) + '</p></div>' +
      '</fieldset>' +

      // STEP 5
      '<fieldset class="booking-step" data-step="5">' +
        '<legend class="step-h" tabindex="-1">' + esc(T('step5_legend', 'Review & confirm')) + '</legend>' +
        '<p class="step-sub">' + esc(T('step5_sub', 'Please check your details and confirm the consents below.')) + '</p>' +
        '<div class="bk-summary" id="bk-summary"></div>' +
        '<div class="bk-consent"><input type="checkbox" id="cs-contact" data-key="contactConsent"><label for="cs-contact">' + esc(T('consent_contact', 'I consent to Vivid Clinic contacting me about my consultation request.')) + '<span class="bk-req">*</span></label></div>' +
        '<div class="bk-consent"><input type="checkbox" id="cs-disc" data-key="medicalDisclaimerAccepted"><label for="cs-disc">' + esc(T('consent_disclaimer', 'I understand this form is not a diagnosis and does not guarantee treatment suitability, results, or prices.')) + '<span class="bk-req">*</span></label></div>' +
        '<div class="bk-consent"><input type="checkbox" id="cs-priv" data-key="privacyAccepted"><label for="cs-priv">' + privacyLabel + '<span class="bk-req">*</span></label></div>' +
        '<div class="bk-consent"><input type="checkbox" id="cs-mkt" data-key="marketingConsent"><label for="cs-mkt">' + esc(T('consent_marketing', 'I’d like to receive follow-up information and offers from Vivid Clinic. (optional)')) + '</label></div>' +
        '<div class="bk-error" id="err-consent"></div>' +
      '</fieldset>' +

      '<div class="bk-formerror" id="bk-formerror" role="alert"></div>' +
      '<div class="bk-nav">' +
        '<button type="button" class="btn btn--secondary" id="bk-back" style="display:none">' + esc(T('btn_back', 'Back')) + '</button>' +
        '<span class="spacer"></span>' +
        '<button type="button" class="btn btn--primary" id="bk-next">' + esc(T('btn_continue', 'Continue')) + '</button>' +
        '<button type="submit" class="btn btn--primary" id="bk-submit" style="display:none">' + esc(T('btn_submit', 'Submit request')) + '</button>' +
      '</div>' +
      '</form>';
  }

  app.innerHTML = formHtml();
  var form = document.getElementById('bk-form');
  var steps = form.querySelectorAll('.booking-step');
  var bars = form.querySelectorAll('.booking-progress li');
  var backBtn = document.getElementById('bk-back');
  var nextBtn = document.getElementById('bk-next');
  var submitBtn = document.getElementById('bk-submit');
  var stepMeta = document.getElementById('bk-stepmeta');
  var formError = document.getElementById('bk-formerror');

  track('booking_start', {});

  var dirty = false;
  var submittedOk = false;
  function onBeforeUnload(e) {
    if (!dirty || submittedOk) return;
    e.preventDefault();
    e.returnValue = '';
  }
  window.addEventListener('beforeunload', onBeforeUnload);

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ---------- bind inputs to state ---------- */
  form.addEventListener('input', function (e) {
    dirty = true;
    var el = e.target;
    var key = el.getAttribute('data-key');
    if (!key) return;
    state[key] = el.type === 'checkbox' ? el.checked : el.value;
    clearError(el);
  });
  form.addEventListener('change', function (e) {
    dirty = true;
    var el = e.target;
    if (el.name && el.type === 'radio') {
      state[el.name] = el.value;
      var grp = el.closest('.bk-field'); if (grp) { var er = grp.querySelector('.bk-error'); if (er) er.textContent = ''; }
      if (el.name === 'timeline') track('booking_treatment_selected', { category: state.category, treatment: state.treatment, timeline: state.timeline });
    }
    if (el.id === 'bk-category') onCategoryChange();
    if (el.id === 'bk-treatment' && state.treatment) {
      track('booking_treatment_selected', { category: state.category, treatment: state.treatment });
    }
  });
  function validateFieldBlur(el) {
    var key = el.getAttribute('data-key');
    if (state.step !== 2) return;
    if (key === 'fullName') {
      if (!state.fullName || state.fullName.trim().length < 2) setError('err-name', T('err_name', 'Please enter your name.'));
      else setError('err-name', '');
    }
    if (key === 'email') {
      if (state.email && !EMAIL_RE.test(state.email)) {
        setError('err-email', T('err_email', 'Please enter a valid email, or leave it blank.'));
      } else setError('err-email', '');
    }
  }
  form.addEventListener('blur', function (e) {
    if (e.target && e.target.getAttribute('data-key')) validateFieldBlur(e.target);
  }, true);

  function onCategoryChange() {
    var cat = categoryObj(state.category);
    var sel = document.getElementById('bk-treatment');
    state.treatment = '';
    if (!cat) { sel.innerHTML = '<option value="">' + esc(T('placeholder_choose_area_first', 'Choose a treatment area first…')) + '</option>'; sel.disabled = true; return; }
    sel.innerHTML = selectOpts(cat.treatments, T('placeholder_select_treatment', 'Select a treatment…'));
    sel.disabled = false;
  }

  /* ---------- validation ---------- */
  function setError(id, msg) {
    var er = document.getElementById(id); if (er) er.textContent = msg || '';
    var field = er && er.closest('.bk-field');
    var input = field && field.querySelector('.bk-input, .bk-select');
    if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  function clearError(el) {
    if (el.getAttribute) el.setAttribute('aria-invalid', 'false');
    var f = el.closest && el.closest('.bk-field'); if (f) { var er = f.querySelector('.bk-error'); if (er && er.id !== 'err-contact') er.textContent = ''; }
  }

  function validateStep(n) {
    formError.textContent = '';
    var ok = true;
    function fail(id, msg) { setError(id, msg); ok = false; }
    if (n === 1) {
      if (!state.category) fail('err-category', T('err_category', 'Please choose a treatment area.'));
      if (!state.treatment) fail('err-treatment', T('err_treatment', 'Please choose a treatment.'));
      if (!state.timeline) fail('err-timeline', T('err_timeline', 'Please choose a timeline.'));
    } else if (n === 2) {
      if (!state.fullName || state.fullName.trim().length < 2) fail('err-name', T('err_name', 'Please enter your name.'));
      if (state.email && !EMAIL_RE.test(state.email)) fail('err-email', T('err_email', 'Please enter a valid email, or leave it blank.'));
      if (!state.email && !state.phone && !state.whatsapp) { setError('err-contact', T('help_one_contact_method', 'Please give us at least one way to reach you — email, phone, or WhatsApp.')); ok = false; }
      else setError('err-contact', '');
      if (!state.preferredContactMethod) fail('err-contactMethod', T('err_contact_method', 'Please choose a preferred contact method.'));
    } else if (n === 3) {
      if (!state.consultationType) fail('err-consultationType', T('err_consultation_type', 'Please choose a consultation type.'));
    } else if (n === 5) {
      if (!state.contactConsent || !state.medicalDisclaimerAccepted || !state.privacyAccepted) {
        setError('err-consent', T('err_consent', 'Please confirm the three required consents to continue.')); ok = false;
      } else setError('err-consent', '');
    }
    if (!ok) formError.textContent = T('err_form', 'Please complete the highlighted fields.');
    return ok;
  }

  // Move focus to the first errored control in the active step (a11y: focus first error).
  function focusFirstError() {
    var active = form.querySelector('.booking-step.is-active');
    if (!active) return;
    var invalid = active.querySelector('[aria-invalid="true"]');
    if (invalid) { invalid.focus(); return; }
    var errs = active.querySelectorAll('.bk-error');
    for (var i = 0; i < errs.length; i++) {
      if (errs[i].textContent.trim()) {
        var field = errs[i].closest('.bk-field') || active;
        var ctrl = field.querySelector('input, select, textarea, button');
        if (ctrl) { ctrl.focus(); return; }
      }
    }
  }

  /* ---------- navigation ---------- */
  function showStep(n, focus) {
    state.step = n;
    for (var i = 0; i < steps.length; i++) steps[i].classList.toggle('is-active', steps[i].getAttribute('data-step') == n);
    for (var j = 0; j < bars.length; j++) {
      bars[j].classList.toggle('done', j < n - 1);
      if (j === n - 1) bars[j].setAttribute('aria-current', 'step'); else bars[j].removeAttribute('aria-current');
    }
    backBtn.style.display = n > 1 ? '' : 'none';
    nextBtn.style.display = n < TOTAL ? '' : 'none';
    submitBtn.style.display = n === TOTAL ? '' : 'none';
    stepMeta.textContent = TF(T('step_meta', 'Step {n} of {total}'), { n: n, total: TOTAL });
    if (n === TOTAL) renderSummary();
    track('booking_step_view', { step: n });
    if (focus !== false) {
      var lg = steps[n - 1].querySelector('.step-h');
      if (lg) { lg.focus(); }
      try { app.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
    }
  }
  nextBtn.addEventListener('click', function () {
    if (!validateStep(state.step)) { focusFirstError(); return; }
    track('booking_step_complete', { step: state.step });
    showStep(Math.min(TOTAL, state.step + 1));
  });
  backBtn.addEventListener('click', function () { showStep(Math.max(1, state.step - 1)); });

  function renderSummary() {
    var rows = [
      [T('summary_treatment_area', 'Treatment area'), labelFor(OPT.categories, state.category)],
      [T('summary_treatment', 'Treatment'), state.treatment ? labelFor((categoryObj(state.category) || {}).treatments || [], state.treatment) : ''],
      [T('summary_timeline', 'Timeline'), labelFor(OPT.timelines, state.timeline)],
      [T('summary_name', 'Name'), state.fullName],
      [T('summary_country', 'Country'), state.country],
      [T('summary_contact', 'Contact'), [state.email, state.phone, state.whatsapp].filter(Boolean).join(' · ')],
      [T('summary_preferred_contact', 'Preferred contact'), labelFor(OPT.contactMethods, state.preferredContactMethod)],
      [T('summary_consultation', 'Consultation'), labelFor(OPT.consultationTypes, state.consultationType)],
      [T('summary_preferred_date', 'Preferred date'), state.preferredDate],
      [T('summary_preferred_time', 'Preferred time'), labelFor(OPT.timeRanges, state.preferredTimeRange)]
    ].filter(function (r) { return r[1]; });
    document.getElementById('bk-summary').innerHTML = '<dl>' + rows.map(function (r) {
      return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>';
    }).join('') + '</dl>';
  }

  /* ---------- WhatsApp fallback ---------- */
  function whatsappUrl() {
    var lines = [T('wa_line_greeting', 'Hello Vivid Clinic, I would like to request a consultation.')];
    var cat = labelFor(OPT.categories, state.category);
    var treat = state.treatment ? labelFor((categoryObj(state.category) || {}).treatments || [], state.treatment) : '';
    if (cat) {
      var patT = T('wa_line_treatment', '• Treatment: {category} – {treatment}');
      // the " – {treatment}" tail is omitted when no specific treatment was chosen
      lines.push(treat ? TF(patT, { category: cat, treatment: treat }) : TF(patT.replace(/\s*–\s*\{treatment\}/, ''), { category: cat }));
    }
    if (state.timeline) lines.push(TF(T('wa_line_timeline', '• Timeline: {timeline}'), { timeline: labelFor(OPT.timelines, state.timeline) }));
    if (state.fullName) lines.push(TF(T('wa_line_name', '• Name: {name}'), { name: state.fullName }));
    if (state.country) lines.push(TF(T('wa_line_country', '• Country: {country}'), { country: state.country }));
    if (state.preferredContactMethod) lines.push(TF(T('wa_line_preferred_contact', '• Preferred contact: {method}'), { method: labelFor(OPT.contactMethods, state.preferredContactMethod) }));
    lines.push(T('wa_line_sent_from', '(Sent from vivid.clinic)'));
    return 'https://api.whatsapp.com/send/?phone=' + encodeURIComponent(WA_NUMBER) + '&text=' + encodeURIComponent(lines.join('\n'));
  }

  /* ---------- payload ---------- */
  function buildPayload() {
    var nowIso = new Date().toISOString();
    return {
      createdAt: nowIso,
      source: 'vivid.clinic',
      page: 'reviews-booking-landing',
      utm: {
        source: state.utm.source || '', medium: state.utm.medium || '', campaign: state.utm.campaign || '',
        term: state.utm.term || '', content: state.utm.content || ''
      },
      patient: {
        fullName: state.fullName, email: state.email, phone: state.phone, whatsapp: state.whatsapp,
        country: state.country, preferredLanguage: state.preferredLanguage,
        preferredContactMethod: state.preferredContactMethod, bestTimeToContact: state.bestTimeToContact
      },
      request: {
        category: state.category, treatment: state.treatment, timeline: state.timeline,
        consultationType: state.consultationType, preferredDate: state.preferredDate,
        preferredTimeRange: state.preferredTimeRange, travelingToIstanbul: state.travelingToIstanbul,
        needsTransferHotelSupport: state.needsTransferHotelSupport, message: state.message,
        previousTreatment: state.previousTreatment
      },
      consent: {
        contactConsent: !!state.contactConsent, medicalDisclaimerAccepted: !!state.medicalDisclaimerAccepted,
        privacyAccepted: !!state.privacyAccepted, marketingConsent: !!state.marketingConsent,
        consentTimestamp: nowIso
      },
      meta: {
        userAgent: navigator.userAgent ? navigator.userAgent.slice(0, 300) : '',
        submittedAt: nowIso,
        honeypot: (form.querySelector('input[name="company"]') || {}).value || '',
        formStartedAt: state.formStartedAt
      }
    };
  }

  /* ---------- submit ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validateStep(5)) { focusFirstError(); return; }
    track('booking_submit_attempt', { category: state.category });
    submitBtn.disabled = true; submitBtn.textContent = T('btn_sending', 'Sending…');
    var payload = buildPayload();
    var controller = ('AbortController' in window) ? new AbortController() : null;
    var t = controller ? setTimeout(function () { controller.abort(); }, 12000) : null;

    fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), signal: controller ? controller.signal : undefined
    }).then(function (res) {
      if (t) clearTimeout(t);
      return res.json().then(function (j) { return { ok: res.ok && j && j.ok, body: j, status: res.status }; },
        function () { return { ok: res.ok, body: null, status: res.status }; });
    }).then(function (r) {
      if (r.ok) { track('booking_submit_success', { notified: !!(r.body && r.body.notified) }); showResult(true, false, !!(r.body && r.body.notified)); }
      else { track('booking_submit_error', { status: r.status, reason: (r.body && r.body.error) || 'rejected' }); showResult(false); }
    }).catch(function (err) {
      if (t) clearTimeout(t);
      // No backend available (static host / network) — route to WhatsApp transparently.
      track('booking_submit_error', { reason: 'network' });
      showResult(false, true);
    });
  });

  function icon(kind) {
    if (kind === 'ok') return '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M8 12.5l2.5 2.5L16 9"/></svg>';
    return '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16v.5"/></svg>';
  }

  function showResult(success, noBackend, notified) {
    if (success) {
      submittedOk = true;
      dirty = false;
    }
    var wa = whatsappUrl();
    var html;
    if (success) {
      var sub = notified
        ? T('success_sub_notified', 'Your request has been emailed to the Vivid Clinic coordination team. They will review it and guide you through the next step.')
        : T('success_sub_unnotified', 'Vivid Clinic will review your request and guide you through the next step. Tip: tap “Continue on WhatsApp” below so the coordinator sees your request right away.');
      html = '<div class="bk-result ok" role="status">' + icon('ok') +
        '<h3>' + esc(T('success_heading', 'Thank you — your request has been received.')) + '</h3>' +
        '<p>' + esc(sub) + '</p>' +
        '<div class="actions">' +
          '<a class="btn btn--whatsapp" href="' + esc(wa) + '" target="_blank" rel="noopener" id="bk-wa">' + esc(T('btn_continue_whatsapp', 'Continue on WhatsApp')) + '</a>' +
          '<a class="btn btn--secondary" href="' + esc(BUSINESS_SITE) + '" target="_blank" rel="noopener">' + esc(T('btn_visit_site', 'Visit vividclinic.net')) + '</a>' +
          '<a class="btn btn--secondary" href="' + esc(REVIEWS_HREF) + '">' + esc(T('btn_back_to_reviews', 'Back to reviews')) + '</a>' +
        '</div></div>';
    } else {
      html = '<div class="bk-result err" role="alert">' + icon('err') +
        '<h3>' + esc(T('error_heading', 'Let’s finish this on WhatsApp')) + '</h3>' +
        '<p>' + esc((noBackend ? T('error_body_no_backend', 'We couldn’t submit the form automatically right now. ') : T('error_body_failed', 'Something went wrong sending your request. ')) +
        T('error_body_common', 'Your details aren’t lost — tap below to send them to the clinic on WhatsApp in one tap.')) + '</p>' +
        '<div class="actions">' +
          '<a class="btn btn--whatsapp" href="' + esc(wa) + '" target="_blank" rel="noopener" id="bk-wa">' + esc(T('btn_continue_whatsapp', 'Continue on WhatsApp')) + '</a>' +
          '<button type="button" class="btn btn--secondary" id="bk-retry">' + esc(T('btn_try_again', 'Try again')) + '</button>' +
        '</div></div>';
    }
    app.innerHTML = html;
    var waBtn = document.getElementById('bk-wa');
    if (waBtn) waBtn.addEventListener('click', function () {
      submittedOk = true;
      dirty = false;
      track('booking_whatsapp_fallback_click', {});
    });
    var retry = document.getElementById('bk-retry');
    if (retry) retry.addEventListener('click', function () { location.reload(); });
    try { app.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
  }

  /* prefill from the estimate widget (estimate.js dispatches this) */
  document.addEventListener('vivid:prefill-booking', function (e) {
    var d = (e && e.detail) || {};
    if (d.category) {
      var cs = document.getElementById('bk-category');
      if (cs) { cs.value = d.category; state.category = d.category; onCategoryChange(); }
      if (d.treatment) {
        var ts = document.getElementById('bk-treatment');
        if (ts) { ts.value = d.treatment; state.treatment = d.treatment; }
      }
    }
    if (d.message) {
      var m = document.getElementById('bk-message');
      if (m) { m.value = d.message; state.message = d.message; }
    }
    showStep(1, true);
  });

  /* init */
  onCategoryChange();
  showStep(1, false);
})();
