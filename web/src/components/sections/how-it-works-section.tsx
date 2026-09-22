import type { Dictionary } from "@/lib/i18n/dictionary";

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
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="rounded-full border border-border px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
            {h.eyebrow}
          </span>
          <h2
            id="hiw-h"
            className="mt-5 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
          >
            {h.heading}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ title, body }, i) => (
            <div key={title} className="flex flex-col gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-[family-name:var(--font-display)] text-lg font-semibold text-primary-foreground">
                {i + 1}
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
