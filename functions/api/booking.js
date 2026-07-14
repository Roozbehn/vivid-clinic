// ─────────────────────────────────────────────────────────────────────────────
// Cloudflare Pages Function — POST /api/booking
//
// Accepts a consultation lead from the booking form, validates it server-side
// against the SAME option set the form uses (imported below, so the allow-lists
// can never drift), and optionally emails the clinic. It never logs raw patient
// data, never stores to a third-party CRM, and never exposes secrets.
//
// If no email provider is configured, it still validates + accepts the lead and
// returns { ok:true, notified:false } — the frontend's WhatsApp fallback is then
// the delivery channel (it is always offered on the success screen).
//
// Local dev:  npx wrangler pages dev dist --compatibility-date=2024-01-01
// ─────────────────────────────────────────────────────────────────────────────

import OPTIONS from '../../src/data/booking-options.json' with { type: 'json' };

/* ---- allow-lists derived from the single source of truth ---- */
const setOf = (list) => new Set((list || []).map((o) => o.value));
const CATEGORIES = setOf(OPTIONS.categories);
const TREATMENTS = {};
OPTIONS.categories.forEach((c) => { TREATMENTS[c.value] = setOf(c.treatments); });
const TIMELINES = setOf(OPTIONS.timelines);
const LANGUAGES = setOf(OPTIONS.languages);
const CONTACT_METHODS = setOf(OPTIONS.contactMethods);
const CONSULT_TYPES = setOf(OPTIONS.consultationTypes);
const TIME_RANGES = setOf(OPTIONS.timeRanges);
const TRAVEL = setOf(OPTIONS.travelOptions);
const TRANSFER = setOf(OPTIONS.transferOptions);
const PREV = setOf(OPTIONS.previousTreatmentOptions);

const BASE_ORIGINS = [
  'https://vivid.clinic', 'https://www.vivid.clinic',
  'http://localhost:8787', 'http://127.0.0.1:8787',
  'http://localhost:8788', 'http://127.0.0.1:8788'
];
const MIN_FILL_MS = 3000;
const MAX = { fullName: 120, email: 200, phone: 40, whatsapp: 40, country: 80, bestTime: 120, message: 2000, generic: 120 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ---- helpers ---- */
export function sanitize(v, max) {
  let s = String(v == null ? '' : v);
  s = s.replace(/[\x00-\x1F\x7F]/g, " ").replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
  if (max && s.length > max) s = s.slice(0, max);
  return s;
}
function inSet(v, set) { return !v || set.has(v); }

/* Pure validator — returns { ok, errors:[], clean }. Used by the handler and tests. */
export function validateBooking(body) {
  const errors = [];
  const b = body && typeof body === 'object' ? body : {};
  const patient = b.patient || {}, request = b.request || {}, consent = b.consent || {}, meta = b.meta || {};

  // anti-spam
  if (sanitize(meta.honeypot, 200)) return { ok: false, errors: ['rejected'], spam: true };
  const elapsed = Number(meta.submittedAt ? Date.parse(meta.submittedAt) : 0) - Number(meta.formStartedAt || 0);
  if (Number.isFinite(elapsed) && elapsed >= 0 && elapsed < MIN_FILL_MS) {
    return { ok: false, errors: ['too_fast'], spam: true };
  }

  // required: treatment interest
  const category = sanitize(request.category, MAX.generic);
  const treatment = sanitize(request.treatment, MAX.generic);
  const timeline = sanitize(request.timeline, MAX.generic);
  if (!CATEGORIES.has(category)) errors.push('category');
  if (!TREATMENTS[category] || !TREATMENTS[category].has(treatment)) errors.push('treatment');
  if (!TIMELINES.has(timeline)) errors.push('timeline');

  // required: contact
  const fullName = sanitize(patient.fullName, MAX.fullName);
  const email = sanitize(patient.email, MAX.email);
  const phone = sanitize(patient.phone, MAX.phone);
  const whatsapp = sanitize(patient.whatsapp, MAX.whatsapp);
  const preferredContactMethod = sanitize(patient.preferredContactMethod, MAX.generic);
  if (fullName.length < 2) errors.push('fullName');
  if (email && !EMAIL_RE.test(email)) errors.push('email');
  if (!email && !phone && !whatsapp) errors.push('contact');
  if (!CONTACT_METHODS.has(preferredContactMethod)) errors.push('preferredContactMethod');
  if (!inSet(sanitize(patient.preferredLanguage, MAX.generic), LANGUAGES)) errors.push('preferredLanguage');

  // required: consultation
  const consultationType = sanitize(request.consultationType, MAX.generic);
  if (!CONSULT_TYPES.has(consultationType)) errors.push('consultationType');
  if (!inSet(sanitize(request.preferredTimeRange, MAX.generic), TIME_RANGES)) errors.push('preferredTimeRange');
  if (!inSet(sanitize(request.travelingToIstanbul, MAX.generic), TRAVEL)) errors.push('travelingToIstanbul');
  if (!inSet(sanitize(request.needsTransferHotelSupport, MAX.generic), TRANSFER)) errors.push('needsTransferHotelSupport');
  if (!inSet(sanitize(request.previousTreatment, MAX.generic), PREV)) errors.push('previousTreatment');

  // required: consent
  if (consent.contactConsent !== true) errors.push('contactConsent');
  if (consent.medicalDisclaimerAccepted !== true) errors.push('medicalDisclaimerAccepted');
  if (consent.privacyAccepted !== true) errors.push('privacyAccepted');

  if (errors.length) return { ok: false, errors };

  const clean = {
    createdAt: new Date().toISOString(),
    source: 'vivid.clinic',
    page: sanitize(b.page, 60) || 'reviews-booking-landing',
    utm: {
      source: sanitize((b.utm || {}).source, MAX.generic), medium: sanitize((b.utm || {}).medium, MAX.generic),
      campaign: sanitize((b.utm || {}).campaign, MAX.generic), term: sanitize((b.utm || {}).term, MAX.generic),
      content: sanitize((b.utm || {}).content, MAX.generic)
    },
    patient: {
      fullName, email, phone, whatsapp, country: sanitize(patient.country, MAX.country),
      preferredLanguage: sanitize(patient.preferredLanguage, MAX.generic),
      preferredContactMethod, bestTimeToContact: sanitize(patient.bestTimeToContact, MAX.bestTime)
    },
    request: {
      category, treatment, timeline, consultationType,
      preferredDate: sanitize(request.preferredDate, 40),
      preferredTimeRange: sanitize(request.preferredTimeRange, MAX.generic),
      travelingToIstanbul: sanitize(request.travelingToIstanbul, MAX.generic),
      needsTransferHotelSupport: sanitize(request.needsTransferHotelSupport, MAX.generic),
      message: sanitize(request.message, MAX.message),
      previousTreatment: sanitize(request.previousTreatment, MAX.generic)
    },
    consent: {
      contactConsent: true, medicalDisclaimerAccepted: true, privacyAccepted: true,
      marketingConsent: consent.marketingConsent === true,
      consentTimestamp: sanitize(consent.consentTimestamp, 40) || new Date().toISOString()
    }
  };
  return { ok: true, errors: [], clean };
}

/* ---- best-effort rate limit (per isolate; upgrade to KV for durability) ---- */
const hits = new Map();
function rateLimited(ip) {
  if (!ip) return false;
  const now = Date.now(), windowMs = 10 * 60 * 1000, max = 6;
  const arr = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear(); // crude memory guard
  return arr.length > max;
}

/* ---- optional clinic email notification (no third-party CRM/storage) ---- */
// CLINIC_NOTIFY_EMAIL supports multiple recipients, comma-separated
// (e.g. "info@vividclinic.net,admin@vividclinic.net"). Exported for tests.
export function parseRecipients(value) {
  return String(value || '').split(',').map((s) => s.trim())
    .filter((s) => EMAIL_RE.test(s));
}
async function notifyClinic(env, clean) {
  if (!env || !env.RESEND_API_KEY || !env.CLINIC_NOTIFY_EMAIL) return false;
  const to = parseRecipients(env.CLINIC_NOTIFY_EMAIL);
  if (!to.length) return false;
  const r = clean.request, p = clean.patient;
  const text = [
    'New consultation request via vivid.clinic',
    '',
    `Treatment: ${r.category} / ${r.treatment} (${r.timeline})`,
    `Consultation: ${r.consultationType}  Date: ${r.preferredDate || '-'} ${r.preferredTimeRange || ''}`,
    `Name: ${p.fullName}  Country: ${p.country || '-'}  Language: ${p.preferredLanguage || '-'}`,
    `Email: ${p.email || '-'}  Phone: ${p.phone || '-'}  WhatsApp: ${p.whatsapp || '-'}`,
    `Preferred contact: ${p.preferredContactMethod}  Best time: ${p.bestTimeToContact || '-'}`,
    `Travelling to Istanbul: ${r.travelingToIstanbul || '-'}  Travel coordination: ${r.needsTransferHotelSupport || '-'}`,
    `Previous treatment: ${r.previousTreatment || '-'}`,
    `Marketing opt-in: ${clean.consent.marketingConsent ? 'yes' : 'no'}`,
    r.message ? `\nMessage:\n${r.message}` : '',
    clean.utm.source ? `\nUTM: ${JSON.stringify(clean.utm)}` : ''
  ].join('\n');
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.BOOKING_FROM_EMAIL || 'Vivid Clinic Booking <booking@vivid.clinic>',
        to,
        // reply straight to the patient when they gave an email
        ...(p.email ? { reply_to: p.email } : {}),
        subject: `New consultation request — ${p.fullName} (${r.category} / ${r.treatment})`,
        text
      })
    });
    return res.ok;
  } catch (e) {
    return false; // never throw to the patient over a notification failure
  }
}

/* ---- CORS ---- */
// Own Cloudflare Pages preview deployments (e.g. https://831870d7.vivid-clinic.pages.dev)
// must be able to test the form; their subdomain changes on every deploy.
const PAGES_PREVIEW_RE = /^https:\/\/[a-z0-9-]+\.vivid-clinic\.pages\.dev$/;
function isAllowedOrigin(origin, allowed) {
  return allowed.indexOf(origin) !== -1 || origin === 'https://vivid-clinic.pages.dev' || PAGES_PREVIEW_RE.test(origin);
}
function corsHeaders(origin, env) {
  const allowed = BASE_ORIGINS.concat((env && env.BOOKING_ALLOWED_ORIGIN ? env.BOOKING_ALLOWED_ORIGIN.split(',') : []).map((s) => s.trim()));
  const h = { 'Vary': 'Origin', 'Content-Type': 'application/json' };
  if (origin && isAllowedOrigin(origin, allowed)) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    h['Access-Control-Allow-Headers'] = 'Content-Type';
    h['Access-Control-Max-Age'] = '86400';
  }
  return { headers: h, allowed: !origin || isAllowedOrigin(origin, allowed) };
}
const json = (obj, status, headers) => new Response(JSON.stringify(obj), { status, headers });

/* ---- handler (exported for tests) ---- */
export async function handle(request, env) {
  const origin = request.headers.get('Origin') || '';
  const { headers, allowed } = corsHeaders(origin, env);

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405, headers);
  if (origin && !allowed) return json({ ok: false, error: 'forbidden_origin' }, 403, headers);

  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (rateLimited(ip)) return json({ ok: false, error: 'rate_limited' }, 429, headers);

  let body;
  try {
    const raw = await request.text();
    if (raw.length > 20000) return json({ ok: false, error: 'payload_too_large' }, 413, headers);
    body = JSON.parse(raw);
  } catch (e) {
    return json({ ok: false, error: 'invalid_json' }, 400, headers);
  }

  const result = validateBooking(body);
  if (!result.ok) {
    // Bots (honeypot/too-fast) get a generic 400; do not reveal which heuristic fired.
    if (result.spam) return json({ ok: false, error: 'rejected' }, 400, headers);
    return json({ ok: false, error: 'validation_failed', fields: result.errors }, 400, headers);
  }

  const id = (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : ('bk_' + Date.now());
  const notified = await notifyClinic(env, result.clean);
  // NOTE: we deliberately do not log result.clean (no raw patient data in logs).
  return json({ ok: true, id, notified }, 200, headers);
}

export const onRequest = (context) => handle(context.request, context.env);
