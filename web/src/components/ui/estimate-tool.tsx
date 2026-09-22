"use client";

import { useMemo, useState } from "react";
import { Plus, Check, X, MessageCircle } from "lucide-react";

import { clinic } from "@/lib/clinic";
import {
  currencySymbol,
  estimateDisclaimers,
  lastUpdatedLabel,
  pricingCategories,
  pricingPackages,
  pricingServices,
  type PricingPackage,
  type PricingService,
} from "@/lib/estimate-pricing";

// Faithful port of src/js/estimate.js's behavior: category filter + search,
// per-service add/remove into a selection set, a live summary computing
// subtotal, the best-matching bundle discount (only applied when every
// procedure in a package is selected), and a WhatsApp share of the result.
// Session-only state — nothing is persisted, matching the original widget.
function money(amount: number): string {
  return `${currencySymbol}${Math.round(amount).toLocaleString("en-GB")}`;
}

const pricingByValue = new Map(pricingServices.map((s) => [s.value, s]));

function computeTotals(selected: Set<string>) {
  const items: PricingService[] = [];
  selected.forEach((value) => {
    const service = pricingByValue.get(value);
    if (service) items.push(service);
  });
  const subtotal = items.reduce((sum, s) => sum + s.fromPrice, 0);

  let bundle: PricingPackage | null = null;
  let discount = 0;
  for (const pkg of pricingPackages) {
    if (pkg.procedures.length > 1 && pkg.procedures.every((v) => selected.has(v))) {
      const base = pkg.procedures.reduce(
        (sum, v) => sum + (pricingByValue.get(v)?.fromPrice ?? 0),
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

export function EstimateTool() {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pricingServices.filter((s) => {
      const okCat = category === "all" || s.category === category;
      const okQ = !q || s.name.toLowerCase().includes(q);
      return okCat && okQ;
    });
  }, [category, query]);

  const totals = useMemo(() => computeTotals(selected), [selected]);

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
    const lines = [
      "Hello Vivid Clinic, I used your estimate tool.",
      `• Treatments: ${names}`,
      `• Indicative estimate: from ${money(totals.total)} (estimate only, to be confirmed)`,
      "Please confirm the details and next steps.",
      "(Sent from vivid.clinic)",
    ];
    return `https://api.whatsapp.com/send/?phone=${encodeURIComponent(
      clinic.contact.whatsappNumber,
    )}&text=${encodeURIComponent(lines.join("\n"))}`;
  }, [totals]);

  function continueToBooking() {
    const book = document.getElementById("book");
    if (book) book.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <div
          role="group"
          aria-label="Filter treatments by area"
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
            All treatments
          </button>
          {pricingCategories.map((c) => (
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
          Search treatments
        </label>
        <input
          id="est-q"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search treatments…"
          autoComplete="off"
          className="mb-3 w-full rounded-full border border-border bg-card px-5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
          {filtered.length} treatment{filtered.length === 1 ? "" : "s"}
          {category === "all" && !query ? "" : " shown"}
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
                    from {money(s.fromPrice)}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggle(s.value)}
                    aria-label={
                      isSelected
                        ? `Remove ${s.name}`
                        : `Add ${s.name} to your estimate`
                    }
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-foreground hover:bg-secondary"
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        Added
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        Add
                      </>
                    )}
                  </button>
                </div>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
              No treatments match your search.
            </li>
          )}
        </ul>
      </div>

      <aside aria-label="Your estimate" className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)]">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Your estimate
          </span>

          {totals.items.length === 0 ? (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Add one or more treatments to see an indicative &ldquo;from&rdquo;
              estimate. It&rsquo;s free, with no payment and no commitment.
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
                        from {money(s.fromPrice)}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggle(s.value)}
                        aria-label={`Remove ${s.name}`}
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
                  Bundle &ldquo;{totals.bundle.name}&rdquo; applied · −
                  {money(totals.discount)}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Indicative total
                </span>
                <strong className="font-[family-name:var(--font-display)] text-2xl font-semibold text-foreground">
                  from {money(totals.total)}
                </strong>
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={continueToBooking}
                  className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-hover)]"
                >
                  Continue to consultation
                </button>
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    Send estimate on WhatsApp
                  </a>
                )}
              </div>
            </>
          )}

          <ul className="mt-5 flex flex-col gap-1.5 border-t border-border pt-4 text-xs text-muted-foreground">
            {estimateDisclaimers.map((d) => (
              <li key={d}>{d}</li>
            ))}
            {lastUpdatedLabel && (
              <li>Indicative prices last reviewed {lastUpdatedLabel}.</li>
            )}
          </ul>
        </div>
      </aside>
    </div>
  );
}
