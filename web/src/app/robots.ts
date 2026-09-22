import type { MetadataRoute } from "next";

// Required for `output: "export"` (static export) — see next.config.ts.
export const dynamic = "force-static";

// Matches scripts/build-site.mjs's robots.txt exactly: always allow
// crawling (so Google can read a noindex meta tag rather than being blocked
// from ever seeing it) and always reference the sitemap.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://vivid.clinic/sitemap.xml",
  };
}
