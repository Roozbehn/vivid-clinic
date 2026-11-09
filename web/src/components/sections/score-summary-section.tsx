import { reviewsSummary } from "@/lib/reviews";
import { clinic } from "@/lib/clinic";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { fmt } from "@/lib/i18n/format";
import { CountUp } from "@/components/ui/count-up";
import { RatingBar } from "@/components/ui/rating-bar";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";

const STARS = ["5", "4", "3", "2", "1"] as const;

export function ScoreSummarySection({ dict }: { dict: Dictionary }) {
  const { totalReviewCount, averageRating, ratingDistribution } = reviewsSummary;
  const roundedStars = Math.round(averageRating);

  return (
    <section
      id="score"
      aria-labelledby="score-h"
      className="bg-secondary/50 py-16 sm:py-20"
    >
      <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 px-6 md:grid-cols-[320px_1fr]">
        <Reveal direction="right" className="text-center md:text-left">
          <h2 id="score-h" className="sr-only">
            {dict.summary.heading}
          </h2>
          {/* The headline rating springs up from 0.0 (21st.dev Count Up,
              odometer digits); screen readers get the plain number. */}
          <div className="font-[family-name:var(--font-display)] text-7xl font-semibold text-primary">
            <span className="sr-only">{averageRating.toFixed(1)}</span>
            <span aria-hidden="true">
              <CountUp
                to={averageRating}
                from={0}
                decimals={1}
                duration={1.6}
                digitEffect="slide"
              />
            </span>
          </div>
          <RevealGroup
            className="mt-2 flex justify-center gap-1 text-2xl text-accent md:justify-start"
            stagger={0.07}
            delay={0.5}
            amount={0.6}
          >
            <span aria-hidden="true" className="flex gap-1">
              {Array.from({ length: roundedStars }).map((_, i) => (
                <RevealItem key={i} as="span" direction="none" scale={0.4} duration={0.45}>
                  ★
                </RevealItem>
              ))}
            </span>
          </RevealGroup>
          <p className="mt-3 text-sm text-muted-foreground">
            {fmt(dict.hero.rating_based_on, { count: totalReviewCount })}
          </p>
          <a
            href={clinic.googleBusinessProfile.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm font-medium text-primary underline underline-offset-4"
          >
            {dict.common.view_on_google} →
          </a>
        </Reveal>

        <RevealGroup className="flex flex-col gap-2.5" stagger={0.09} amount={0.4}>
          {STARS.map((star, i) => {
            const count = ratingDistribution[star] ?? 0;
            const pct = totalReviewCount > 0 ? (count / totalReviewCount) * 100 : 0;
            return (
              <RevealItem key={star} direction="left" className="flex items-center gap-3">
                <span className="w-10 shrink-0 text-sm text-muted-foreground">
                  {star}★
                </span>
                <RatingBar pct={pct} delay={0.15 + i * 0.08} />
                <span className="w-10 shrink-0 text-right text-sm text-muted-foreground">
                  <span className="sr-only">{count}</span>
                  <span aria-hidden="true">
                    <CountUp to={count} duration={1.4} delay={0.15 + i * 0.08} />
                  </span>
                </span>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
