import { FeatureGrid } from "@/components/ui/feature-grid";
import { Reveal } from "@/components/ui/reveal";
import { getFeatures } from "@/lib/features";
import type { Dictionary } from "@/lib/i18n/dictionary";

export function WhySection({ dict }: { dict: Dictionary }) {
  return (
    <section id="why" aria-labelledby="why-h" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <span className="eyebrow-chip">
            {dict.why.eyebrow}
          </span>
          <h2
            id="why-h"
            className="mt-6 font-[family-name:var(--font-display)] text-[clamp(2.6rem,9vw,5.25rem)] font-medium leading-[0.95] tracking-[-0.025em] text-chrome text-balance hyphens-auto"
          >
            {dict.why.heading}
          </h2>
        </Reveal>

        <FeatureGrid features={getFeatures(dict)} />

        <Reveal as="p" amount={0.8} className="mt-10 text-center text-xs text-muted-foreground">
          {dict.common.medical_disclaimer}
        </Reveal>
      </div>
    </section>
  );
}
