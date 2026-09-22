import { Phone } from "lucide-react";

import { clinic } from "@/lib/clinic";

export function CtaSection() {
  const whatsappHref = `${clinic.contact.whatsappUrl}&text=${encodeURIComponent(
    clinic.contact.whatsappPrefill,
  )}`;

  return (
    <section
      id="contact"
      aria-labelledby="cta-h"
      className="cta-band bg-primary py-20 sm:py-24"
    >
      <div className="mx-auto max-w-3xl px-6 text-center">
        <span className="rounded-full border border-primary-foreground/30 px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground/80">
          Speak with the clinic
        </span>
        <h2
          id="cta-h"
          className="mt-5 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-primary-foreground sm:text-5xl"
        >
          Ready to speak with Vivid Clinic?
        </h2>
        <p className="mt-4 text-base leading-relaxed text-primary-foreground/80">
          Tell the team what you&rsquo;re considering. Initial consultations
          are free, and international patients are welcome to ask questions
          before travelling.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href={clinic.contact.consultationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-primary-foreground px-7 py-3 text-sm font-medium text-primary shadow-[var(--shadow-md)] transition-shadow hover:shadow-[var(--shadow-hover)]"
          >
            Book a Free Consultation
          </a>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-primary-foreground/30 px-7 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10"
          >
            Chat with Us on WhatsApp
          </a>
          <a
            href={clinic.contact.phonePrimaryHref}
            className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 px-7 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            Call {clinic.contact.phonePrimaryDisplay}
          </a>
        </div>

        <p className="mt-6 text-sm text-primary-foreground/70">
          Or visit{" "}
          <a
            href={clinic.businessSite}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            vividclinic.net
          </a>{" "}
          to send a consultation request.
        </p>
      </div>
    </section>
  );
}
