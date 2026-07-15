# Master Frontend & UX Report — vivid.clinic

**Date:** 2026-07-15  
**Methods:** frontend-design skill · Web Interface Guidelines (live fetch) · UI/UX Pro Max design-system + domain searches · Codebase read of CSS/JS/build/API · Prior Chrome prod/local form tests  

**Companion docs:**
- [Web Interface Guidelines audit](./2026-07-15-web-interface-guidelines.md)
- [Frontend design analysis](./2026-07-15-frontend-design.md)
- [UI/UX Pro Max analysis](./2026-07-15-ui-ux-pro-max.md)

---

## Executive verdict

vivid.clinic is a **production-grade, compliance-conscious, internationally localized reviews → booking funnel** with an intentional luxury brand system. UX and accessibility are above typical clinic landings. Visual distinctiveness is **good at two moments** (score lockup, desktop editorial reviews) and **generic elsewhere** (card grids, pill chips, brochure hero without place imagery).

| Lens | Grade | One-line |
|------|-------|----------|
| Frontend design / distinctiveness | B− | Luxury tokens correct; composition still template-adjacent |
| Web Interface Guidelines | B+ | Strong a11y/forms; URL state, CLS, `transition: all` gaps |
| UI/UX Pro Max fit | A− | Pattern match excellent; brand correctly overrides medical-kit colors/fonts |

**Do not rewrite the brand.** Optimize composition + WIG hygiene + conversion storytelling.

---

## System map

```
src/data/clinic.json + reviews + i18n
        ↓
scripts/build-site.mjs  →  dist/{,fa,ar,...}/index.html + consultation/
        ↓
src/styles/main.css · src/js/{reviews,estimate,booking}.js
        ↓
Cloudflare Pages + functions/api/booking.js → email notify
```

- **~157** Google reviews (source-of-truth JSON)  
- **14** locales + RTL  
- Static host; API is the only dynamic patient path  

---

## Cross-skill synthesis

### What all three skills agree is strong

1. Tokenized brand system (teal / cream / gold) + Cormorant / Montserrat  
2. Skip links, landmarks, focus treatment, reduced motion  
3. Booking: progressive disclosure, consents, focus-first-error, WA fallback, server allow-lists  
4. Reviews as UGC trust engine (correct landing pattern)  
5. Mobile sticky CTA + safe areas  

### What they disagree on (resolved)

| Tension | Resolution |
|---------|------------|
| Pro Max “Medical Clean” fonts vs Luxury Serif | **Keep Luxury Serif** — brand + aesthetics tourism |
| Pro Max mint medical palette vs cream luxury | **Keep cream/teal/gold** |
| Frontend-design wants bold hero media vs medical conservatism | Use **real clinic / GBP atmospherics**, not stock “spa needles”; keep disclaimers |
| Max motion storytelling vs reduced-motion / quiet brand | Prefer **one load sequence + hairline lists**; skip continuous animation |

### Critical gaps (union of lenses)

| ID | Gap | Skills |
|----|-----|--------|
| G1 | Hero without place/visual anchor | frontend-design, brand rules |
| G2 | Mid-page card / chip SaaS patterns | frontend-design |
| G3 | Filter/search not in URL | WIG, Pro Max nav |
| G4 | Images missing width/height | WIG, Pro Max perf |
| G5 | `transition: all` | WIG, Pro Max animation |
| G6 | Sticky header vs `#` targets (no scroll-margin) | WIG |
| G7 | Trust credentials not structured (only inside reviews) | Pro Max Trust style |
| G8 | First viewport over-budget (score + dual CTA + copy) | brand/user frontend rules |

---

## Prioritized roadmap

### Horizon 0 — Hygiene (1–2 days, low risk)

1. `scroll-margin-top` for sticky header anchors  
2. Replace `transition: all`  
3. Image dimensions / aspect reservations  
4. Label/localize language control + search fields  
5. Estimate add button ≥44px  

### Horizon 1 — Distinctive composition (3–7 days)

1. Editorial hero: atmospherics + brand-forward type; score as second beat  
2. De-card Why / FAQ into hairline / numbered strips  
3. Elevating gallery earlier or fuller-bleed on desktop  
4. Optional languages / specialties meta rail (no pink badges)  

### Horizon 2 — Conversion & shareability (1–2 weeks)

1. Deep-linked review filters  
2. Booking blur validation + dirty-form warn  
3. Analytics-driven section reorder on mobile  
4. Self-host fonts if Lighthouse LCP demands  

---

## Risk register

| Risk | Mitigation |
|------|------------|
| Redesign breaks RTL | Always check `/fa/`, `/ar/`, `/he/` |
| Hero photo looks salesy/medical-stock | Prefer GBP / owned clinic photography; soft crop |
| AggregateRating schema temptation | Keep current compliance stance |
| Scope creep into redesigning entire vividclinic.net | Limit to vivid.clinic landing + CSS/JS |

---

## Evidence already gathered

- Local form (Persian): WA fallback on API 501 — correct.  
- Production form (Persian, 2026-07-15): `POST /api/booking` → `200` `{ok:true, notified:true}` — success UI shown.  
- Fonts: Cormorant + Montserrat with `display=swap` live.  

---

## Brainstorming handoff

This master report is the **context package** for design decisions. Next steps under the brainstorming skill:

1. Clarify which horizon to pursue (hygiene vs hero redesign vs full editorial).  
2. Propose 2–3 approaches with trade-offs.  
3. Present design sections for approval.  
4. Write `docs/superpowers/specs/YYYY-MM-DD-*-design.md` only after approval.  
5. Then `writing-plans` — **no implementation before approval**.

**No code should ship from this document alone.**
