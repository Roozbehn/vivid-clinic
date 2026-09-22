import pricingData from "@/data/generated/estimate-pricing.json";
import type { Dictionary } from "@/lib/i18n/dictionary";

// Typed view over the repo's real, verified treatment price list
// (../src/data/estimate-pricing.json — see that file's `_note`/`sourceNote`).
// Every "from" price here is a real published starting price, not invented.
export interface PricingCategory {
  value: string;
  label: string;
}

export interface PricingService {
  value: string;
  name: string;
  category: string;
  categoryLabel: string;
  fromPrice: number;
  description: string;
}

export interface PricingPackage {
  value: string;
  name: string;
  procedures: string[];
  discount: number;
  description: string;
}

interface PricingDataset {
  currency: string;
  currencySymbol: string;
  lastUpdatedLabel: string;
  disclaimers: string[];
  categories: PricingCategory[];
  services: PricingService[];
  packages: PricingPackage[];
}

const dataset = pricingData as unknown as PricingDataset;

export const currencySymbol = dataset.currencySymbol;
export const lastUpdatedLabel = dataset.lastUpdatedLabel;
export const estimateDisclaimers = dataset.disclaimers;
export const pricingCategories = dataset.categories;
export const pricingServices = dataset.services;
export const pricingPackages = dataset.packages;

export const pricingByValue = new Map(
  pricingServices.map((service) => [service.value, service]),
);

export function fromPriceFor(slug: string): number | null {
  return pricingByValue.get(slug)?.fromPrice ?? null;
}

export function formatMoney(amount: number): string {
  return `${currencySymbol}${Math.round(amount).toLocaleString("en-GB")}`;
}

// slug → catalog key ("hair-transplant-treatment" → "hair_transplant_treatment"),
// matching scripts/build-site.mjs's us() helper exactly.
function us(value: string): string {
  return value.replace(/-/g, "_");
}

export interface LocalizedPricing {
  currencySymbol: string;
  lastUpdatedLabel: string;
  disclaimers: string[];
  categories: PricingCategory[];
  services: PricingService[];
  packages: PricingPackage[];
}

// Localized copy of the real price list: names/descriptions/category labels
// from the dictionary's estimate_data/treatments/treatment_descriptions/
// bundles/bundle_descriptions groups, aligned with the English data by index
// (treatments/bundles) or by slug (descriptions/category labels) — the same
// scheme scripts/build-site.mjs uses to build its `locPricing` data island.
// English callers can use the plain exports above; this is for the
// consultation page's localized route. Falls back to the English label
// whenever a translated value is missing, so a partial pack never blanks a
// price or treatment name.
export function getLocalizedPricing(dict: Dictionary): LocalizedPricing {
  const categoryLabel = (value: string) =>
    dict.estimate_data.category_labels[us(value)] ??
    pricingCategories.find((c) => c.value === value)?.label ??
    value;

  return {
    currencySymbol,
    lastUpdatedLabel: dict.estimate_data.last_updated_label || lastUpdatedLabel,
    disclaimers:
      dict.estimate_data.disclaimers.length > 0
        ? dict.estimate_data.disclaimers
        : estimateDisclaimers,
    categories: pricingCategories.map((c) => ({
      ...c,
      label: categoryLabel(c.value),
    })),
    services: pricingServices.map((s, i) => ({
      ...s,
      name: dict.treatments[i] || s.name,
      categoryLabel: categoryLabel(s.category),
      description: dict.treatment_descriptions[us(s.value)] ?? s.description,
    })),
    packages: pricingPackages.map((p, i) => ({
      ...p,
      name: dict.bundles[i] || p.name,
      description: dict.bundle_descriptions[us(p.value)] ?? p.description,
    })),
  };
}
