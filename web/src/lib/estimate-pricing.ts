import pricingData from "@/data/generated/estimate-pricing.json";

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
