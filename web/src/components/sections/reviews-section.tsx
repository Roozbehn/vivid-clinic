import { reviewsWithText } from "@/lib/reviews";
import { ReviewGrid } from "@/components/ui/review-grid";

export function ReviewsSection() {
  return (
    <section id="reviews" aria-labelledby="reviews-h" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2
            id="reviews-h"
            className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
          >
            Every review, unedited
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            All {reviewsWithText.length} written reviews, straight from Google —
            search or sort to find what matters to you.
          </p>
        </div>

        <ReviewGrid reviews={reviewsWithText} />

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Patient experiences are individual and may vary. A medical
          consultation is required for personalized advice.
        </p>
      </div>
    </section>
  );
}
