import { FeatureGrid } from "@/components/ui/feature-grid";
import { FEATURES } from "@/lib/features";

export function WhySection() {
  return (
    <section id="why" aria-labelledby="why-h" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="rounded-full border border-border px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Why patients choose Vivid Clinic
          </span>
          <h2
            id="why-h"
            className="mt-5 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
          >
            Reasons that show up again and again
          </h2>
        </div>

        <FeatureGrid features={FEATURES} />

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Patient experiences are individual and may vary. A medical
          consultation is required for personalized advice.
        </p>
      </div>
    </section>
  );
}
