"use client";

import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";

import { AUTONYMS, DEFAULT_LOCALE, LOCALE_CODES, localeHref } from "@/lib/i18n/locales";

// Always links to each locale's homepage ("/" or "/<code>/"), not the current
// subpage — the consultation page and the estimate/booking tools aren't
// localized yet (see MIGRATION-STATUS.md), so linking a translated locale
// straight to /consultation/ would either 404 or land on an English-only
// page; the homepage is always a valid, fully translated destination.
const ALL_CODES = [DEFAULT_LOCALE, ...LOCALE_CODES];

export function LanguageSwitcher({
  locale,
  label,
}: {
  locale: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">{AUTONYMS[locale] ?? locale}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-2 max-h-80 w-48 overflow-y-auto rounded-xl border border-border bg-card p-1.5 shadow-[var(--shadow-md)]"
        >
          {ALL_CODES.map((code) => (
            <li key={code}>
              <a
                href={`${localeHref(code)}/`}
                hrefLang={code}
                aria-current={code === locale ? "true" : undefined}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  code === locale
                    ? "bg-secondary font-medium text-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {AUTONYMS[code] ?? code}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
