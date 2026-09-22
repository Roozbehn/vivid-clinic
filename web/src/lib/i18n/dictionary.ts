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
// Covers the homepage + shared layout (Phase A) and the consultation page +
// its estimate/booking tools (Phase B) — see MIGRATION-STATUS.md for what's
// still not wired up (e.g. the per-review text translation overlay).
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
    card_auto_translated: string;
    card_auto_translated_generic: string;
    card_show_original: string;
    card_hide_original: string;
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
    heading_booking: string;
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
  consult_hero: {
    eyebrow: string;
    h1: string;
    lead: string;
  };
  estimate: {
    eyebrow: string;
    heading: string;
    lead: string;
    noscript_body: string;
    noscript_whatsapp: string;
  };
  booking: {
    eyebrow: string;
    heading: string;
    lead: string;
    noscript_body: string;
    noscript_form_link: string;
    compliance_1: string;
    compliance_2: string;
    compliance_3: string;
    compliance_4: string;
  };
  how_it_works: {
    eyebrow: string;
    heading: string;
    step1_title: string;
    step1_body: string;
    step2_title: string;
    step2_body: string;
    step3_title: string;
    step3_body: string;
    step4_title: string;
    step4_body: string;
  };
  international: {
    eyebrow: string;
    heading: string;
    lead: string;
    f1_title: string;
    f1_body: string;
    f2_title: string;
    f2_body: string;
    f3_title: string;
    f3_body: string;
    disclaimer: string;
  };
  booking_faq: {
    q1: string;
    a1: string;
    q2: string;
    a2: string;
    q3: string;
    a3: string;
    q4: string;
    a4: string;
    price_example_item: string;
    price_example_treatments: string[];
    q5: string;
    a5: string;
    q6: string;
    a6: string;
  };
  js_estimate: {
    chip_all_treatments: string;
    filter_aria: string;
    search_label: string;
    search_placeholder: string;
    count_singular: string;
    count_plural: string;
    count_shown_suffix: string;
    price_from: string;
    add: string;
    added: string;
    add_aria: string;
    remove_aria: string;
    summary_aria: string;
    card_eyebrow: string;
    empty: string;
    bundle_applied: string;
    total_label: string;
    continue_to_consultation: string;
    send_whatsapp: string;
    disclaimer_last_reviewed: string;
    wa_line_greeting: string;
    wa_line_treatments: string;
    wa_line_estimate: string;
    wa_line_confirm: string;
    wa_line_sent_from: string;
    booking_prefill_message: string;
  };
  js_booking: {
    progress_step1: string;
    progress_step2: string;
    progress_step3: string;
    progress_step4: string;
    progress_step5: string;
    honeypot_label: string;
    step_meta: string;
    step1_legend: string;
    step1_sub: string;
    label_treatment_area: string;
    placeholder_select_area: string;
    label_treatment: string;
    placeholder_choose_area_first: string;
    placeholder_select_treatment: string;
    placeholder_select_default: string;
    label_timeline: string;
    step2_legend: string;
    step2_sub: string;
    label_full_name: string;
    label_country: string;
    label_email: string;
    label_phone: string;
    label_whatsapp_number: string;
    label_preferred_language: string;
    help_one_contact_method: string;
    label_preferred_contact_method: string;
    label_best_time: string;
    placeholder_best_time: string;
    step3_legend: string;
    step3_sub: string;
    label_consultation_type: string;
    label_preferred_date: string;
    label_preferred_time: string;
    label_traveling: string;
    label_transfer_support: string;
    help_transfer_support: string;
    step4_legend: string;
    step4_sub: string;
    label_message: string;
    placeholder_message: string;
    help_message: string;
    label_previous_treatment: string;
    photos_heading: string;
    photos_help: string;
    step5_legend: string;
    step5_sub: string;
    consent_contact: string;
    consent_disclaimer: string;
    consent_privacy: string;
    consent_privacy_link_text: string;
    consent_marketing: string;
    btn_back: string;
    btn_continue: string;
    btn_submit: string;
    btn_sending: string;
    err_category: string;
    err_treatment: string;
    err_timeline: string;
    err_name: string;
    err_email: string;
    err_contact_method: string;
    err_consultation_type: string;
    err_consent: string;
    err_form: string;
    summary_treatment_area: string;
    summary_treatment: string;
    summary_timeline: string;
    summary_name: string;
    summary_country: string;
    summary_contact: string;
    summary_preferred_contact: string;
    summary_consultation: string;
    summary_preferred_date: string;
    summary_preferred_time: string;
    wa_line_greeting: string;
    wa_line_treatment: string;
    wa_line_timeline: string;
    wa_line_name: string;
    wa_line_country: string;
    wa_line_preferred_contact: string;
    wa_line_sent_from: string;
    success_heading: string;
    success_sub_notified: string;
    success_sub_unnotified: string;
    btn_continue_whatsapp: string;
    btn_visit_site: string;
    btn_back_to_reviews: string;
    error_heading: string;
    error_body_no_backend: string;
    error_body_failed: string;
    error_body_common: string;
    btn_try_again: string;
  };
  estimate_data: {
    last_updated_label: string;
    disclaimers: string[];
    category_labels: Record<string, string>;
  };
  treatments: string[];
  treatment_descriptions: Record<string, string>;
  bundles: string[];
  bundle_descriptions: Record<string, string>;
  booking_options: {
    category_labels: Record<string, string>;
    treatment_labels: Record<string, string>;
    timeline_labels: Record<string, string>;
    language_labels: Record<string, string>;
    contact_method_labels: Record<string, string>;
    consultation_type_labels: Record<string, string>;
    time_range_labels: Record<string, string>;
    travel_option_labels: Record<string, string>;
    transfer_option_labels: Record<string, string>;
    previous_treatment_labels: Record<string, string>;
    countries: string[];
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
  // Arrays (e.g. treatments/bundles/disclaimers, index-aligned with the
  // English array) merge element-wise so the result stays an Array — the
  // generic object path below would otherwise spread it into a plain
  // {0: ..., 1: ...} object and break every .map()/.length call on it.
  if (Array.isArray(base)) {
    const overrideArr = Array.isArray(override) ? override : [];
    return base.map((baseValue, i) => {
      const overrideValue = overrideArr[i];
      return overrideValue == null || overrideValue === ""
        ? baseValue
        : deepMerge(baseValue, overrideValue);
    }) as unknown as T;
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
