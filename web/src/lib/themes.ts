import { allReviews } from "@/lib/reviews";
import type { Dictionary } from "@/lib/i18n/dictionary";

// Same theme keys and aggregation the static site uses (scripts/lib.mjs —
// THEME_LABELS / computeThemes): each review was tagged at import time by
// keyword-matching its real text (see README-reviews.md), and this just
// counts how many reviews carry each tag. Nothing here is invented — it's a
// deterministic rollup of the same `tags` field already in the real dataset.
// Labels come from the dictionary (themes.label_<key>) so they're real,
// translated copy rather than hardcoded English.
const THEME_KEYS = [
  "communication",
  "staff",
  "cleanliness",
  "doctor",
  "coordination",
  "followup",
  "results",
  "value",
] as const;

export interface ReviewTheme {
  key: string;
  label: string;
  count: number;
}

function themeLabel(dict: Dictionary, key: string): string {
  const labels = dict.themes as unknown as Record<string, string>;
  return labels[`label_${key}`] ?? key;
}

export function getReviewThemes(dict: Dictionary): ReviewTheme[] {
  const counts = new Map<string, number>();
  for (const review of allReviews) {
    for (const tag of review.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ key, label: themeLabel(dict, key), count }));
}

export { THEME_KEYS };
