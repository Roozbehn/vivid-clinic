import { Info } from "lucide-react";
import { BookingForm } from "@/components/ui/booking-form";
import { getLocalizedBookingOptions } from "@/lib/booking-options";
import type { Dictionary } from "@/lib/i18n/dictionary";

// Copy from the dictionary's "booking" catalog group.
export function BookingSection({ dict, locale }: { dict: Dictionary; locale: string }) {
  const b = dict.booking;
  const COMPLIANCE_NOTES = [b.compliance_1, b.compliance_2, b.compliance_3, b.compliance_4];

  return (
    <section id="book" aria-labelledby="book-h" className="bg-card py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-10 text-center">
          <span className="rounded-full border border-border px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
            {b.eyebrow}
          </span>
          <h2
            id="book-h"
            className="mt-5 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
          >
            {b.heading}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            {b.lead}
          </p>
        </div>

        <BookingForm dict={dict} options={getLocalizedBookingOptions(dict)} locale={locale} />

        <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 rounded-xl border border-border bg-background px-4 py-3 text-xs text-muted-foreground">
          {COMPLIANCE_NOTES.map((note) => (
            <div key={note} className="flex items-start gap-2">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
              <span>{note}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
