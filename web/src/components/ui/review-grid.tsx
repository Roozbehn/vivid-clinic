"use client";

import { useMemo, useState } from "react";

import type { GoogleReview } from "@/lib/reviews";
import { ReviewCard } from "@/components/ui/review-card";

type SortOrder = "newest" | "highest" | "lowest";

const PAGE_SIZE = 12;

export function ReviewGrid({ reviews }: { reviews: GoogleReview[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = reviews;
    if (q) {
      result = result.filter((r) => {
        const text = (r.translatedText || r.originalText || "").toLowerCase();
        return (
          r.reviewerName.toLowerCase().includes(q) || text.includes(q)
        );
      });
    }

    const sorted = [...result];
    if (sort === "highest") {
      sorted.sort((a, b) => b.rating - a.rating);
    } else if (sort === "lowest") {
      sorted.sort((a, b) => a.rating - b.rating);
    } else {
      sorted.sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );
    }
    return sorted;
  }, [reviews, query, sort]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <label htmlFor="review-search" className="sr-only">
            Search reviews
          </label>
          <input
            id="review-search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Search reviews (e.g. rhinoplasty, hair transplant…)"
            autoComplete="off"
            className="w-full rounded-full border border-border bg-card px-5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="review-sort" className="text-sm text-muted-foreground">
            Sort
          </label>
          <select
            id="review-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOrder)}
            className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="newest">Newest</option>
            <option value="highest">Highest rated</option>
            <option value="lowest">Lowest rated</option>
          </select>
        </div>
      </div>

      <p className="mb-6 text-sm text-muted-foreground" aria-live="polite">
        Showing {visible.length} of {filtered.length} reviews
      </p>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No reviews match &ldquo;{query}&rdquo;.{" "}
          <button
            type="button"
            onClick={() => setQuery("")}
            className="font-medium text-primary underline underline-offset-4"
          >
            Clear search
          </button>
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="rounded-full border border-border px-7 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Show more reviews
          </button>
        </div>
      )}
    </div>
  );
}
