import { reviewsSummary } from "@/lib/reviews";
import { clinic } from "@/lib/clinic";

const STARS = ["5", "4", "3", "2", "1"] as const;

export function ScoreSummarySection() {
  const { totalReviewCount, averageRating, ratingDistribution } = reviewsSummary;

  return (
    <section
      id="score"
      aria-labelledby="score-h"
      className="bg-secondary/50 py-16 sm:py-20"
    >
      <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 px-6 md:grid-cols-[320px_1fr]">
        <div className="text-center md:text-left">
          <h2 id="score-h" className="sr-only">
            Rating summary
          </h2>
          <div className="font-[family-name:var(--font-display)] text-7xl font-semibold text-primary">
            {averageRating.toFixed(1)}
          </div>
          <div
            className="mt-2 flex justify-center gap-1 text-2xl text-accent md:justify-start"
            aria-hidden="true"
          >
            {"★".repeat(Math.round(averageRating))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Based on {totalReviewCount} Google reviews
          </p>
          <a
            href={clinic.googleBusinessProfile.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm font-medium text-primary underline underline-offset-4"
          >
            View on Google →
          </a>
        </div>

        <div className="flex flex-col gap-2.5">
          {STARS.map((star) => {
            const count = ratingDistribution[star] ?? 0;
            const pct = totalReviewCount > 0 ? (count / totalReviewCount) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3">
                <span className="w-10 shrink-0 text-sm text-muted-foreground">
                  {star}★
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-sm text-muted-foreground">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
