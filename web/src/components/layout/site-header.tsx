import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { clinic } from "@/lib/clinic";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { localeHref } from "@/lib/i18n/locales";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

// `variant` picks the real site's two brand-subtitle strings
// (header.brand_sub_home / brand_sub_consult). Every locale now has a real
// localized /consultation/ page (see MIGRATION-STATUS.md Phase B), so the
// consultation link is always internal.
export function SiteHeader({
  locale,
  dict,
  variant = "home",
}: {
  locale: string;
  dict: Dictionary;
  variant?: "home" | "consultation";
}) {
  const whatsappHref = `${clinic.contact.whatsappUrl}&text=${encodeURIComponent(
    clinic.contact.whatsappPrefill,
  )}`;
  const home = `${localeHref(locale)}/`;
  const consultation = `${localeHref(locale)}/consultation/`;

  return (
    <header className="sticky top-3 z-40 mx-3 rounded-full border border-border bg-background/70 shadow-[var(--shadow-md)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/45 sm:mx-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 py-2.5 pl-6 pr-2.5">
        <Link href={home} className="flex flex-col leading-tight">
          <span className="font-[family-name:var(--font-display)] text-xl font-semibold text-foreground">
            {dict.header.brand_name}
          </span>
          <span className="hidden whitespace-nowrap text-[11px] uppercase tracking-[0.2em] text-muted-foreground sm:block">
            {variant === "consultation"
              ? dict.header.brand_sub_consult
              : dict.header.brand_sub_home}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={consultation}
            className="hidden items-center rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary sm:inline-flex"
          >
            {dict.common.book_a_consultation}
          </Link>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-hover)]"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            {dict.common.whatsapp}
          </a>
          <LanguageSwitcher locale={locale} label={dict.header.language_label} />
        </div>
      </div>
    </header>
  );
}
