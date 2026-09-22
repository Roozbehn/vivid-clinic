"use client";

import { useMemo, useState } from "react";
import { Plus, Check, X, MessageCircle } from "lucide-react";

import { clinic } from "@/lib/clinic";
import type { LocalizedPricing } from "@/lib/estimate-pricing";
import type { PricingPackage, PricingService } from "@/lib/estimate-pricing";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { fmt } from "@/lib/i18n/format";

// Faithful port of src/js/estimate.js's behavior: category filter + search,
// per-service add/remove into a selection set, a live summary computing
// subtotal, the best-matching bundle discount (only applied when every
// procedure in a package is selected), and a WhatsApp share of the result.
// Session-only state — nothing is persisted, matching the original widget.
// Every string is drawn from the dictionary's "js_estimate" catalog group
// and the locale-aware price list (estimate-pricing.ts's getLocalizedPricing),
// matching src/js/estimate.js's own i18n handling on the static site.

// estimate category -> booking category, matching src/js/estimate.js's
// CATMAP exactly, so "Continue to consultation" can prefill the booking
// form's treatment area the same way the original widget does.
const CATMAP: Record<string, string> = {
  "body-aesthetics": "plastic-surgery",
  "breast-aesthetics": "plastic-surgery",
  nose: "plastic-surgery",
  face: "plastic-surgery",
  eye: "plastic-surgery",
  genital: "plastic-surgery",
  ear: "plastic-surgery",
  "dental-treatment": "dentistry",
  "weight-loss-surgeries": "weight-loss",
  "medical-aesthetic": "medical-aesthetics",
  "check-up": "other",
  "hair-transplant": "hair-transplant",
  "eye-treatment-surgeries": "other",
};

export interface PrefillBookingDetail {
  category: string;
  treatment: string;
  message: string;
}

// Custom event dispatched on document, matching src/js/estimate.js's
// "vivid:prefill-booking" — BookingForm listens for it to carry the
// estimate-tool selection into the booking form's first step.
export const PREFILL_BOOKING_EVENT = "vivid:prefill-booking";

function computeTotals(selected: Set<string>, pricing: LocalizedPricing) {
  const byValue = new Map(pricing.services.map((s) => [s.value, s]));
  const items: PricingService[] = [];
  selected.forEach((value) => {
    const service = byValue.get(value);
    if (service) items.push(service);
  });
  const subtotal = items.reduce((sum, s) => sum + s.fromPrice, 0);

  let bundle: PricingPackage | null = null;
  let discount = 0;
  for (const pkg of pricing.packages) {
    if (pkg.procedures.length > 1 && pkg.procedures.every((v) => selected.has(v))) {
      const base = pkg.procedures.reduce(
        (sum, v) => sum + (byValue.get(v)?.fromPrice ?? 0),
        0,
      );
      const d = base * pkg.discount;
      if (d > discount) {
        discount = d;
        bundle = pkg;
      }
    }
  }

  return { items, subtotal, discount, bundle, total: subtotal - discount };
}

export function EstimateTool({
  dict,
  pricing,
}: {
  dict: Dictionary;
  pricing: LocalizedPricing;
}) {
  const t = dict.js_estimate;
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const rawMoney = (amount: number) =>
    `${pricing.currencySymbol}${Math.round(amount).toLocaleString("en-GB")}`;
  const money = (amount: number) => fmt(t.price_from, { price: rawMoney(amount) });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pricing.services.filter((s) => {
      const okCat = category === "all" || s.category === category;
      const okQ = !q || s.name.toLowerCase().includes(q);
      return okCat && okQ;
    });
  }, [category, query, pricing.services]);

  const totals = useMemo(() => computeTotals(selected, pricing), [selected, pricing]);

  function toggle(value: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  const whatsappHref = useMemo(() => {
    if (totals.items.length === 0) return null;
    const names = totals.items.map((s) => s.name).join(", ");
    const price = `${pricing.currencySymbol}${Math.round(totals.total).toLocaleString("en-GB")}`;
    const lines = [
      t.wa_line_greeting,
      fmt(t.wa_line_treatments, { names }),
      fmt(t.wa_line_estimate, { price }),
      t.wa_line_confirm,
      t.wa_line_sent_from,
    ];
    return `https://api.whatsapp.com/send/?phone=${encodeURIComponent(
      clinic.contact.whatsappNumber,
    )}&text=${encodeURIComponent(lines.join("\n"))}`;
  }, [totals, t, pricing.currencySymbol]);

  function continueToBooking() {
    const first = totals.items[0];
    const bookingCategory = first ? CATMAP[first.category] ?? "other" : "other";
    const names = totals.items.map((s) => s.name).join(", ");
    const message = fmt(t.booking_prefill_message, {
      names,
      price: rawMoney(totals.total),
    });
    document.dispatchEvent(
      new CustomEvent<PrefillBookingDetail>(PREFILL_BOOKING_EVENT, {
        detail: { category: bookingCategory, treatment: "other", message },
      }),
    );
    const book = document.getElementById("book");
    if (book) book.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const countLabel = fmt(filtered.length === 1 ? t.count_singular : t.count_plural, {
    n: filtered.length,
  });
  const showCountSuffix = category !== "all" || query.trim().length > 0;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <div
          role="group"
          aria-label={t.filter_aria}
          className="mb-5 flex flex-wrap gap-2"
        >
          <button
            type="button"
            onClick={() => setCategory("all")}
            aria-pressed={category === "all"}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              category === "all"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-secondary"
            }`}
          >
            {t.chip_all_treatments}
          </button>
          {pricing.categories.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              aria-pressed={category === c.value}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                category === c.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-secondary"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <label htmlFor="est-q" className="sr-only">
          {t.search_label}
        </label>
        <input
          id="est-q"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search_placeholder}
          autoComplete="off"
          className="mb-3 w-full rounded-full border border-border bg-card px-5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
          {countLabel}
          {showCountSuffix ? t.count_shown_suffix : ""}
        </p>

        <ul className="flex flex-col gap-3">
          {filtered.map((s) => {
            const isSelected = selected.has(s.value);
            return (
              <li
                key={s.value}
                className={`flex items-center justify-between gap-4 rounded-2xl border p-4 transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/[0.04]"
                    : "border-border bg-card"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{s.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {s.description}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="whitespace-nowrap text-sm font-medium text-primary">
                    {money(s.fromPrice)}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggle(s.value)}
                    aria-label={fmt(isSelected ? t.remove_aria : t.add_aria, { name: s.name })}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-foreground hover:bg-secondary"
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        {t.added}
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        {t.add}
                      </>
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <aside aria-label={t.summary_aria} className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)]">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            {t.card_eyebrow}
          </span>

          {totals.items.length === 0 ? (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {t.empty}
            </p>
          ) : (
            <>
              <div className="mt-4 flex flex-col gap-2 border-b border-border pb-4">
                {totals.items.map((s) => (
                  <div
                    key={s.value}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="text-foreground">{s.name}</span>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-muted-foreground">
                        {money(s.fromPrice)}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggle(s.value)}
                        aria-label={fmt(t.remove_aria, { name: s.name })}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {totals.bundle && (
                <p className="mt-3 text-sm font-medium text-primary">
                  {fmt(t.bundle_applied, {
                    name: totals.bundle.name,
                    amount: rawMoney(totals.discount),
                  })}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t.total_label}
                </span>
                <strong className="font-[family-name:var(--font-display)] text-2xl font-semibold text-foreground">
                  {money(totals.total)}
                </strong>
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={continueToBooking}
                  className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-hover)]"
                >
                  {t.continue_to_consultation}
                </button>
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    {t.send_whatsapp}
                  </a>
                )}
              </div>
            </>
          )}

          <ul className="mt-5 flex flex-col gap-1.5 border-t border-border pt-4 text-xs text-muted-foreground">
            {pricing.disclaimers.map((d) => (
              <li key={d}>{d}</li>
            ))}
            {pricing.lastUpdatedLabel && (
              <li>{fmt(t.disclaimer_last_reviewed, { date: pricing.lastUpdatedLabel })}</li>
            )}
          </ul>
        </div>
      </aside>
    </div>
  );
}
