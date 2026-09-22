import { reviewsSummary } from "@/lib/reviews";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { fmt } from "@/lib/i18n/format";

// Real FAQ copy, ported verbatim from the static site's i18n catalog
// (src/data/i18n/source.en.json / ui.<code>.json — "faq" key, q1-q6/a1-a6).
// The a1 answer has a dynamic stats sentence spliced in, computed from the
// same real dataset summary this app already uses for the score section —
// never hardcoded, and now built from the dictionary's own a1_stats template
// so it's correctly worded in every locale.
export interface FaqEntry {
  question: string;
  answer: string;
}

export function getFaqEntries(dict: Dictionary): FaqEntry[] {
  const { totalReviewCount, averageRating, ratingDistribution } = reviewsSummary;
  const statsSentence = ` ${fmt(dict.faq.a1_stats, {
    total: totalReviewCount,
    avg: averageRating,
    five_star_count: ratingDistribution["5"] ?? 0,
    four_star_count: ratingDistribution["4"] ?? 0,
  })}`;

  return [
    { question: dict.faq.q1, answer: fmt(dict.faq.a1, { stats_sentence: statsSentence }) },
    { question: dict.faq.q2, answer: dict.faq.a2 },
    { question: dict.faq.q3, answer: dict.faq.a3 },
    { question: dict.faq.q4, answer: dict.faq.a4 },
    { question: dict.faq.q5, answer: dict.faq.a5 },
    { question: dict.faq.q6, answer: dict.faq.a6 },
  ];
}
