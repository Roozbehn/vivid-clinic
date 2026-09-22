import type { GoogleReview } from "@/lib/reviews";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { fmt } from "@/lib/i18n/format";
import { clinic } from "@/lib/clinic";

function Stars({ rating, dict }: { rating: number; dict: Dictionary }) {
  return (
    <div
      className="flex gap-0.5 text-accent"
      aria-label={fmt(dict.common.stars_aria, { n: rating })}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} aria-hidden="true">
          {i < rating ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}

function formatReviewDate(review: GoogleReview, locale: string): string {
  if (locale === "en" && review.relativeDate) return review.relativeDate;
  try {
    return new Date(review.publishedAt).toLocaleDateString(locale);
  } catch {
    return review.relativeDate || new Date(review.publishedAt).toLocaleDateString();
  }
}

export function ReviewCard({
  review,
  dict,
  locale,
}: {
  review: GoogleReview;
  dict: Dictionary;
  locale: string;
}) {
  const languageName = dict.language_names[review.originalLanguage] ?? "";
  const translationLabel = review.translatedText
    ? languageName
      ? fmt(dict.reviews_ui.card_translated_from, { language: languageName })
      : dict.reviews_ui.card_translated_by_google
    : null;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer */}
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
              {formatReviewDate(review, locale)}
            </span>
          </div>
        </div>
        <Stars rating={review.rating} dict={dict} />
      </div>

      {review.originalText && (
        <p className="text-sm leading-relaxed text-foreground">{review.originalText}</p>
      )}

      {review.translatedText && (
        <div className="rounded-xl bg-secondary/40 p-3">
          <p className="mb-1 text-xs italic text-muted-foreground">{translationLabel}</p>
          <p className="text-sm leading-relaxed text-foreground">{review.translatedText}</p>
        </div>
      )}

      {review.ownerReply && (
        <div className="rounded-xl bg-secondary/60 p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-primary">
            {dict.reviews_ui.card_owner_reply_label}
          </p>
          <p className="text-sm leading-relaxed text-secondary-foreground">
            {review.ownerReply}
          </p>
        </div>
      )}

      <a
        href={clinic.googleBusinessProfile.mapsUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-primary"
      >
        {dict.reviews_ui.card_review_on_google}
      </a>
    </article>
  );
}
