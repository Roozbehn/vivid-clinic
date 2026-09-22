import {
  MapPin,
  Globe,
  ConciergeBell,
  ClipboardCheck,
  Sparkles,
  Layers,
} from "lucide-react";

// Real copy, ported verbatim from the static site's i18n catalog
// (src/data/i18n/source.en.json — "why" and "features" keys), not rewritten.
const FEATURES = [
  {
    icon: MapPin,
    title: "In the heart of Istanbul",
    body: "Vivid Clinic is based in Bakırköy, Istanbul — a convenient base for international patients travelling for treatment.",
  },
  {
    icon: Globe,
    title: "Multilingual coordination",
    body: "Your care is coordinated in English, Turkish and Arabic, so language is never a barrier to the right information.",
  },
  {
    icon: ConciergeBell,
    title: "End-to-end concierge care",
    body: "Hospitality-led support from arrival to recovery — the clinic looks after the details around your treatment.",
  },
  {
    icon: ClipboardCheck,
    title: "Personalised treatment planning",
    body: "Your plan and questions are discussed before you travel, so you arrive in Istanbul knowing what to expect.",
  },
  {
    icon: Sparkles,
    title: "A calm, modern clinic",
    body: "A premium, unhurried environment designed around patient comfort rather than a clinical production line.",
  },
  {
    icon: Layers,
    title: "Specialties under one roof",
    body: "Hair, face, body, breast, weight-loss and dental treatments — coordinated by one team in one place.",
  },
] as const;

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

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Patient experiences are individual and may vary. A medical
          consultation is required for personalized advice.
        </p>
      </div>
    </section>
  );
}
