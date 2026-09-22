import { MessageSquareQuote } from "lucide-react";

import { reviewThemes } from "@/lib/themes";

export function ThemesSection() {
  if (reviewThemes.length === 0) return null;

  return (
    <section id="themes" aria-labelledby="themes-h" className="bg-secondary/50 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="rounded-full border border-border px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Review themes
          </span>
          <h2
            id="themes-h"
            className="mt-5 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
          >
            What patients mention most
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            These themes are drawn from the words patients actually used in
            their Google reviews.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {reviewThemes.map((theme) => (
            <div
              key={theme.key}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]"
            >
              <MessageSquareQuote
                className="h-5 w-5 shrink-0 text-accent"
                aria-hidden="true"
              />
              <div>
                <div className="font-medium text-foreground">
                  {theme.label}
                </div>
                <div className="text-sm text-muted-foreground">
                  {theme.count === 1
                    ? "1 review mentions this"
                    : `${theme.count} reviews mention this`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
