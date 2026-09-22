import { Info } from "lucide-react";
import { BookingForm } from "@/components/ui/booking-form";

// Real copy, ported verbatim from source.en.json's "booking" key.
const COMPLIANCE_NOTES = [
  "This form is for consultation requests only and does not replace a medical examination.",
  "Patient suitability, treatment planning, and prices can only be confirmed after evaluation.",
  "Your information is used only to respond to your consultation request.",
  "Do not include urgent medical information. For emergencies, contact local emergency services.",
];

export function BookingSection() {
  return (
    <section id="book" aria-labelledby="book-h" className="bg-card py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-10 text-center">
          <span className="rounded-full border border-border px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Consultation
          </span>
          <h2
            id="book-h"
            className="mt-5 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
          >
            Book Your Consultation
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            Share a few details and a Vivid Clinic coordinator will guide you
            to the right specialist. It takes about two minutes — it&rsquo;s
            free, with no obligation, and you can switch to WhatsApp at any
            time.
          </p>
        </div>

        <BookingForm />

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
