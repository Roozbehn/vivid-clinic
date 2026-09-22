import reviewsData from "@/data/generated/google-reviews.json";

// Shape of the repo's authorized, GBP-API-sourced review dataset
// (../src/data/google-reviews.json — see README-reviews.md). Every field
// here is real; nothing in this app invents review content.
export interface GoogleReview {
  id: string;
  source: string;
  reviewerName: string;
  reviewerPhotoUrl: string;
  rating: number;
  originalText: string | null;
  translatedText: string | null;
  originalLanguage: string;
  publishedAt: string;
  updatedAt: string;
  relativeDate: string;
  ownerReply: string | null;
  ownerReplyAt: string | null;
  reviewUrl: string;
  isFeatured: boolean;
  tags: string[];
}

export interface ReviewsSummary {
  totalReviewCount: number;
  averageRating: number;
  ratingDistribution: Record<"1" | "2" | "3" | "4" | "5", number>;
  languageDistribution: Record<string, number>;
  fiveStarPercentage: number;
  reviewsWithText: number;
  reviewsWithOwnerReply: number;
  latestReviewDate: string;
}

interface ReviewsDataset {
  meta: { source: string; sourceComplete: boolean; lastImportedAt: string };
  summary: ReviewsSummary;
  reviews: GoogleReview[];
}

const dataset = reviewsData as unknown as ReviewsDataset;

export const reviewsSummary = dataset.summary;

// Reviews with real text, newest first — used everywhere the app lists
// individual reviews (there's no reason to show a text-less star-only
// review as a card).
export const reviewsWithText: GoogleReview[] = dataset.reviews
  .filter((r) => (r.originalText && r.originalText.trim().length > 0))
  .sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

export const allReviews: GoogleReview[] = dataset.reviews;
