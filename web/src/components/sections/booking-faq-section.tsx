import { getBookingFaqEntries } from "@/lib/booking-faq";
import { FaqItem } from "@/components/ui/faq-item";
import type { Dictionary } from "@/lib/i18n/dictionary";

export function BookingFaqSection({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: string;
}) {
  const entries = getBookingFaqEntries(dict, locale);
  return (
    <section
      id="faq"
      aria-labelledby="booking-faq-h"
      className="bg-secondary/50 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-3xl px-6">
        <div className="mx-auto mb-10 text-center">
          <span className="rounded-full border border-border px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
            {dict.faq.eyebrow}
          </span>
          <h2
            id="booking-faq-h"
            className="mt-5 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
          >
            {dict.faq.heading_booking}
          </h2>
        </div>

        <div className="rounded-2xl border border-border bg-card px-6 shadow-[var(--shadow-sm)]">
          {entries.map((entry) => (
            <FaqItem
              key={entry.question}
              question={entry.question}
              answer={entry.answer}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
