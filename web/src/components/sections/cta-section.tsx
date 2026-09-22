import { Phone, Sparkles } from "lucide-react";

import { clinic } from "@/lib/clinic";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { fmt } from "@/lib/i18n/format";
import { localeHref } from "@/lib/i18n/locales";

// Real copy, ported from source.en.json's "cta_band" + "common" keys.
// `hasInlineTools`: true on the English homepage, where the estimate
// calculator (#estimate) and booking form (#book) are embedded on the same
// page (matching the static site's real homepage, which also embeds both) —
// the primary buttons then scroll to them in-page. Translated locale
// homepages don't embed those tools (see MIGRATION-STATUS.md), so there
// `hasInlineTools` is false and the same buttons link to that locale's own
// /consultation/ page instead — which does embed them (Phase B) — rather
// than a dead anchor.
export function CtaSection({
  dict,
  locale,
  hasInlineTools,
}: {
  dict: Dictionary;
  locale: string;
  hasInlineTools: boolean;
}) {
  const whatsappHref = `${clinic.contact.whatsappUrl}&text=${encodeURIComponent(
    clinic.contact.whatsappPrefill,
  )}`;
  const consultationHref = `${localeHref(locale)}/consultation/`;
  const bookHref = hasInlineTools ? "#book" : `${consultationHref}#book`;
  const estimateHref = hasInlineTools ? "#estimate" : `${consultationHref}#estimate`;

  const visitNote = dict.cta_band.visit_note ?? "";
  const [visitBefore, visitAfter] = visitNote.includes("{site_link}")
    ? visitNote.split("{site_link}")
    : [visitNote, ""];

  return (
    <section
      id="contact"
      aria-labelledby="cta-h"
      className="cta-band bg-primary py-20 sm:py-24"
    >
      <div className="mx-auto max-w-3xl px-6 text-center">
        <span className="rounded-full border border-primary-foreground/30 px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground/80">
          {dict.cta_band.eyebrow}
        </span>
        <h2
          id="cta-h"
          className="mt-5 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-primary-foreground sm:text-5xl"
        >
          {dict.cta_band.heading}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-primary-foreground/80">
          {dict.cta_band.lead}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href={bookHref}
            className="inline-flex items-center justify-center rounded-full bg-primary-foreground px-7 py-3 text-sm font-medium text-primary shadow-[var(--shadow-md)] transition-shadow hover:shadow-[var(--shadow-hover)]"
          >
            {dict.common.book_free_consultation}
          </a>
          <a
            href={estimateHref}
            className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 px-7 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {dict.cta_band.btn_estimate ?? dict.common.start_consultation}
          </a>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-primary-foreground/30 px-7 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10"
          >
            {dict.cta_band.btn_whatsapp}
          </a>
          <a
            href={clinic.contact.phonePrimaryHref}
            className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 px-7 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            {fmt(dict.cta_band.btn_call, { phone: clinic.contact.phonePrimaryDisplay })}
          </a>
        </div>

        <p className="mt-6 text-sm text-primary-foreground/70">
          {visitBefore}
          <a
            href={clinic.businessSite}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            {dict.cta_band.visit_link_text}
          </a>
          {visitAfter}
        </p>
      </div>
    </section>
  );
}
