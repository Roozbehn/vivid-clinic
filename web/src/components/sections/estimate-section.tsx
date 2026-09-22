import { EstimateTool } from "@/components/ui/estimate-tool";
import { getLocalizedPricing } from "@/lib/estimate-pricing";
import type { Dictionary } from "@/lib/i18n/dictionary";

// Copy from the dictionary's "estimate" catalog group.
export function EstimateSection({ dict }: { dict: Dictionary }) {
  return (
    <section id="estimate" aria-labelledby="est-h" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="rounded-full border border-border px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
            {dict.estimate.eyebrow}
          </span>
          <h2
            id="est-h"
            className="mt-5 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
          >
            {dict.estimate.heading}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            {dict.estimate.lead}
          </p>
        </div>

        <EstimateTool dict={dict} pricing={getLocalizedPricing(dict)} />
      </div>
    </section>
  );
}
