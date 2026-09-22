# React/shadcn/Tailwind migration — status

This `web/` app is a **new**, parallel front end for vivid.clinic, built with
Next.js (App Router, static export), TypeScript, Tailwind CSS v4, and
shadcn/ui conventions, per the explicit decision to migrate off the
repo-root static HTML/CSS/JS site rather than port the new testimonials
component into it as-is.

**The root-level static site (`/src`, `/scripts`, `npm run build` at repo
root) is untouched and still deploys as-is.** Nothing here changes it. This
folder is additive until it's ready to replace the production build.

## What's done

- Next.js 16 + React 19 + TypeScript + Tailwind v4 scaffolded in `web/`.
- shadcn/ui conventions set up by hand (`components.json`, `src/lib/utils.ts`
  `cn()` helper, CSS-variable theme in `src/app/globals.css`) — the `shadcn`
  CLI's registry (`ui.shadcn.com`) isn't reachable from this build sandbox,
  so components were hand-authored to the same conventions instead of
  `npx shadcn add`. Re-running the CLI from a machine with normal network
  access should work fine if you want to `add` further components later.
- Design tokens ported from the locked Vivid brand system (teal `#0E4B4E`,
  cream `#FAF7F2`, gold `#B8945A`, ink `#1F2937`, Cormorant Garamond +
  Inter) and refined with pixelpoint.io's rhythm: generous vertical spacing,
  wide-tracked uppercase eyebrows, quieter card borders/shadows instead of
  heavy chrome. See `src/app/globals.css`.
- Fonts are **self-hosted** via `next/font/local` (files + OFL licenses in
  `src/app/fonts/`) rather than fetched from Google Fonts at request time —
  faster, works offline, and avoids sending EU visitors' IPs to Google on
  every page load, which matters for an EU/int'l-patient site.
- `motion` (the package named in your brief) installed and used in
  `src/components/ui/testimonials-columns-1.tsx` for the auto-scrolling
  columns effect.
- **Testimonials section fully rebuilt and wired to real data** —
  `src/lib/testimonials.ts` holds 9 real, verbatim excerpts pulled from
  `../src/data/google-reviews.json` (the repo's authorized, GBP-API-sourced
  dataset of 159 real reviews). No placeholder/fabricated review content
  anywhere, per `README-reviews.md`'s compliance rules — same rule this repo
  already enforces on the static site. The medical disclaimer required by
  that doc is preserved in the section footer.
- Hero section rebuilt in the new visual language, with the real 5.0 / 159 /
  98% stats and the real WhatsApp deep link + prefill text from
  `src/data/clinic.json`.
- `next build` (static export to `web/out/`) passes clean: TypeScript
  typecheck, ESLint (0 errors, 2 pre-existing-pattern warnings noted below),
  and static generation all succeed.

## What's NOT done yet (this was a large ask — see the PR for the full list)

The current root site has far more surface area than the hero + testimonials
shown here: score/rating breakdown, the full searchable/filterable review
grid (159 reviews, load-more), "why Vivid", treatment theme chips, patient
photo gallery, price-estimate calculator, booking form (backed by
`functions/api/booking.js`), FAQ, CTA band, "how it works", international-
patient info — and the site's 13-locale (incl. RTL) i18n layer. None of that
is ported into `web/` yet. Porting it all, plus re-verifying the Lighthouse
100/100/100 + JSON-LD/sitemap/indexing behavior the static site currently
has, is realistically its own multi-session project. This migration should
be treated as in progress, not complete — please don't point the production
domain at `web/out/` yet.

## Known sandbox-only artifact

Reviewer avatars (`lh3.googleusercontent.com/...`) won't load when this is
previewed from a network-restricted sandbox (this build environment
included) — that's a local network restriction, not a code bug. They load
normally on any host with normal internet access, exactly as they already
do on the live root site.

## Running it

```bash
cd web
npm install
npm run dev      # http://localhost:3000
npm run build    # static export to web/out/
```
