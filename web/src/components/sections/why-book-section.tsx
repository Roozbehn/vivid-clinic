import { Info } from "lucide-react";
import { FeatureGrid } from "@/components/ui/feature-grid";
import { getFeatures } from "@/lib/features";
import type { Dictionary } from "@/lib/i18n/dictionary";

// Consultation-page counterpart to the homepage's "Why Vivid Clinic" section
// — reuses the same real features list under a different heading, exactly as
// scripts/build-site.mjs's `whyBookSection` reuses the same `features` array.
export function WhyBookSection({ dict }: { dict: Dictionary }) {
  return (
    <section
      id="why-book"
      aria-labelledby="whyb-h"
      className="bg-card py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="rounded-full border border-border px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
            {dict.why_book.eyebrow}
          </span>
          <h2
            id="whyb-h"
            className="mt-5 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
          >
            {dict.why_book.heading}
          </h2>
        </div>

        <FeatureGrid features={getFeatures(dict)} />

        <div className="mx-auto mt-10 flex max-w-3xl items-start gap-2 rounded-xl border border-border bg-background px-4 py-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span>{dict.common.medical_disclaimer}</span>
        </div>
      </div>
    </section>
  );
}
