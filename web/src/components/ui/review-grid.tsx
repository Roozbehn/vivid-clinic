"use client";

import { useMemo, useState } from "react";

import type { LocalizedReview } from "@/lib/review-i18n";
import { ReviewCard } from "@/components/ui/review-card";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { fmt } from "@/lib/i18n/format";

// Sort semantics/labels match the real site's visible sort chips exactly
// (scripts/build-site.mjs's reviewsControls + src/js/reviews.js's
// applyFilters): Featured (featured first, then newest — the default),
// Newest, and Most detailed (longest original review text first). The
// static site also recognizes a hidden `?sort=highest` URL param with no
// visible label of its own, so it's intentionally not offered here.
type SortOrder = "featured" | "newest" | "detailed";

const PAGE_SIZE = 12;

function detailScore(r: LocalizedReview): number {
  return (r.originalText || "").length;
}

export function ReviewGrid({
  reviews,
  dict,
  locale,
}: {
  reviews: LocalizedReview[];
  dict: Dictionary;
  locale: string;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOrder>("featured");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = reviews;
    if (q) {
      result = result.filter((r) => {
        const text = (
          (r.originalText || "") +
          " " +
          (r.translatedText || "") +
          " " +
          (r.localizedText || "")
        ).toLowerCase();
        return r.reviewerName.toLowerCase().includes(q) || text.includes(q);
      });
    }

    const sorted = [...result];
    if (sort === "newest") {
      sorted.sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );
    } else if (sort === "detailed") {
      sorted.sort((a, b) => detailScore(b) - detailScore(a));
    } else {
      // featured: featured first, then newest.
      sorted.sort((a, b) => {
        if (!!b.isFeatured !== !!a.isFeatured) return b.isFeatured ? 1 : -1;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });
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
            {dict.reviews_ui.search_label}
          </label>
          <input
            id="review-search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder={dict.reviews_ui.search_placeholder}
            autoComplete="off"
            className="w-full rounded-full border border-border bg-card px-5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="review-sort" className="text-sm text-muted-foreground">
            {dict.reviews_ui.sort_aria}
          </label>
          <select
            id="review-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOrder)}
            className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="featured">{dict.reviews_ui.chip_sort_featured}</option>
            <option value="newest">{dict.reviews_ui.chip_sort_newest}</option>
            <option value="detailed">{dict.reviews_ui.chip_sort_detailed}</option>
          </select>
        </div>
      </div>

      <p className="mb-6 text-sm text-muted-foreground" aria-live="polite">
        {fmt(dict.reviews_ui.showing_of, { shown: visible.length, total: filtered.length })}
      </p>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          {dict.reviews_ui.no_results}{" "}
          <button
            type="button"
            onClick={() => setQuery("")}
            className="font-medium text-primary underline underline-offset-4"
          >
            {dict.reviews_ui.reset}
          </button>
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((review) => (
            <ReviewCard key={review.id} review={review} dict={dict} locale={locale} />
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
            {dict.reviews_ui.load_more}
          </button>
        </div>
      )}
    </div>
  );
}
