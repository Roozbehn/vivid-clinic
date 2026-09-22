import { Globe, ConciergeBell, Compass, Info } from "lucide-react";

// Real copy, ported verbatim from source.en.json's "international" key.
const FEATURES = [
  {
    icon: Globe,
    title: "Talk before you travel",
    body: "Request a WhatsApp or video consultation first, so you can ask questions before making any decision.",
  },
  {
    icon: ConciergeBell,
    title: "One coordinated point of contact",
    body: "A coordinator helps organise the details around your treatment, from your first message onward.",
  },
  {
    icon: Compass,
    title: "Clear next steps",
    body: "You'll know what's possible and what the next step is — with no pressure and no obligation.",
  },
] as const;

export function InternationalSection() {
  return (
    <section id="international" aria-labelledby="intl-h" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="rounded-full border border-border px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
            International patients
          </span>
          <h2
            id="intl-h"
            className="mt-5 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
          >
            Planning treatment from abroad
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            Vivid Clinic coordinates with international patients in English,
            Turkish and Arabic, and can discuss your treatment plan and
            questions before you travel to Istanbul. Care is hospitality-led,
            from arrival to recovery.
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
          <span>
            This form is for consultation requests only and does not replace
            a medical examination. Patient suitability, treatment planning,
            and prices can only be confirmed after evaluation.
          </span>
        </div>
      </div>
    </section>
  );
}
