import type { MetadataRoute } from "next";

import { reviewsSummary } from "@/lib/reviews";
import { LOCALES } from "@/lib/i18n/locales";
import { localeAlternates } from "@/lib/i18n/alternates";

// Required for `output: "export"` (static export) — see next.config.ts.
export const dynamic = "force-static";

const SITE_URL = "https://vivid.clinic";

// localeAlternates() returns site-relative paths (right for a page's own
// <link rel="alternate"> tags, resolved against <base>/metadataBase) — a
// sitemap has no such base, so every <xhtml:link> here must be absolute.
function absoluteAlternates(path: string): Record<string, string> {
  const relative = localeAlternates(path);
  return Object.fromEntries(
    Object.entries(relative).map(([hreflang, href]) => [hreflang, `${SITE_URL}${href}`]),
  );
}

// Faithful port of scripts/build-site.mjs's sitemap.xml generation: the same
// URL set and priority scheme (home cluster 1.0/0.8, consultation cluster
// 0.9/0.7, weekly changefreq), using Next's built-in multilingual sitemap
// support (alternates.languages) to emit the same 15-way <xhtml:link>
// alternate block localeAlternates() already builds for page <link
// rel="alternate"> tags — so both stay single-sourced from lib/i18n/locales.ts.
//
// /reviews/ is deliberately not listed: it canonicalizes to "/", and a
// sitemap must only advertise canonical URLs. The home cluster is only
// listed once real reviews are imported (an empty/waiting-state homepage
// should not be indexed or advertised) — /consultation/ has no review
// dependency, so it's always listed.
export default function sitemap(): MetadataRoute.Sitemap {
  const indexable = reviewsSummary.totalReviewCount > 0;
  const lastModified = new Date();
  const entries: MetadataRoute.Sitemap = [];

  if (indexable) {
    entries.push({
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
      alternates: { languages: absoluteAlternates("/") },
    });
    for (const locale of LOCALES) {
      entries.push({
        url: `${SITE_URL}/${locale.code}/`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: { languages: absoluteAlternates("/") },
      });
    }
  }

  entries.push({
    url: `${SITE_URL}/consultation/`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.9,
    alternates: { languages: absoluteAlternates("/consultation/") },
  });
  for (const locale of LOCALES) {
    entries.push({
      url: `${SITE_URL}/${locale.code}/consultation/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: { languages: absoluteAlternates("/consultation/") },
    });
  }

  return entries;
}
