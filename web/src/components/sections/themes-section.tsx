import { MessageSquareQuote } from "lucide-react";

import { getReviewThemes } from "@/lib/themes";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { fmt } from "@/lib/i18n/format";
import { CountUp } from "@/components/ui/count-up";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";

export function ThemesSection({ dict }: { dict: Dictionary }) {
  const reviewThemes = getReviewThemes(dict);
  if (reviewThemes.length === 0) return null;

  return (
    <section id="themes" aria-labelledby="themes-h" className="bg-secondary/50 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <span className="rounded-full border border-border px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
            {dict.themes.eyebrow}
          </span>
          <h2
            id="themes-h"
            className="mt-5 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
          >
            {dict.themes.heading}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {dict.themes.lead}
          </p>
        </Reveal>

        {/* Cards slide in from alternating sides (2-column layout) and each
            mention count springs up from 0 as it lands. */}
        <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2" stagger={0.08} amount={0.2}>
          {reviewThemes.map((theme, i) => {
            const label = fmt(
              theme.count === 1 ? dict.themes.count_singular : dict.themes.count_plural,
              { count: theme.count },
            );
            // Split the localized "N mentions" string around the number so
            // only the digits animate and the surrounding words stay put.
            const numStr = String(theme.count);
            const at = label.indexOf(numStr);
            const before = at >= 0 ? label.slice(0, at) : "";
            const after = at >= 0 ? label.slice(at + numStr.length) : label;

            return (
              <RevealItem
                key={theme.key}
                direction={i % 2 === 0 ? "right" : "left"}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-hover)]"
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
                    <span className="sr-only">{label}</span>
                    <span aria-hidden="true">
                      {at >= 0 ? (
                        <>
                          {before}
                          <CountUp to={theme.count} duration={1.2} delay={0.2 + i * 0.05} />
                          {after}
                        </>
                      ) : (
                        label
                      )}
                    </span>
                  </div>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
