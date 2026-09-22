import { FeatureGrid } from "@/components/ui/feature-grid";
import { getFeatures } from "@/lib/features";
import type { Dictionary } from "@/lib/i18n/dictionary";

export function WhySection({ dict }: { dict: Dictionary }) {
  return (
    <section id="why" aria-labelledby="why-h" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="rounded-full border border-border px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
            {dict.why.eyebrow}
          </span>
          <h2
            id="why-h"
            className="mt-5 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
          >
            {dict.why.heading}
          </h2>
        </div>

        <FeatureGrid features={getFeatures(dict)} />

        <p className="mt-10 text-center text-xs text-muted-foreground">
          {dict.common.medical_disclaimer}
        </p>
      </div>
    </section>
  );
}
