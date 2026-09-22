// Locale config, ported from scripts/build-site.mjs's LOCALES/AUTONYMS. English
// is the default locale (served at "/", no prefix, matching the static site's
// scheme); these 13 are served at "/<code>/". Keep this list in sync with the
// static site's LOCALES array and with src/data/i18n/ui.<code>.json.
export interface LocaleConfig {
  code: string;
  hreflang: string;
  htmlLang: string;
  dir: "ltr" | "rtl";
  og: string;
}

export const DEFAULT_LOCALE = "en" as const;

export const LOCALES: LocaleConfig[] = [
  { code: "ar", hreflang: "ar", htmlLang: "ar", dir: "rtl", og: "ar_AR" },
  { code: "bg", hreflang: "bg", htmlLang: "bg", dir: "ltr", og: "bg_BG" },
  { code: "de", hreflang: "de", htmlLang: "de", dir: "ltr", og: "de_DE" },
  { code: "es", hreflang: "es", htmlLang: "es", dir: "ltr", og: "es_ES" },
  { code: "fa", hreflang: "fa", htmlLang: "fa", dir: "rtl", og: "fa_IR" },
  { code: "fr", hreflang: "fr", htmlLang: "fr", dir: "ltr", og: "fr_FR" },
  { code: "he", hreflang: "he", htmlLang: "he", dir: "rtl", og: "he_IL" },
  { code: "it", hreflang: "it", htmlLang: "it", dir: "ltr", og: "it_IT" },
  { code: "nl", hreflang: "nl", htmlLang: "nl", dir: "ltr", og: "nl_NL" },
  { code: "ru", hreflang: "ru", htmlLang: "ru", dir: "ltr", og: "ru_RU" },
  { code: "tr", hreflang: "tr", htmlLang: "tr", dir: "ltr", og: "tr_TR" },
  { code: "uk", hreflang: "uk", htmlLang: "uk", dir: "ltr", og: "uk_UA" },
  { code: "zh", hreflang: "zh", htmlLang: "zh-CN", dir: "ltr", og: "zh_CN" },
];

export const LOCALE_CODES = LOCALES.map((l) => l.code);

// Language autonyms (each language named in its own script) for the language
// switcher, so visitors can find their language regardless of the page's
// current language.
export const AUTONYMS: Record<string, string> = {
  en: "English",
  ar: "العربية",
  bg: "Български",
  de: "Deutsch",
  es: "Español",
  fa: "فارسی",
  fr: "Français",
  he: "עברית",
  it: "Italiano",
  nl: "Nederlands",
  ru: "Русский",
  tr: "Türkçe",
  uk: "Українська",
  zh: "中文",
};

export function localeConfig(code: string): LocaleConfig | null {
  return LOCALES.find((l) => l.code === code) ?? null;
}

export function isRtl(code: string): boolean {
  return localeConfig(code)?.dir === "rtl";
}

// Builds the base path for a locale ("" for English, "/ar" etc.), so callers
// can do `${localeHref(locale)}/consultation/`.
export function localeHref(code: string): string {
  return code === DEFAULT_LOCALE ? "" : `/${code}`;
}
