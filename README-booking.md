# Vivid Clinic — Consultation booking app

A premium, fast, medically-responsible consultation/booking flow added **on top of**
the existing reviews landing page, without changing the review pipeline, indexing
control, SEO, or compliance logic.

> This is **not** a diagnostic tool. It captures consultation *requests* only and never
> implies treatment approval, fixed prices, or guaranteed outcomes.

---

## Architecture

**Cloudflare Pages, static-first** (the deploy target the reviews project already
assumes). No framework was introduced.

- **Frontend:** one vanilla file, [`src/js/booking.js`](src/js/booking.js), renders a
  5-step form into `#booking-app`. Options come from
  [`src/data/booking-options.json`](src/data/booking-options.json) (a JSON island on the
  page). Styling is a section appended to the existing `src/styles/main.css`.
- **Backend:** a Cloudflare Pages Function at
  [`functions/api/booking.js`](functions/api/booking.js) → served at `POST /api/booking`.
- **Fallback:** if the API is unavailable (e.g. a purely static host, or a network
  error), the form transparently routes the lead to a **prefilled WhatsApp message** —
  it never pretends a submission succeeded.

### Where booking appears

- **Embedded** on the reviews page `/` under `#book` (H2 **“Book Your Consultation”** —
  the page’s H1 stays **“Vivid Clinic Reviews”**).
- A dedicated, **always-indexable** page at **`/consultation/`** (its own H1
  **“Book a Consultation at Vivid Clinic”**) with the same form plus *How it works*,
  *Why book*, *International patients*, and a booking FAQ.
- Entry-point CTAs: hero, review summary, review empty state, after the review list,
  the main CTA band, the footer, and the sticky mobile bar.

---

## The form (5 steps)

1. **Treatment interest** — category → dependent treatment dropdown → timeline.
2. **Contact** — name (required), email/phone/WhatsApp (at least one required), country,
   language, preferred contact method (required), best time.
3. **Consultation & travel** — consultation type (required), preferred date/time,
   travelling to Istanbul, travel-coordination interest (framed as *questions*, not a
   guaranteed service).
4. **Optional context** — short message, previous-treatment (Yes/No/Prefer to discuss).
   No photo upload (there is no secure store) — copy points users to WhatsApp for photos.
5. **Review & consent** — a summary of entries + 3 **required** consents (contact,
   medical-disclaimer, privacy/KVKK) + 1 optional marketing consent.

Progress indicator, inline validation, keyboard-accessible chips/inputs, focus moves to
each step heading, session-only state (**never** `localStorage`). Target completion < 2 min.

### Success / failure
- **Success:** “Thank you — your request has been received.” + *Continue on WhatsApp*,
  *Visit vividclinic.net*, *Back to reviews*. (No exact response-time promise.)
- **Failure / no backend:** a WhatsApp-first screen so the lead still reaches the clinic.

---

## Backend (`/api/booking`)

POST-only. It **validates server-side against the same `booking-options.json`** the form
uses (imported, so the allow-lists can’t drift), and:

- Rejects unknown category/treatment/enum values; enforces required fields + max lengths;
  sanitizes strings (strips control chars + angle brackets).
- **Anti-spam:** rejects a filled honeypot and sub-3-second submissions (generic `400`,
  no heuristic leaked).
- **Rate limiting:** best-effort, per-IP, ~6 / 10 min (per isolate — see *Limitations*).
- **CORS:** restricted to `https://vivid.clinic`, `www.vivid.clinic`, and localhost dev
  (extend via `BOOKING_ALLOWED_ORIGIN`). Disallowed origins get `403`.
- **No raw patient data is logged.** Returns clean JSON: `{ ok, id, notified }` or
  `{ ok:false, error, fields? }`.

Run/test locally:

```bash
npm run test:booking                 # 18 unit tests (validation, CORS, method, rate limit)
npx wrangler pages dev dist          # serves dist/ + functions/ at http://localhost:8788
```

### Notifications

- **Email (optional):** set `RESEND_API_KEY` + `CLINIC_NOTIFY_EMAIL` (and optionally
  `BOOKING_FROM_EMAIL`) as Cloudflare Pages env vars → the function emails the clinic on
  each lead and returns `notified:true`.
- **No provider configured:** the function still validates + accepts the lead and returns
  `notified:false`; the frontend **WhatsApp fallback is the delivery channel**. This is
  documented, not hidden.
- **Google Sheets / external CRM storage is intentionally NOT wired up.** Add it only with
  explicit approval.

### WhatsApp fallback message

Includes only non-sensitive fields: treatment category, treatment, timeline, name,
country, preferred contact method. It **excludes** the free-text message, previous-treatment
answer, and any photo reference. Readable for the coordinator, prefilled to the clinic’s
WhatsApp number.

---

## Privacy & compliance

Visible on the form and `/consultation/`:

- “This form is for consultation requests only and does not replace a medical examination.”
- “Patient suitability, treatment planning, and prices can only be confirmed after evaluation.”
- “Your information is used only to respond to your consultation request.”
- “Do not include urgent medical information. For emergencies, contact local emergency services.”

Consent is explicit (3 required checkboxes), captured with a timestamp in the payload. The
existing medical disclaimer remains across the site.

---

## Analytics (privacy-safe)

Events fire to `dataLayer`/`gtag` if present. **No** name, email, phone, WhatsApp number,
message content, medical details, or review text is ever sent — payloads carry only
step number, category/treatment selection, and submit status.

`booking_start`, `booking_step_view`, `booking_step_complete`, `booking_treatment_selected`,
`booking_submit_attempt`, `booking_submit_success`, `booking_submit_error`,
`booking_whatsapp_fallback_click`.

---

## Indexing (unchanged review logic + a decision for /consultation/)

- **`/` and `/reviews/`** keep the **review-based `noindex`**: while there are no real
  reviews, they are `noindex` (and not in the sitemap). Adding booking did **not** change
  this — the reviews page stays out of the index until reviews are imported.
- **`/consultation/` is always indexable.** Decision: it is complete, standalone booking
  content with **no fake reviews and no review dependency**, so it is safe (and useful) to
  index now — you can point ads/SEO at `/consultation/` while the reviews page waits for
  Google API approval. It is always listed in `sitemap.xml`; `/` and `/reviews/` join the
  sitemap only once reviews exist.

---

## Deploy (Cloudflare Pages)

```bash
npm run build                         # writes dist/ (pages) + functions/ deploys alongside
npx wrangler pages deploy dist        # or connect the repo in the Cloudflare dashboard
```

- Build command `npm run build`, output dir `dist`. Cloudflare auto-detects `functions/`
  and deploys `/api/booking`.
- Set booking env vars (Production + Preview): `RESEND_API_KEY`, `CLINIC_NOTIFY_EMAIL`,
  `BOOKING_FROM_EMAIL`, `BOOKING_ALLOWED_ORIGIN` (see `.env.example`).
- On a host **without** Functions support, the form still works via the WhatsApp fallback.

---

## Limitations

- **Rate limiting is per-isolate** (in-memory). For strict global limits, back it with a
  Cloudflare KV namespace (the code has a clear single spot to swap in KV).
- **Anti-spam timing** trusts client timestamps (honeypot + 3s heuristic). A token issued
  server-side would be stronger; honeypot + timing + rate limit is a reasonable baseline.
- **No lead persistence** unless email is configured — by design (no third-party storage
  without approval). WhatsApp is the guaranteed channel meanwhile.
- **No photo upload** — intentional (no secure store); users share photos via WhatsApp.

---

## Files

| File | Role |
|---|---|
| `src/data/booking-options.json` | categories/treatments/enums + server allow-list source |
| `src/js/booking.js` | 5-step form, validation, UTM/honeypot, submit + WhatsApp fallback |
| `src/styles/main.css` | booking section appended to the design system |
| `functions/api/booking.js` | Cloudflare Pages Function: validate, anti-spam, CORS, notify |
| `scripts/build-site.mjs` | embeds booking on `/`, generates `/consultation/`, sitemap |
| `scripts/test-booking.mjs` | backend unit tests (`npm run test:booking`) |
| `.env.example` | booking notification + CORS env placeholders |
