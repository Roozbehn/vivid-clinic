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
        <span className="eyebrow-chip">
          {dict.consult_hero.eyebrow}
        </span>

        <h1 className="mt-8 font-[family-name:var(--font-display)] text-[clamp(2.6rem,10vw,6.5rem)] font-medium leading-[0.92] tracking-[-0.03em] text-chrome text-balance hyphens-auto">
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
