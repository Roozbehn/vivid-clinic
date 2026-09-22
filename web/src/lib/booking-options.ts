import bookingOptionsData from "@/data/generated/booking-options.json";

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
