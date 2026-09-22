import bookingOptionsData from "@/data/generated/booking-options.json";
import type { Dictionary } from "@/lib/i18n/dictionary";

// Typed view over the repo's real booking form option data
// (../src/data/booking-options.json). These are the same category/treatment/
// option lists the original site's 5-step booking wizard (src/js/booking.js)
// uses — reused verbatim, not reinvented.
export interface BookingOption {
  value: string;
  label: string;
}

export interface BookingTreatmentCategory {
  value: string;
  label: string;
  treatments: BookingOption[];
}

interface BookingOptionsDataset {
  categories: BookingTreatmentCategory[];
  timelines: BookingOption[];
  languages: BookingOption[];
  contactMethods: BookingOption[];
  consultationTypes: BookingOption[];
  timeRanges: BookingOption[];
  travelOptions: BookingOption[];
  transferOptions: BookingOption[];
  previousTreatmentOptions: BookingOption[];
  countries: string[];
}

const dataset = bookingOptionsData as unknown as BookingOptionsDataset;

export const treatmentCategories = dataset.categories;
export const timelineOptions = dataset.timelines;
export const languageOptions = dataset.languages;
export const contactMethodOptions = dataset.contactMethods;
export const consultationTypeOptions = dataset.consultationTypes;
export const timeRangeOptions = dataset.timeRanges;
export const travelOptions = dataset.travelOptions;
export const transferOptions = dataset.transferOptions;
export const previousTreatmentOptions = dataset.previousTreatmentOptions;
export const countryOptions = dataset.countries;

export const allTreatments: BookingOption[] = treatmentCategories.flatMap(
  (category) => category.treatments,
);

export const treatmentLabelByValue = new Map(
  allTreatments.map((treatment) => [treatment.value, treatment.label]),
);

// slug → catalog key, matching src/js/booking.js's us() helper exactly.
function us(value: string): string {
  return value.replace(/-/g, "_");
}

export interface LocalizedBookingOptions {
  categories: BookingTreatmentCategory[];
  timelines: BookingOption[];
  languages: BookingOption[];
  contactMethods: BookingOption[];
  consultationTypes: BookingOption[];
  timeRanges: BookingOption[];
  travelOptions: BookingOption[];
  transferOptions: BookingOption[];
  previousTreatmentOptions: BookingOption[];
  countries: string[];
}

// Relabels the (English) option lists from the dictionary's booking_options
// group — values/slugs are untouched (so WhatsApp payloads built from them
// stay stable across locales), only display labels change. This is a direct
// port of src/js/booking.js's own localizeOptions(), which does the same
// relabeling client-side on the static site.
function relabel(
  options: BookingOption[],
  labels: Record<string, string>,
): BookingOption[] {
  return options.map((o) => {
    const label = labels[us(o.value)];
    return label == null ? o : { ...o, label };
  });
}

export function getLocalizedBookingOptions(
  dict: Dictionary,
): LocalizedBookingOptions {
  const opt = dict.booking_options;
  const categories = treatmentCategories.map((cat) => {
    const catLabel = opt.category_labels[us(cat.value)];
    const treatments = cat.treatments.map((tr) => {
      const label = opt.treatment_labels[`${us(cat.value)}__${us(tr.value)}`];
      return label == null ? tr : { ...tr, label };
    });
    return {
      ...cat,
      label: catLabel ?? cat.label,
      treatments,
    };
  });

  return {
    categories,
    timelines: relabel(timelineOptions, opt.timeline_labels),
    languages: relabel(languageOptions, opt.language_labels),
    contactMethods: relabel(contactMethodOptions, opt.contact_method_labels),
    consultationTypes: relabel(consultationTypeOptions, opt.consultation_type_labels),
    timeRanges: relabel(timeRangeOptions, opt.time_range_labels),
    travelOptions: relabel(travelOptions, opt.travel_option_labels),
    transferOptions: relabel(transferOptions, opt.transfer_option_labels),
    previousTreatmentOptions: relabel(
      previousTreatmentOptions,
      opt.previous_treatment_labels,
    ),
    countries:
      opt.countries.length === countryOptions.length
        ? opt.countries
        : countryOptions,
  };
}
