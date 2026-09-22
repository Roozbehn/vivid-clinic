import { fromPriceFor, formatMoney } from "@/lib/estimate-pricing";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { fmt } from "@/lib/i18n/format";

// Real FAQ copy, drawn from the dictionary's "booking_faq" catalog group.
// q4's price examples are computed from the repo's real, verified price
// list (estimate-pricing.ts) rather than hardcoded, so they stay correct if
// prices change — the same real-data-only rule the review FAQs follow, and
// the same scheme scripts/build-site.mjs uses for this exact FAQ answer.
export interface FaqEntry {
  question: string;
  answer: string;
}

const PRICE_EXAMPLE_SLUGS = [
  "hair-transplant-treatment",
  "rhinoplasty",
  "breast-implant",
  "gastric-sleeve",
];

export function getBookingFaqEntries(
  dict: Dictionary,
  locale: string,
): FaqEntry[] {
  const names = dict.booking_faq.price_example_treatments;
  const joiner = locale === "fa" ? "، " : ", ";
  const priceExamples = PRICE_EXAMPLE_SLUGS.map((slug, i) => {
    const price = fromPriceFor(slug);
    const name = names[i];
    if (price == null || !name) return null;
    return fmt(dict.booking_faq.price_example_item, {
      name,
      price: formatMoney(price),
    });
  })
    .filter((s): s is string => s != null)
    .join(joiner);

  const b = dict.booking_faq;
  return [
    { question: b.q1, answer: b.a1 },
    { question: b.q2, answer: b.a2 },
    { question: b.q3, answer: b.a3 },
    { question: b.q4, answer: fmt(b.a4, { price_examples: priceExamples }) },
    { question: b.q5, answer: b.a5 },
    { question: b.q6, answer: b.a6 },
  ];
}
