"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { MessageCircle } from "lucide-react";

import { clinic } from "@/lib/clinic";
import type { LocalizedBookingOptions } from "@/lib/booking-options";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { fmt } from "@/lib/i18n/format";
import { localeHref } from "@/lib/i18n/locales";
import {
  PREFILL_BOOKING_EVENT,
  type PrefillBookingDetail,
} from "@/components/ui/estimate-tool";

// Simplified, faithful port of src/js/booking.js: the original site runs this
// as a 5-step wizard, but every field here collects the same data with the
// same validation, just on a single page (a deliberate scope simplification
// — see web/MIGRATION-STATUS.md). There is no backend to submit to (this is
// a static export), so this form goes straight to the original's own
// designed fallback: composing a WhatsApp message from the answers. That
// mirrors src/js/booking.js's own behavior, which falls back to WhatsApp
// whenever its POST to /api/booking fails. Session-only state — nothing is
// persisted or sent anywhere except the WhatsApp deep link the visitor opens
// themselves. Every string is drawn from the dictionary's "js_booking" and
// "common" catalog groups, and option labels from the locale-aware
// booking-options.ts (getLocalizedBookingOptions).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function labelFor(list: { value: string; label: string }[], value: string) {
  return list.find((o) => o.value === value)?.label ?? value;
}

interface FormState {
  category: string;
  treatment: string;
  timeline: string;
  fullName: string;
  email: string;
  phone: string;
  whatsapp: string;
  country: string;
  preferredLanguage: string;
  preferredContactMethod: string;
  bestTimeToContact: string;
  consultationType: string;
  preferredDate: string;
  preferredTimeRange: string;
  travelingToIstanbul: string;
  needsTransferHotelSupport: string;
  message: string;
  previousTreatment: string;
  contactConsent: boolean;
  medicalDisclaimerAccepted: boolean;
  privacyAccepted: boolean;
  marketingConsent: boolean;
}

const INITIAL_STATE: FormState = {
  category: "",
  treatment: "",
  timeline: "",
  fullName: "",
  email: "",
  phone: "",
  whatsapp: "",
  country: "",
  preferredLanguage: "",
  preferredContactMethod: "",
  bestTimeToContact: "",
  consultationType: "",
  preferredDate: "",
  preferredTimeRange: "",
  travelingToIstanbul: "",
  needsTransferHotelSupport: "",
  message: "",
  previousTreatment: "",
  contactConsent: false,
  medicalDisclaimerAccepted: false,
  privacyAccepted: false,
  marketingConsent: false,
};

function ChipGroup({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <label
          key={o.value}
          className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
            value === o.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:bg-secondary"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="sr-only"
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

export function BookingForm({
  dict,
  options,
  locale,
}: {
  dict: Dictionary;
  options: LocalizedBookingOptions;
  locale: string;
}) {
  const t = dict.js_booking;
  const [state, setState] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  // Carries a selection made in the estimate tool into this form's first
  // step, matching src/js/estimate.js's continueToBooking() + src/js/
  // booking.js's own listener for the same "vivid:prefill-booking" event.
  useEffect(() => {
    function onPrefill(e: Event) {
      const detail = (e as CustomEvent<PrefillBookingDetail>).detail;
      if (!detail) return;
      setState((prev) => ({
        ...prev,
        category: detail.category || prev.category,
        treatment: detail.treatment || prev.treatment,
        message: detail.message || prev.message,
      }));
    }
    document.addEventListener(PREFILL_BOOKING_EVENT, onPrefill);
    return () => document.removeEventListener(PREFILL_BOOKING_EVENT, onPrefill);
  }, []);

  const treatments = useMemo(
    () =>
      options.categories.find((c) => c.value === state.category)?.treatments ?? [],
    [options.categories, state.category],
  );

  const whatsappHref = useMemo(() => {
    const lines = [t.wa_line_greeting];
    const catLabel = labelFor(options.categories, state.category);
    const treatLabel = state.treatment ? labelFor(treatments, state.treatment) : "";
    if (state.category) {
      lines.push(
        fmt(t.wa_line_treatment, {
          category: catLabel,
          treatment: treatLabel || catLabel,
        }),
      );
    }
    if (state.timeline) {
      lines.push(fmt(t.wa_line_timeline, { timeline: labelFor(options.timelines, state.timeline) }));
    }
    if (state.fullName) lines.push(fmt(t.wa_line_name, { name: state.fullName }));
    if (state.country) lines.push(fmt(t.wa_line_country, { country: state.country }));
    if (state.preferredContactMethod) {
      lines.push(
        fmt(t.wa_line_preferred_contact, {
          method: labelFor(options.contactMethods, state.preferredContactMethod),
        }),
      );
    }
    lines.push(t.wa_line_sent_from);
    return `https://api.whatsapp.com/send/?phone=${encodeURIComponent(
      clinic.contact.whatsappNumber,
    )}&text=${encodeURIComponent(lines.join("\n"))}`;
  }, [state, treatments, options, t]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!state.category) next.category = t.err_category;
    if (!state.treatment) next.treatment = t.err_treatment;
    if (!state.timeline) next.timeline = t.err_timeline;
    if (!state.fullName || state.fullName.trim().length < 2) {
      next.fullName = t.err_name;
    }
    if (state.email && !EMAIL_RE.test(state.email)) {
      next.email = t.err_email;
    }
    if (!state.email && !state.phone && !state.whatsapp) {
      next.contact = t.help_one_contact_method;
    }
    if (!state.preferredContactMethod) {
      next.preferredContactMethod = t.err_contact_method;
    }
    if (!state.consultationType) {
      next.consultationType = t.err_consultation_type;
    }
    if (
      !state.contactConsent ||
      !state.medicalDisclaimerAccepted ||
      !state.privacyAccepted
    ) {
      next.consent = t.err_consent;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-[var(--shadow-sm)]">
        <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-foreground">
          {t.success_heading}
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          {t.success_sub_unnotified}
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-hover)]"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            {t.btn_continue_whatsapp}
          </a>
          <a
            href={clinic.businessSite}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {t.btn_visit_site}
          </a>
          <a
            href={`${localeHref(locale)}/`}
            className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {t.btn_back_to_reviews}
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex flex-col gap-10 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)] sm:p-8"
    >
      {/* honeypot */}
      <div className="hidden" aria-hidden="true">
        <label>
          {t.honeypot_label}
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <fieldset className="flex flex-col gap-4">
        <legend className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
          {t.step1_legend}
        </legend>
        <p className="-mt-2 text-sm text-muted-foreground">{t.step1_sub}</p>

        <div>
          <label htmlFor="bk-category" className={labelClass}>
            {t.label_treatment_area} <span className="text-primary">*</span>
          </label>
          <select
            id="bk-category"
            className={inputClass}
            value={state.category}
            onChange={(e) => {
              set("category", e.target.value);
              set("treatment", "");
            }}
          >
            <option value="">{t.placeholder_select_area}</option>
            {options.categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-destructive">{errors.category}</p>
          )}
        </div>

        <div>
          <label htmlFor="bk-treatment" className={labelClass}>
            {t.label_treatment} <span className="text-primary">*</span>
          </label>
          <select
            id="bk-treatment"
            className={inputClass}
            value={state.treatment}
            disabled={!state.category}
            onChange={(e) => set("treatment", e.target.value)}
          >
            <option value="">
              {state.category ? t.placeholder_select_treatment : t.placeholder_choose_area_first}
            </option>
            {treatments.map((tr) => (
              <option key={tr.value} value={tr.value}>
                {tr.label}
              </option>
            ))}
          </select>
          {errors.treatment && (
            <p className="mt-1 text-sm text-destructive">{errors.treatment}</p>
          )}
        </div>

        <div>
          <span className={labelClass}>
            {t.label_timeline} <span className="text-primary">*</span>
          </span>
          <ChipGroup
            name="timeline"
            options={options.timelines}
            value={state.timeline}
            onChange={(v) => set("timeline", v)}
          />
          {errors.timeline && (
            <p className="mt-1 text-sm text-destructive">{errors.timeline}</p>
          )}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 border-t border-border pt-8">
        <legend className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
          {t.step2_legend}
        </legend>
        <p className="-mt-2 text-sm text-muted-foreground">{t.step2_sub}</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="bk-name" className={labelClass}>
              {t.label_full_name} <span className="text-primary">*</span>
            </label>
            <input
              id="bk-name"
              type="text"
              autoComplete="name"
              maxLength={120}
              className={inputClass}
              value={state.fullName}
              onChange={(e) => set("fullName", e.target.value)}
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-destructive">{errors.fullName}</p>
            )}
          </div>

          <div>
            <label htmlFor="bk-country" className={labelClass}>
              {t.label_country}
            </label>
            <input
              id="bk-country"
              type="text"
              list="bk-countries"
              autoComplete="country-name"
              maxLength={80}
              className={inputClass}
              value={state.country}
              onChange={(e) => set("country", e.target.value)}
            />
            <datalist id="bk-countries">
              {options.countries.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="bk-email" className={labelClass}>
              {t.label_email}
            </label>
            <input
              id="bk-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              autoCapitalize="off"
              maxLength={200}
              className={inputClass}
              value={state.email}
              onChange={(e) => set("email", e.target.value)}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="bk-phone" className={labelClass}>
              {t.label_phone}
            </label>
            <input
              id="bk-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength={40}
              className={inputClass}
              value={state.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="bk-whatsapp" className={labelClass}>
              {t.label_whatsapp_number}
            </label>
            <input
              id="bk-whatsapp"
              type="tel"
              inputMode="tel"
              maxLength={40}
              className={inputClass}
              value={state.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="bk-language" className={labelClass}>
              {t.label_preferred_language}
            </label>
            <select
              id="bk-language"
              className={inputClass}
              value={state.preferredLanguage}
              onChange={(e) => set("preferredLanguage", e.target.value)}
            >
              <option value="">{t.placeholder_select_default}</option>
              {options.languages.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="-mb-1 text-sm text-muted-foreground">{t.help_one_contact_method}</p>
        {errors.contact && (
          <p className="text-sm text-destructive">{errors.contact}</p>
        )}

        <div>
          <span className={labelClass}>
            {t.label_preferred_contact_method} <span className="text-primary">*</span>
          </span>
          <ChipGroup
            name="preferredContactMethod"
            options={options.contactMethods}
            value={state.preferredContactMethod}
            onChange={(v) => set("preferredContactMethod", v)}
          />
          {errors.preferredContactMethod && (
            <p className="mt-1 text-sm text-destructive">
              {errors.preferredContactMethod}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="bk-besttime" className={labelClass}>
            {t.label_best_time}
          </label>
          <input
            id="bk-besttime"
            type="text"
            maxLength={120}
            placeholder={t.placeholder_best_time}
            className={inputClass}
            value={state.bestTimeToContact}
            onChange={(e) => set("bestTimeToContact", e.target.value)}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 border-t border-border pt-8">
        <legend className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
          {t.step3_legend}
        </legend>
        <p className="-mt-2 text-sm text-muted-foreground">{t.step3_sub}</p>

        <div>
          <span className={labelClass}>
            {t.label_consultation_type} <span className="text-primary">*</span>
          </span>
          <ChipGroup
            name="consultationType"
            options={options.consultationTypes}
            value={state.consultationType}
            onChange={(v) => set("consultationType", v)}
          />
          {errors.consultationType && (
            <p className="mt-1 text-sm text-destructive">
              {errors.consultationType}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="bk-date" className={labelClass}>
              {t.label_preferred_date}
            </label>
            <input
              id="bk-date"
              type="date"
              className={inputClass}
              value={state.preferredDate}
              onChange={(e) => set("preferredDate", e.target.value)}
            />
          </div>
          <div>
            <span className={labelClass}>{t.label_preferred_time}</span>
            <ChipGroup
              name="preferredTimeRange"
              options={options.timeRanges}
              value={state.preferredTimeRange}
              onChange={(v) => set("preferredTimeRange", v)}
            />
          </div>
        </div>

        <div>
          <span className={labelClass}>{t.label_traveling}</span>
          <ChipGroup
            name="travelingToIstanbul"
            options={options.travelOptions}
            value={state.travelingToIstanbul}
            onChange={(v) => set("travelingToIstanbul", v)}
          />
        </div>

        <div>
          <span className={labelClass}>{t.label_transfer_support}</span>
          <ChipGroup
            name="needsTransferHotelSupport"
            options={options.transferOptions}
            value={state.needsTransferHotelSupport}
            onChange={(v) => set("needsTransferHotelSupport", v)}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">{t.help_transfer_support}</p>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 border-t border-border pt-8">
        <legend className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
          {t.step4_legend}
        </legend>
        <p className="-mt-2 text-sm text-muted-foreground">{t.step4_sub}</p>

        <div>
          <label htmlFor="bk-message" className={labelClass}>
            {t.label_message}
          </label>
          <textarea
            id="bk-message"
            maxLength={2000}
            rows={4}
            placeholder={t.placeholder_message}
            className={inputClass}
            value={state.message}
            onChange={(e) => set("message", e.target.value)}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">{t.help_message}</p>
        </div>

        <div>
          <span className={labelClass}>{t.label_previous_treatment}</span>
          <ChipGroup
            name="previousTreatment"
            options={options.previousTreatmentOptions}
            value={state.previousTreatment}
            onChange={(v) => set("previousTreatment", v)}
          />
        </div>

        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm font-semibold text-foreground">{t.photos_heading}</p>
          <p className="mt-1.5 text-sm text-muted-foreground">{t.photos_help}</p>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3 border-t border-border pt-8">
        <legend className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
          {t.step5_legend}
        </legend>

        <label className="flex items-start gap-2.5 text-sm text-foreground">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={state.contactConsent}
            onChange={(e) => set("contactConsent", e.target.checked)}
          />
          <span>
            {t.consent_contact} <span className="text-primary">*</span>
          </span>
        </label>

        <label className="flex items-start gap-2.5 text-sm text-foreground">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={state.medicalDisclaimerAccepted}
            onChange={(e) =>
              set("medicalDisclaimerAccepted", e.target.checked)
            }
          />
          <span>
            {t.consent_disclaimer} <span className="text-primary">*</span>
          </span>
        </label>

        <label className="flex items-start gap-2.5 text-sm text-foreground">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={state.privacyAccepted}
            onChange={(e) => set("privacyAccepted", e.target.checked)}
          />
          <span>
            {fmt(t.consent_privacy, {
              privacy_link: `<privacy>${t.consent_privacy_link_text}</privacy>`,
            })
              .split(/<privacy>|<\/privacy>/)
              .map((part, i) =>
                i === 1 ? (
                  <a
                    key="privacy-link"
                    href={clinic.contact.privacyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary underline underline-offset-4"
                  >
                    {part}
                  </a>
                ) : (
                  <span key={`privacy-text-${i}`}>{part}</span>
                ),
              )}{" "}
            <span className="text-primary">*</span>
          </span>
        </label>

        <label className="flex items-start gap-2.5 text-sm text-foreground">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={state.marketingConsent}
            onChange={(e) => set("marketingConsent", e.target.checked)}
          />
          <span>{t.consent_marketing}</span>
        </label>

        {errors.consent && (
          <p className="text-sm text-destructive">{errors.consent}</p>
        )}
      </fieldset>

      <div role="alert" className="sr-only" aria-live="assertive">
        {Object.keys(errors).length > 0 ? t.err_form : ""}
      </div>

      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-md)] transition-shadow hover:shadow-[var(--shadow-hover)]"
      >
        {t.btn_submit}
      </button>
    </form>
  );
}
