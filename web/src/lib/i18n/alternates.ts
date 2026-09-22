import { DEFAULT_LOCALE, LOCALES, localeHref } from "@/lib/i18n/locales";

// Builds the Next.js Metadata API's `alternates.languages` map for a given
// page path (e.g. "/" or "/consultation/"), covering all 14 locale variants
// plus x-default — mirroring the static site's hreflangBlock() in
// scripts/build-site.mjs, which emits the same set of <link rel="alternate">
// tags on every page. Both "/" and "/consultation/" now exist in every
// locale (Phase A + Phase B — see MIGRATION-STATUS.md), so `path` can be
// either.
export function localeAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {
    [DEFAULT_LOCALE]: `${localeHref(DEFAULT_LOCALE)}${path}`,
  };
  for (const locale of LOCALES) {
    languages[locale.hreflang] = `${localeHref(locale.code)}${path}`;
  }
  languages["x-default"] = `${localeHref(DEFAULT_LOCALE)}${path}`;
  return languages;
}
