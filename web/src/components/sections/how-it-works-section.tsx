import type { Dictionary } from "@/lib/i18n/dictionary";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { StepRail } from "@/components/ui/step-rail";

// Copy from the dictionary's "how_it_works" catalog group.
export function HowItWorksSection({ dict }: { dict: Dictionary }) {
  const h = dict.how_it_works;
  const STEPS = [
    { title: h.step1_title, body: h.step1_body },
    { title: h.step2_title, body: h.step2_body },
    { title: h.step3_title, body: h.step3_body },
    { title: h.step4_title, body: h.step4_body },
  ] as const;

  return (
    <section id="how-it-works" aria-labelledby="hiw-h" className="bg-card py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <span className="eyebrow-chip">
            {h.eyebrow}
          </span>
          <h2
            id="hiw-h"
            className="mt-6 font-[family-name:var(--font-display)] text-[clamp(2.6rem,9vw,5.25rem)] font-medium leading-[0.95] tracking-[-0.025em] text-chrome text-balance hyphens-auto"
          >
            {h.heading}
          </h2>
        </Reveal>

        <div className="relative">
          <StepRail />
          {/* Steps reveal one after another; each number badge pops in
              (scale) just ahead of its text so the eye follows the rail. */}
          <RevealGroup
            as="ol"
            className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
            stagger={0.16}
            amount={0.3}
          >
            {STEPS.map(({ title, body }, i) => (
              <RevealItem key={title} as="li" className="flex flex-col gap-3">
                <RevealItem
                  as="span"
                  direction="none"
                  scale={0.5}
                  duration={0.5}
                  className="relative z-[1] flex h-10 w-10 items-center justify-center rounded-full bg-primary font-[family-name:var(--font-display)] text-lg font-semibold text-primary-foreground shadow-[var(--shadow-md)]"
                >
                  {i + 1}
                </RevealItem>
                <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
