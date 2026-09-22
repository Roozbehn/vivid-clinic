import { MessageCircle } from "lucide-react";

import { clinic } from "@/lib/clinic";

export function SiteHeader() {
  const whatsappHref = `${clinic.contact.whatsappUrl}&text=${encodeURIComponent(
    clinic.contact.whatsappPrefill,
  )}`;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <a href="#top" className="flex flex-col leading-tight">
          <span className="font-[family-name:var(--font-display)] text-xl font-semibold text-foreground">
            {clinic.name}
          </span>
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Real Patient Reviews
          </span>
        </a>

        <div className="flex items-center gap-2">
          <a
            href={clinic.googleBusinessProfile.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary sm:inline-flex"
          >
            View on Google
          </a>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-hover)]"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp
          </a>
        </div>
      </div>
    </header>
  );
}
