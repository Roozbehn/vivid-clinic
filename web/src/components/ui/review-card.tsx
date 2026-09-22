import type { GoogleReview } from "@/lib/reviews";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-accent" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} aria-hidden="true">
          {i < rating ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}

export function ReviewCard({ review }: { review: GoogleReview }) {
  const isTranslated =
    review.originalLanguage !== "en" && Boolean(review.translatedText);
  const bodyText = isTranslated ? review.translatedText : review.originalText;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={review.reviewerPhotoUrl}
            alt=""
            width={40}
            height={40}
            loading="lazy"
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
          <div className="flex flex-col">
            <span className="font-medium leading-5 text-foreground">
              {review.reviewerName}
            </span>
            <span className="text-xs leading-5 text-muted-foreground">
              {review.relativeDate || new Date(review.publishedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <Stars rating={review.rating} />
      </div>

      <p className="text-sm leading-relaxed text-foreground">{bodyText}</p>
      {isTranslated && (
        <p className="text-xs italic text-muted-foreground">
          Translated from {review.originalLanguage.toUpperCase()} by Google
        </p>
      )}

      {review.ownerReply && (
        <div className="rounded-xl bg-secondary/60 p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-primary">
            Response from Vivid Clinic
          </p>
          <p className="text-sm leading-relaxed text-secondary-foreground">
            {review.ownerReply}
          </p>
        </div>
      )}
    </article>
  );
}
