import { EstimateTool } from "@/components/ui/estimate-tool";
import { Reveal } from "@/components/ui/reveal";
import { getLocalizedPricing } from "@/lib/estimate-pricing";
import type { Dictionary } from "@/lib/i18n/dictionary";

// Copy from the dictionary's "estimate" catalog group.
export function EstimateSection({ dict }: { dict: Dictionary }) {
  return (
    <section id="estimate" aria-labelledby="est-h" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <span className="eyebrow-chip">
            {dict.estimate.eyebrow}
          </span>
          <h2
            id="est-h"
            className="mt-6 font-[family-name:var(--font-display)] text-[clamp(2.6rem,9vw,5.25rem)] font-medium leading-[0.95] tracking-[-0.025em] text-chrome text-balance hyphens-auto"
          >
            {dict.estimate.heading}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            {dict.estimate.lead}
          </p>
        </Reveal>

        <Reveal delay={0.15} amount="some" scale={0.985}>
          <EstimateTool dict={dict} pricing={getLocalizedPricing(dict)} />
        </Reveal>
      </div>
    </section>
  );
}
