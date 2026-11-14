import { Globe, ConciergeBell, Compass, Info } from "lucide-react";

import type { Dictionary } from "@/lib/i18n/dictionary";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";

// Copy from the dictionary's "international" catalog group.
export function InternationalSection({ dict }: { dict: Dictionary }) {
  const i = dict.international;
  const FEATURES = [
    { icon: Globe, title: i.f1_title, body: i.f1_body },
    { icon: ConciergeBell, title: i.f2_title, body: i.f2_body },
    { icon: Compass, title: i.f3_title, body: i.f3_body },
  ] as const;

  return (
    <section id="international" aria-labelledby="intl-h" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto mb-10 max-w-2xl text-center">
          <span className="eyebrow-chip">
            {i.eyebrow}
          </span>
          <h2
            id="intl-h"
            className="mt-6 font-[family-name:var(--font-display)] text-[clamp(2.6rem,9vw,5.25rem)] font-medium leading-[0.95] tracking-[-0.025em] text-chrome text-balance hyphens-auto"
          >
            {i.heading}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            {i.lead}
          </p>
        </Reveal>

        <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-3" stagger={0.1} amount={0.2}>
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <RevealItem
              key={title}
              scale={0.97}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-hover)]"
            >
              <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal
          amount={0.8}
          className="mx-auto mt-10 flex max-w-3xl items-start gap-2 rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span>{i.disclaimer}</span>
        </Reveal>
      </div>
    </section>
  );
}
