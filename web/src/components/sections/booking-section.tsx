import { Info } from "lucide-react";
import { BookingForm } from "@/components/ui/booking-form";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { getLocalizedBookingOptions } from "@/lib/booking-options";
import type { Dictionary } from "@/lib/i18n/dictionary";

// Copy from the dictionary's "booking" catalog group.
export function BookingSection({ dict, locale }: { dict: Dictionary; locale: string }) {
  const b = dict.booking;
  const COMPLIANCE_NOTES = [b.compliance_1, b.compliance_2, b.compliance_3, b.compliance_4];

  return (
    <section id="book" aria-labelledby="book-h" className="bg-card py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal className="mb-10 text-center">
          <span className="eyebrow-chip">
            {b.eyebrow}
          </span>
          <h2
            id="book-h"
            className="mt-6 font-[family-name:var(--font-display)] text-[clamp(2.6rem,9vw,5.25rem)] font-medium leading-[0.95] tracking-[-0.025em] text-chrome text-balance hyphens-auto"
          >
            {b.heading}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            {b.lead}
          </p>
        </Reveal>

        <Reveal delay={0.15} amount="some" scale={0.985}>
          <BookingForm dict={dict} options={getLocalizedBookingOptions(dict)} locale={locale} />
        </Reveal>

        <RevealGroup
          className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 rounded-xl border border-border bg-background px-4 py-3 text-xs text-muted-foreground"
          stagger={0.07}
          amount={0.5}
        >
          {COMPLIANCE_NOTES.map((note) => (
            <RevealItem key={note} direction="left" className="flex items-start gap-2">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
              <span>{note}</span>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
