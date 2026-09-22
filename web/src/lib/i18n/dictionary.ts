import en from "@/data/generated/i18n/source.en.json";
import ar from "@/data/generated/i18n/ui.ar.json";
import bg from "@/data/generated/i18n/ui.bg.json";
import de from "@/data/generated/i18n/ui.de.json";
import es from "@/data/generated/i18n/ui.es.json";
import fa from "@/data/generated/i18n/ui.fa.json";
import fr from "@/data/generated/i18n/ui.fr.json";
import he from "@/data/generated/i18n/ui.he.json";
import it from "@/data/generated/i18n/ui.it.json";
import nl from "@/data/generated/i18n/ui.nl.json";
import ru from "@/data/generated/i18n/ui.ru.json";
import tr from "@/data/generated/i18n/ui.tr.json";
import uk from "@/data/generated/i18n/ui.uk.json";
import zh from "@/data/generated/i18n/ui.zh.json";

import { DEFAULT_LOCALE } from "@/lib/i18n/locales";

// Typed view over the repo's real translation catalogs
// (../src/data/i18n/{source.en.json,ui.<code>.json}). source.en.json is the
// English catalog every component's copy is ultimately drawn from (so the
// English route and the 13 translated routes share one source of truth,
// instead of English strings being duplicated in component code); ui.<code>
// are the 13 real translation packs the static site ships, same key shape.
// This covers the subset of the catalog the homepage + shared layout use —
// see MIGRATION-STATUS.md for what's not wired up yet (consultation-page
// strings, js_estimate/js_booking, per-review text translation overlay).
export interface Dictionary {
  common: {
    book_free_consultation: string;
    contact_on_whatsapp: string;
    view_on_google: string;
    whatsapp: string;
    start_consultation: string;
    read_patient_reviews: string;
    book_a_consultation: string;
    medical_disclaimer: string;
    stars_aria: string;
  };
  header: {
    brand_name: string;
    brand_sub_home: string;
    brand_sub_consult: string;
    language_label: string;
  };
  hero: {
    eyebrow: string;
    h1: string;
    lead: string;
    rating_based_on: string;
  };
  summary: {
    heading: string;
  };
  reviews_ui: {
    heading_with_reviews: string;
    search_label: string;
    search_placeholder: string;
    sort_aria: string;
    chip_sort_featured: string;
    chip_sort_newest: string;
    chip_sort_detailed: string;
    showing_of: string;
    no_results: string;
    reset: string;
    load_more: string;
    card_translated_from: string;
    card_translated_by_google: string;
    card_owner_reply_label: string;
    card_review_on_google: string;
    translation_note: string;
  };
  gallery: {
    eyebrow: string;
    heading: string;
    lead: string;
    photo_alt: string;
    uploader_fallback_caption: string;
    see_all_on_google: string;
  };
  themes: {
    eyebrow: string;
    heading: string;
    lead: string;
    count_singular: string;
    count_plural: string;
    label_communication: string;
    label_staff: string;
    label_cleanliness: string;
    label_doctor: string;
    label_coordination: string;
    label_followup: string;
    label_results: string;
    label_value: string;
  };
  features: {
    pin_title: string;
    pin_body: string;
    globe_title: string;
    globe_body: string;
    concierge_title: string;
    concierge_body: string;
    plan_title: string;
    plan_body: string;
    sparkle_title: string;
    sparkle_body: string;
    layers_title: string;
    layers_body: string;
  };
  why: {
    eyebrow: string;
    heading: string;
  };
  why_book: {
    eyebrow: string;
    heading: string;
  };
  cta_band: {
    eyebrow: string;
    heading: string;
    lead: string;
    btn_estimate: string;
    btn_whatsapp: string;
    btn_call: string;
    visit_note: string;
    visit_link_text: string;
  };
  faq: {
    eyebrow: string;
    heading_main: string;
    q1: string;
    a1: string;
    a1_stats: string;
    q2: string;
    a2: string;
    q3: string;
    a3: string;
    q4: string;
    a4: string;
    q5: string;
    a5: string;
    q6: string;
    a6: string;
  };
  footer: {
    about: string;
    link_estimate: string;
    link_main_site: string;
    link_consultation: string;
    link_gallery: string;
    link_google_reviews: string;
    link_whatsapp: string;
    col_heading_follow: string;
    disclaimer: string;
    copyright: string;
    link_privacy: string;
    link_legal: string;
    reviews_last_updated: string;
    reviews_update_note: string;
  };
  language_names: Record<string, string>;
}

const PACKS: Record<string, unknown> = {
  en,
  ar,
  bg,
  de,
  es,
  fa,
  fr,
  he,
  it,
  nl,
  ru,
  tr,
  uk,
  zh,
};

// Recursively fills gaps in a translation pack with the English catalog, so a
// partially-translated key (or one added to English after a pack was last
// generated) never renders as undefined/blank.
function deepMerge<T>(base: T, override: unknown): T {
  if (
    typeof override !== "object" ||
    override === null ||
    typeof base !== "object" ||
    base === null
  ) {
    return (override as T) ?? base;
  }
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, baseValue] of Object.entries(base as Record<string, unknown>)) {
    const overrideValue = (override as Record<string, unknown>)[key];
    result[key] =
      overrideValue == null || overrideValue === ""
        ? baseValue
        : deepMerge(baseValue, overrideValue);
  }
  return result as T;
}

const ENGLISH = en as unknown as Dictionary;

const DICTIONARIES: Record<string, Dictionary> = Object.fromEntries(
  Object.entries(PACKS).map(([code, pack]) => [
    code,
    code === DEFAULT_LOCALE ? ENGLISH : deepMerge(ENGLISH, pack),
  ]),
);

export function getDictionary(locale: string): Dictionary {
  return DICTIONARIES[locale] ?? ENGLISH;
}
