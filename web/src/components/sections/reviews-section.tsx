import { reviewsWithText } from "@/lib/reviews";
import { withReviewLocalization } from "@/lib/review-i18n";
import { ReviewGrid } from "@/components/ui/review-grid";
import { Reveal } from "@/components/ui/reveal";
import type { Dictionary } from "@/lib/i18n/dictionary";

export function ReviewsSection({ dict, locale }: { dict: Dictionary; locale: string }) {
  const reviews = withReviewLocalization(reviewsWithText, locale);
  return (
    <section id="reviews" aria-labelledby="reviews-h" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <h2
            id="reviews-h"
            className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
          >
            {dict.reviews_ui.heading_with_reviews}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {dict.reviews_ui.translation_note}
          </p>
        </Reveal>

        <ReviewGrid reviews={reviews} dict={dict} locale={locale} />

        <Reveal amount={0.8} className="mt-10 text-center text-xs text-muted-foreground" as="p">
          {dict.common.medical_disclaimer}
        </Reveal>
      </div>
    </section>
  );
}
