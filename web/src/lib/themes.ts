import { allReviews } from "@/lib/reviews";

// Same theme labels and aggregation the static site uses (scripts/lib.mjs —
// THEME_LABELS / computeThemes): each review was tagged at import time by
// keyword-matching its real text (see README-reviews.md), and this just
// counts how many reviews carry each tag. Nothing here is invented — it's a
// deterministic rollup of the same `tags` field already in the real dataset.
const THEME_LABELS: Record<string, string> = {
  communication: "Clear communication",
  staff: "Friendly staff",
  cleanliness: "Modern, clean clinic",
  doctor: "Confidence in the doctors",
  coordination: "Travel & hotel coordination",
  followup: "Post-op follow-up",
  results: "Happy with results",
  value: "Value for money",
};

export interface ReviewTheme {
  key: string;
  label: string;
  count: number;
}

function computeThemes(): ReviewTheme[] {
  const counts = new Map<string, number>();
  for (const review of allReviews) {
    for (const tag of review.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ key, label: THEME_LABELS[key] ?? key, count }));
}

export const reviewThemes: ReviewTheme[] = computeThemes();
