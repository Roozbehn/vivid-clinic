import { EstimateTool } from "@/components/ui/estimate-tool";

// Real copy, ported verbatim from source.en.json's "estimate" key.
export function EstimateSection() {
  return (
    <section id="estimate" aria-labelledby="est-h" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="rounded-full border border-border px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Free estimate
          </span>
          <h2
            id="est-h"
            className="mt-5 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
          >
            Estimate Your Treatment
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            Pick the treatments you&rsquo;re considering for an indicative
            &ldquo;from&rdquo; estimate. It&rsquo;s free, there&rsquo;s no
            online payment and no commitment — a coordinator confirms the
            final pricing after your consultation.
          </p>
        </div>

        <EstimateTool />
      </div>
    </section>
  );
}
