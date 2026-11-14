import { getBookingFaqEntries } from "@/lib/booking-faq";
import { FaqItem } from "@/components/ui/faq-item";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
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
        <Reveal className="mx-auto mb-10 text-center">
          <span className="eyebrow-chip">
            {dict.faq.eyebrow}
          </span>
          <h2
            id="booking-faq-h"
            className="mt-6 font-[family-name:var(--font-display)] text-[clamp(2.6rem,9vw,5.25rem)] font-medium leading-[0.95] tracking-[-0.025em] text-chrome text-balance hyphens-auto"
          >
            {dict.faq.heading_booking}
          </h2>
        </Reveal>

        <RevealGroup
          className="rounded-2xl border border-border bg-card px-6 shadow-[var(--shadow-sm)]"
          stagger={0.06}
          amount={0.1}
        >
          {entries.map((entry) => (
            <RevealItem
              key={entry.question}
              duration={0.5}
              className="border-b border-border last:border-b-0"
            >
              <FaqItem question={entry.question} answer={entry.answer} />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
