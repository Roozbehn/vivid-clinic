# GEO Analysis — vivid.clinic
**Date:** 10 July 2026 · **Analyst:** Claude (seo-geo skill v1.8.0) · **Pages:** `/` (reviews) + `/consultation/`

---

## 1. GEO Readiness Score: **76 / 100**

| Criterion | Weight | Score | Notes |
|---|---|---|---|
| Citability | 25% | 18/25 | Unique attributed stats + dated; FAQ answers direct but short (22–44w); **zero 134–167w blocks**; no "What is" definition |
| Structural readability | 20% | 16/20 | Clean H1→H2→H3, short paras, FAQ format; **0 tables**, only 5/23 question-style headings |
| Multi-modal | 15% | 11/15 | 11 attributed patient photos, interactive estimate **calculator** (strong signal); no embedded video/infographic |
| Authority & brand | 20% | 13/20 | Org schema + 6-platform sameAs, dates, source attribution, elite GBP (157 × 5.0); **no Wikipedia/Wikidata, weak Reddit, Trustpilot 4★/2 reviews** |
| Technical accessibility | 20% | 18/20 | All AI crawlers allowed, llms.txt live, core content SSR, static + fast; estimate data is JSON-island not semantic HTML; no RSL |

## 2. Platform Breakdown

| Platform | Score | Why |
|---|---|---|
| **Perplexity** | 70/100 | Already answering brand queries **positively**, citing vividclinic.net + DrVisor/Zavis directories that relay the Google 5.0 rating. Category queries dominated by Reddit (46.7% of Perplexity citations) — no Vivid presence there. |
| **Google AI Overviews** | 55/100 | 92% of AIO citations come from top-10 pages; vivid.clinic was indexed **this week** — score is ranking-gated, not structure-gated. No AIO observed on tested queries from TR. |
| **ChatGPT** | 50/100 | ChatGPT sources skew Wikipedia (47.9%) + Reddit (11.3%); brand has neither. GPTBot/OAI-SearchBot/ChatGPT-User all allowed as of today. |

## 3. AI Crawler Access — ✅ ALL ALLOWED (fixed 10 Jul 2026)

`robots.txt` = `User-agent: * / Allow: /` + sitemap. Verified individually: GPTBot ✓ OAI-SearchBot ✓ ChatGPT-User ✓ ClaudeBot ✓ PerplexityBot ✓ CCBot ✓ Bytespider ✓. (Cloudflare's managed robots.txt previously blocked ClaudeBot/GPTBot/Google-Extended — removed via zone settings: "Block AI bots" → Do not block; robots.txt management → Content Signals Policy; mixed-purpose crawlers → continue allowed after Sept 15.)

## 4. llms.txt — ✅ PRESENT (created 10 Jul 2026)

`https://vivid.clinic/llms.txt`, text/plain, llmstxt.org format. H1 + summary + key facts (157 reviews, 5.0, NAP, specialties, languages, hours, no-payment disclaimers) + page map + GBP/main-site links. Regenerates from live data on every `npm run build`. (vividclinic.net has its own via Rank Math.)

## 5. Brand Mention Analysis (mentions correlate 3× stronger than backlinks)

| Surface | Status | Impact |
|---|---|---|
| YouTube (r≈0.737, strongest) | ⚠️ Channel exists (@vivid.clinic), low volume, 1 clinic-tour video surfaced | High upside |
| Reddit | ❌ No meaningful presence; r/HairTransplants gets featured SERP placement on cost queries | High upside |
| Wikipedia/Wikidata | ❌ None (and notability is a real hurdle for a clinic — deprioritize vs. others) | Medium |
| LinkedIn | ✅ Company page active, review-themed posts surfacing in SERPs | OK |
| Directories | ✅ DrVisor (5.0/151), Zavis, TrueClinic (4.8/5), WhatClinic (mid-6/10) — **already being cited by Perplexity** | Working |
| Trustpilot | ⚠️ **4★ from only 2 reviews** — the hedge AI answers quote | **Fix first** |
| Google Business Profile | ✅ Elite: 157 × 5.0 — the root citation source | Maintain |

## 6. Passage-Level Citability (measured)

- 67 paragraphs >5 words; **4** in the 40–60w answer-lead range; **0** in the optimal 134–167w citation range.
- 12 FAQ answers, all 22–44 words — good as direct answers, too thin as standalone citable passages.
- Headings: 23 (H1–H3), clean hierarchy; only **5 question-style**.
- Unique data present and attributed: 157 reviews · 5.0 · 98.1% five-star · distribution 154/3/0/0/0 · "last updated" date. This is genuinely unique first-party data — the site's strongest citability asset.

## 7. Server-Side Rendering Check

| Content | SSR status |
|---|---|
| Review cards (24) + full stats + distribution | ✅ server-rendered HTML |
| FAQ (12 Q&As) | ✅ server-rendered |
| Patient photo gallery (11) | ✅ server-rendered |
| 157-review dataset | ✅ present in HTML as JSON data island |
| Estimate tool (66 treatments + prices) | ⚠️ prices exist in HTML only inside the JSON island; the semantic list renders client-side. AI crawlers (no JS) can read the raw JSON text but it's low-salience |
| Booking form | ❌ client-JS (by design; noscript fallback present — forms aren't citation targets, acceptable) |

## 8. Top 5 Highest-Impact Changes

1. **Trustpilot review campaign** — the single sentence AI keeps hedging with is "Trustpilot shows 4 stars with only a couple of reviews." 20–30 invitations to past Google reviewers flips your weakest cited surface. (Authority, all platforms)
2. **Publish "Hair Transplant Turkey Cost 2026" on vividclinic.net** using the estimate tool's real EUR pricing — every clinic winning that SERP has a dedicated dated cost page; Vivid has the data and no page. Link it to vivid.clinic/consultation/. (Citability + rankings → AIO)
3. **Server-render a semantic "Treatment price guide" block** on `/consultation/` — a static `<table>` of the ~15 most-searched treatments with "from €X" prices (data already in `estimate-pricing.json`; ~20 lines in `build-site.mjs`). Turns the JSON island into extractable HTML with unique numbers. (Citability + SSR)
4. **Expand 3 FAQ answers into 134–167w self-contained blocks** — "Are these reviews real?" (44w→~150w with the import methodology + counts), "Will I receive an exact price?" (+ real from-price examples), "Can I book from outside Turkey?" (+ languages/consult types). Keep the current first sentence as the 40–60w direct answer. (Citability)
5. **Reddit + YouTube presence program** — authentic participation in r/HairTransplants (featured on cost SERPs) and 2–3 YouTube videos matching top queries (YouTube = strongest mention correlate, 0.737). (Brand mentions, ChatGPT/Perplexity)

## 9. Schema Recommendations

Current: `MedicalClinic`/`Organization` (NAP, geo, hours, 6× sameAs), `WebPage`, `FAQPage` — valid on both pages; deliberately **no** self-serving Review/AggregateRating (correct — manual-action risk). Add:
- `ImageGallery`/`ImageObject` for the patient-photos section (uploader attribution as `creditText`) — low effort.
- `WebApplication` (or `SoftwareApplication`) describing the estimate tool as a *free planning tool, no payment* — matches its framing.
- On the future cost-guide page (vividclinic.net): `Article` + dated stats; **not** `Offer`/price schema for medical procedures.
- Wikidata entity for Vivid Clinic (free, no notability bar unlike Wikipedia) linking the sameAs graph — strengthens entity recognition for Gemini/ChatGPT.

## 10. Content Reformatting Suggestions (ready to apply)

- **Add a definition block** under the H1 (40–60w): *"Vivid Clinic is a medical aesthetics and hair restoration clinic in Bakırköy, Istanbul, serving international patients in English, Turkish and Arabic. This page publishes all 157 of its Google reviews — imported unedited via Google's official API — plus a free consultation booking form and treatment cost estimates."*
- **Convert the rating distribution to a semantic `<table>`** (keep the visual bars; add a visually-hidden or small table for extraction): 5★ 154 · 4★ 3 · 3★ 0 · 2★ 0 · 1★ 0.
- **Question-style H2s** where natural: "What do patients say about Vivid Clinic?" (summary), "How much do treatments cost?" (estimate) — matches query phrasing without redesign.
- FAQ expansions per §8.4.

**Not done / out of scope:** RSL 1.0 (optional, low priority for a lead-gen site); DataForSEO MCP checks (no credentials configured in this session).

---
*Method: live robots.txt/llms.txt fetched 10 Jul 2026; passage metrics computed from the deployed build; platform citation baselines from live Perplexity/Google queries logged earlier today.*
