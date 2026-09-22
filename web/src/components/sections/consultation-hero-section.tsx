import { clinic } from "@/lib/clinic";

// Real copy, ported verbatim from source.en.json's "consult_hero" key.
export function ConsultationHeroSection() {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-gradient-to-b from-primary/[0.06] via-background to-background px-6 pb-16 pt-24 sm:pb-24 sm:pt-32"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <span className="rounded-full border border-border bg-card px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Consultation · Istanbul, Türkiye
        </span>

        <h1 className="mt-6 font-[family-name:var(--font-display)] text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
          Book a Consultation at{" "}
          <span className="italic text-primary">Vivid Clinic</span>
        </h1>

        <p className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-muted-foreground">
          Tell us what you&rsquo;re considering and a Vivid Clinic coordinator
          will guide your next step. Free, no obligation, and available on
          WhatsApp, video, or in clinic.
        </p>

        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <a
            href="#estimate"
            className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-md)] transition-shadow hover:shadow-[var(--shadow-hover)]"
          >
            Get an estimate
          </a>
          <a
            href="#book"
            className="inline-flex items-center justify-center rounded-full border border-border px-7 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Go straight to the form
          </a>
          <a
            href={`${clinic.contact.whatsappUrl}&text=${encodeURIComponent(
              clinic.contact.whatsappPrefill,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-border px-7 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            WhatsApp instead
          </a>
        </div>
      </div>
    </section>
  );
}
