#!/usr/bin/env node
// Unit tests for the booking Pages Function (no network, no Cloudflare runtime needed).
// Exercises validateBooking() + handle() using global Request/Response (Node 18+).

import { validateBooking, sanitize, handle, parseRecipients } from '../functions/api/booking.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.error('  ✗ ' + msg); } };

function validPayload(over = {}) {
  const now = Date.now();
  return {
    source: 'vivid.clinic', page: 'reviews-booking-landing',
    utm: { source: 'google', medium: 'cpc', campaign: 'istanbul', term: '', content: '' },
    patient: {
      fullName: 'María García', email: 'maria@example.com', phone: '', whatsapp: '+905551112233',
      country: 'Spain', preferredLanguage: 'english', preferredContactMethod: 'whatsapp', bestTimeToContact: 'afternoons'
    },
    request: {
      category: 'hair-transplant', treatment: 'fue-hair-transplant', timeline: '1-3-months',
      consultationType: 'whatsapp', preferredDate: '2026-08-01', preferredTimeRange: 'morning',
      travelingToIstanbul: 'yes', needsTransferHotelSupport: 'not-sure', message: 'Hello, I have questions (general).',
      previousTreatment: 'no'
    },
    consent: { contactConsent: true, medicalDisclaimerAccepted: true, privacyAccepted: true, marketingConsent: false, consentTimestamp: new Date().toISOString() },
    meta: { userAgent: 'test', submittedAt: new Date().toISOString(), honeypot: '', formStartedAt: now - 10000 },
    ...over
  };
}

/* ---- validateBooking ---- */
ok(validateBooking(validPayload()).ok === true, 'valid payload passes');
ok(sanitize('a, (b) <script>') === 'a, (b) script', 'sanitize keeps commas/parens, drops angle brackets');
ok(sanitize('x'.repeat(50), 10).length === 10, 'sanitize enforces max length');

let r = validateBooking(validPayload({ request: { ...validPayload().request, category: 'nope' } }));
ok(!r.ok && r.errors.includes('category'), 'rejects unknown category');

r = validateBooking(validPayload({ request: { ...validPayload().request, category: 'dentistry', treatment: 'rhinoplasty' } }));
ok(!r.ok && r.errors.includes('treatment'), 'rejects treatment not in category');

r = validateBooking(validPayload({ patient: { ...validPayload().patient, email: '', phone: '', whatsapp: '' } }));
ok(!r.ok && r.errors.includes('contact'), 'requires at least one contact channel');

r = validateBooking(validPayload({ patient: { ...validPayload().patient, email: 'not-an-email' } }));
ok(!r.ok && r.errors.includes('email'), 'rejects invalid email');

r = validateBooking(validPayload({ consent: { contactConsent: false, medicalDisclaimerAccepted: true, privacyAccepted: true } }));
ok(!r.ok && r.errors.includes('contactConsent'), 'requires contact consent');

r = validateBooking(validPayload({ meta: { ...validPayload().meta, honeypot: 'bot-filled' } }));
ok(!r.ok && r.spam === true, 'honeypot rejected as spam');

r = validateBooking(validPayload({ meta: { submittedAt: new Date().toISOString(), formStartedAt: Date.now() - 1000, honeypot: '' } }));
ok(!r.ok && r.spam === true, 'sub-3s submission rejected as spam');

r = validateBooking(validPayload());
ok(r.ok && r.clean.consent.contactConsent === true && r.clean.patient.fullName === 'María García', 'clean payload preserves data + forces consents');

/* ---- parseRecipients (multi-recipient email config) ---- */
ok(JSON.stringify(parseRecipients('info@vividclinic.net,admin@vividclinic.net')) ===
   JSON.stringify(['info@vividclinic.net', 'admin@vividclinic.net']), 'parses comma-separated recipients');
ok(JSON.stringify(parseRecipients(' info@vividclinic.net , admin@vividclinic.net ')) ===
   JSON.stringify(['info@vividclinic.net', 'admin@vividclinic.net']), 'trims whitespace around recipients');
ok(parseRecipients('not-an-email,admin@vividclinic.net').length === 1, 'drops invalid addresses');
ok(parseRecipients('').length === 0 && parseRecipients(undefined).length === 0, 'empty/undefined → no recipients');

/* ---- handle() (HTTP layer) ---- */
const mkReq = (method, body, headers = {}) => new Request('https://vivid.clinic/api/booking', {
  method, headers: { 'Content-Type': 'application/json', Origin: 'https://vivid.clinic', 'CF-Connecting-IP': '203.0.113.' + Math.floor(Math.random() * 250 + 1), ...headers },
  body: body ? JSON.stringify(body) : undefined
});

let res = await handle(mkReq('OPTIONS'), {});
ok(res.status === 204 && res.headers.get('Access-Control-Allow-Origin') === 'https://vivid.clinic', 'OPTIONS preflight returns 204 + CORS for allowed origin');

res = await handle(mkReq('GET'), {});
ok(res.status === 405, 'GET is 405 (POST only)');

res = await handle(mkReq('POST', validPayload(), { 'CF-Connecting-IP': '198.51.100.10' }), {});
let j = await res.json();
ok(res.status === 200 && j.ok === true && j.notified === false && typeof j.id === 'string', 'valid POST → 200 ok:true notified:false (no email provider)');

res = await handle(mkReq('POST', validPayload(), { Origin: 'https://evil.example.com', 'CF-Connecting-IP': '198.51.100.11' }), {});
ok(res.status === 403, 'disallowed Origin → 403');

res = await handle(mkReq('POST', validPayload(), { Origin: 'https://831870d7.vivid-clinic.pages.dev', 'CF-Connecting-IP': '198.51.100.14' }), {});
j = await res.json();
ok(res.status === 200 && j.ok === true, 'own pages.dev preview Origin → 200');

res = await handle(mkReq('POST', validPayload(), { Origin: 'https://evil.vivid-clinic.pages.dev.attacker.com', 'CF-Connecting-IP': '198.51.100.15' }), {});
ok(res.status === 403, 'lookalike pages.dev Origin → 403');

res = await handle(mkReq('POST', validPayload({ request: { ...validPayload().request, category: 'bad' } }), { 'CF-Connecting-IP': '198.51.100.12' }), {});
j = await res.json();
ok(res.status === 400 && j.error === 'validation_failed' && Array.isArray(j.fields), 'invalid POST → 400 with field list');

res = await handle(mkReq('POST', validPayload({ meta: { ...validPayload().meta, honeypot: 'x' } }), { 'CF-Connecting-IP': '198.51.100.13' }), {});
j = await res.json();
ok(res.status === 400 && j.error === 'rejected', 'spam POST → generic 400 (no heuristic leaked)');

// rate limit: 7 rapid POSTs from one IP → at least one 429
let got429 = false;
for (let i = 0; i < 8; i++) {
  const rr = await handle(mkReq('POST', validPayload(), { 'CF-Connecting-IP': '198.51.100.99' }), {});
  if (rr.status === 429) got429 = true;
}
ok(got429, 'rate limiting triggers 429 after the per-window cap');

console.log(`\nBooking backend tests: ${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
