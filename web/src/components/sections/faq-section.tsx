import { faqEntries } from "@/lib/faq";
import { FaqItem } from "@/components/ui/faq-item";

export function FaqSection() {
  return (
    <section id="faq" aria-labelledby="faq-h" className="bg-secondary/50 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mx-auto mb-10 text-center">
          <span className="rounded-full border border-border px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Questions &amp; answers
          </span>
          <h2
            id="faq-h"
            className="mt-5 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
          >
            Frequently asked questions
          </h2>
        </div>

        <div className="rounded-2xl border border-border bg-card px-6 shadow-[var(--shadow-sm)]">
          {faqEntries.map((entry) => (
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
