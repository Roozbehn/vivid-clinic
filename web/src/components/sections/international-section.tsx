import { Globe, ConciergeBell, Compass, Info } from "lucide-react";

import type { Dictionary } from "@/lib/i18n/dictionary";

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
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="rounded-full border border-border px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
            {i.eyebrow}
          </span>
          <h2
            id="intl-h"
            className="mt-5 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
          >
            {i.heading}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            {i.lead}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)]"
            >
              <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 flex max-w-3xl items-start gap-2 rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span>{i.disclaimer}</span>
        </div>
      </div>
    </section>
  );
}
