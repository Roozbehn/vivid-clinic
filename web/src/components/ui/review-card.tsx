"use client";

import { useState } from "react";

import type { LocalizedReview } from "@/lib/review-i18n";
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

function formatReviewDate(review: LocalizedReview, locale: string): string {
  if (locale === "en" && review.relativeDate) return review.relativeDate;
  try {
    return new Date(review.publishedAt).toLocaleDateString(locale);
  } catch {
    return review.relativeDate || new Date(review.publishedAt).toLocaleDateString();
  }
}

// Faithful port of scripts/build-site.mjs's reviewCard() text logic: when
// this locale has a valid, non-stale translation of the review (localized*
// fields, from lib/review-i18n.ts's per-review overlay), that translation is
// shown as the main body with a "Show original" toggle revealing the
// verbatim source text (and, if the reply wasn't itself translated, the
// original reply too) — the original is always one tap away and always
// authoritative, matching dict.reviews_ui.translation_note. Otherwise this
// falls back to the review exactly as stored: original text plus Google's
// own translatedText chip when present.
export function ReviewCard({
  review,
  dict,
  locale,
}: {
  review: LocalizedReview;
  dict: Dictionary;
  locale: string;
}) {
  const [showOriginal, setShowOriginal] = useState(false);
  const languageName = dict.language_names[review.originalLanguage] ?? "";

  const hasLocalization = review.localizedText != null && !!review.originalText;
  const isTranslatedLocalization = hasLocalization && review.localizedTranslated;

  const translationLabel = review.translatedText
    ? languageName
      ? fmt(dict.reviews_ui.card_translated_from, { language: languageName })
      : dict.reviews_ui.card_translated_by_google
    : null;

  const autoTranslatedLabel = languageName
    ? fmt(dict.reviews_ui.card_auto_translated, { language: languageName })
    : dict.reviews_ui.card_auto_translated_generic;

  const displayedReply =
    isTranslatedLocalization && review.localizedReply
      ? review.localizedReply
      : review.ownerReply;

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

      {isTranslatedLocalization ? (
        <div>
          <p className="text-sm leading-relaxed text-foreground">{review.localizedText}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs italic text-muted-foreground">{autoTranslatedLabel}</span>
            <button
              type="button"
              onClick={() => setShowOriginal((v) => !v)}
              aria-expanded={showOriginal}
              className="text-xs font-medium text-primary underline underline-offset-4"
            >
              {showOriginal ? dict.reviews_ui.card_hide_original : dict.reviews_ui.card_show_original}
            </button>
          </div>
          {showOriginal && (
            <div dir="auto" className="mt-3 border-t border-border pt-3">
              <p className="text-sm leading-relaxed text-foreground">{review.originalText}</p>
              {review.ownerReply && (
                <div className="mt-3 rounded-xl bg-secondary/60 p-4">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-primary">
                    {dict.reviews_ui.card_owner_reply_label}
                  </p>
                  <p className="text-sm leading-relaxed text-secondary-foreground">
                    {review.ownerReply}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : hasLocalization ? (
        // Source review is already in this page's language — shown as-is.
        <p className="text-sm leading-relaxed text-foreground">{review.localizedText}</p>
      ) : (
        <>
          {review.originalText && (
            <p className="text-sm leading-relaxed text-foreground">{review.originalText}</p>
          )}
          {review.translatedText && (
            <div className="rounded-xl bg-secondary/40 p-3">
              <p className="mb-1 text-xs italic text-muted-foreground">{translationLabel}</p>
              <p className="text-sm leading-relaxed text-foreground">{review.translatedText}</p>
            </div>
          )}
        </>
      )}

      {displayedReply && (
        <div className="rounded-xl bg-secondary/60 p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-primary">
            {dict.reviews_ui.card_owner_reply_label}
          </p>
          <p className="text-sm leading-relaxed text-secondary-foreground">{displayedReply}</p>
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
