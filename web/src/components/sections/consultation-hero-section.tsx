import { clinic } from "@/lib/clinic";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { localeHref } from "@/lib/i18n/locales";

// Copy from the dictionary's "consult_hero" catalog group. Button pattern
// matches scripts/build-site.mjs's real consultationHero markup exactly
// (start_consultation → #book, contact_on_whatsapp → WhatsApp,
// read_patient_reviews → the locale's homepage) rather than the bespoke
// English-only buttons this section originally shipped with.
export function ConsultationHeroSection({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: string;
}) {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-gradient-to-b from-primary/[0.06] via-background to-background px-6 pb-16 pt-24 sm:pb-24 sm:pt-32"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <span className="rounded-full border border-border bg-card px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
          {dict.consult_hero.eyebrow}
        </span>

        <h1 className="mt-6 font-[family-name:var(--font-display)] text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
          {dict.consult_hero.h1}
        </h1>

        <p className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-muted-foreground">
          {dict.consult_hero.lead}
        </p>

        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <a
            href="#book"
            className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-md)] transition-shadow hover:shadow-[var(--shadow-hover)]"
          >
            {dict.common.start_consultation}
          </a>
          <a
            href={`${clinic.contact.whatsappUrl}&text=${encodeURIComponent(
              clinic.contact.whatsappPrefill,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-border px-7 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {dict.common.contact_on_whatsapp}
          </a>
          <a
            href={`${localeHref(locale)}/`}
            className="inline-flex items-center justify-center rounded-full border border-border px-7 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {dict.common.read_patient_reviews}
          </a>
        </div>
      </div>
    </section>
  );
}
