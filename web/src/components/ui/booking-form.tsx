"use client";

import { useMemo, useState, type FormEvent } from "react";
import { MessageCircle } from "lucide-react";

import { clinic } from "@/lib/clinic";
import {
  consultationTypeOptions,
  contactMethodOptions,
  countryOptions,
  languageOptions,
  previousTreatmentOptions,
  timeRangeOptions,
  timelineOptions,
  transferOptions,
  travelOptions,
  treatmentCategories,
} from "@/lib/booking-options";

// Simplified, faithful port of src/js/booking.js: the original site runs this
// as a 5-step wizard, but every field here collects the same data with the
// same validation, just on a single page (a deliberate scope simplification
// — see web/MIGRATION-STATUS.md). There is no backend to submit to (this is
// a static export), so this form goes straight to the original's own
// designed fallback: composing a WhatsApp message from the answers. That
// mirrors src/js/booking.js's own behavior, which falls back to WhatsApp
// whenever its POST to /api/booking fails. Session-only state — nothing is
// persisted or sent anywhere except the WhatsApp deep link the visitor opens
// themselves.
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

export function BookingForm() {
  const [state, setState] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  const treatments = useMemo(
    () =>
      treatmentCategories.find((c) => c.value === state.category)
        ?.treatments ?? [],
    [state.category],
  );

  const whatsappHref = useMemo(() => {
    const lines = ["Hello Vivid Clinic, I would like to request a consultation."];
    const catLabel = labelFor(treatmentCategories, state.category);
    const treatLabel = state.treatment
      ? labelFor(treatments, state.treatment)
      : "";
    if (state.category) {
      lines.push(
        treatLabel
          ? `• Treatment: ${catLabel} – ${treatLabel}`
          : `• Treatment: ${catLabel}`,
      );
    }
    if (state.timeline) {
      lines.push(`• Timeline: ${labelFor(timelineOptions, state.timeline)}`);
    }
    if (state.fullName) lines.push(`• Name: ${state.fullName}`);
    if (state.country) lines.push(`• Country: ${state.country}`);
    if (state.preferredContactMethod) {
      lines.push(
        `• Preferred contact: ${labelFor(contactMethodOptions, state.preferredContactMethod)}`,
      );
    }
    lines.push("(Sent from vivid.clinic)");
    return `https://api.whatsapp.com/send/?phone=${encodeURIComponent(
      clinic.contact.whatsappNumber,
    )}&text=${encodeURIComponent(lines.join("\n"))}`;
  }, [state, treatments]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!state.category) next.category = "Please choose a treatment area.";
    if (!state.treatment) next.treatment = "Please choose a treatment.";
    if (!state.timeline) next.timeline = "Please choose a timeline.";
    if (!state.fullName || state.fullName.trim().length < 2) {
      next.fullName = "Please enter your name.";
    }
    if (state.email && !EMAIL_RE.test(state.email)) {
      next.email = "Please enter a valid email, or leave it blank.";
    }
    if (!state.email && !state.phone && !state.whatsapp) {
      next.contact =
        "Please give us at least one way to reach you — email, phone, or WhatsApp.";
    }
    if (!state.preferredContactMethod) {
      next.preferredContactMethod = "Please choose a preferred contact method.";
    }
    if (!state.consultationType) {
      next.consultationType = "Please choose a consultation type.";
    }
    if (
      !state.contactConsent ||
      !state.medicalDisclaimerAccepted ||
      !state.privacyAccepted
    ) {
      next.consent = "Please confirm the three required consents to continue.";
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
          Thank you, {state.fullName || "there"}.
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          Vivid Clinic will review your request and guide you through the
          next step. Tip: tap &ldquo;Continue on WhatsApp&rdquo; below so the
          coordinator sees your request right away.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-hover)]"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Continue on WhatsApp
          </a>
          <button
            type="button"
            onClick={() => {
              setState(INITIAL_STATE);
              setErrors({});
              setSubmitted(false);
            }}
            className="text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Submit another request
          </button>
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
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <fieldset className="flex flex-col gap-4">
        <legend className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
          What are you interested in?
        </legend>
        <p className="-mt-2 text-sm text-muted-foreground">
          This helps us route you to the right specialist. You can change
          details later with the coordinator.
        </p>

        <div>
          <label htmlFor="bk-category" className={labelClass}>
            Treatment area <span className="text-primary">*</span>
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
            <option value="">Select a treatment area…</option>
            {treatmentCategories.map((c) => (
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
            Treatment <span className="text-primary">*</span>
          </label>
          <select
            id="bk-treatment"
            className={inputClass}
            value={state.treatment}
            disabled={!state.category}
            onChange={(e) => set("treatment", e.target.value)}
          >
            <option value="">
              {state.category
                ? "Select a treatment…"
                : "Choose a treatment area first…"}
            </option>
            {treatments.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {errors.treatment && (
            <p className="mt-1 text-sm text-destructive">{errors.treatment}</p>
          )}
        </div>

        <div>
          <span className={labelClass}>
            Timeline <span className="text-primary">*</span>
          </span>
          <ChipGroup
            name="timeline"
            options={timelineOptions}
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
          How can we reach you?
        </legend>
        <p className="-mt-2 text-sm text-muted-foreground">
          A coordinator will use these details only to respond to your
          request.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="bk-name" className={labelClass}>
              Full name <span className="text-primary">*</span>
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
              Country
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
              {countryOptions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="bk-email" className={labelClass}>
              Email
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
              Phone number
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
              WhatsApp number
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
              Preferred language
            </label>
            <select
              id="bk-language"
              className={inputClass}
              value={state.preferredLanguage}
              onChange={(e) => set("preferredLanguage", e.target.value)}
            >
              <option value="">Select…</option>
              {languageOptions.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="-mb-1 text-sm text-muted-foreground">
          Please give us at least one way to reach you — email, phone, or
          WhatsApp.
        </p>
        {errors.contact && (
          <p className="text-sm text-destructive">{errors.contact}</p>
        )}

        <div>
          <span className={labelClass}>
            Preferred contact method <span className="text-primary">*</span>
          </span>
          <ChipGroup
            name="preferredContactMethod"
            options={contactMethodOptions}
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
            Best time to contact you
          </label>
          <input
            id="bk-besttime"
            type="text"
            maxLength={120}
            placeholder="e.g. weekday afternoons, my local time"
            className={inputClass}
            value={state.bestTimeToContact}
            onChange={(e) => set("bestTimeToContact", e.target.value)}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 border-t border-border pt-8">
        <legend className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
          Consultation &amp; travel
        </legend>
        <p className="-mt-2 text-sm text-muted-foreground">
          Tell us how you would like to talk. Nothing here is final — it just
          helps us prepare.
        </p>

        <div>
          <span className={labelClass}>
            How would you like your consultation?{" "}
            <span className="text-primary">*</span>
          </span>
          <ChipGroup
            name="consultationType"
            options={consultationTypeOptions}
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
              Preferred date
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
            <span className={labelClass}>Preferred time</span>
            <ChipGroup
              name="preferredTimeRange"
              options={timeRangeOptions}
              value={state.preferredTimeRange}
              onChange={(v) => set("preferredTimeRange", v)}
            />
          </div>
        </div>

        <div>
          <span className={labelClass}>
            Are you planning to travel to Istanbul?
          </span>
          <ChipGroup
            name="travelingToIstanbul"
            options={travelOptions}
            value={state.travelingToIstanbul}
            onChange={(v) => set("travelingToIstanbul", v)}
          />
        </div>

        <div>
          <span className={labelClass}>
            Would you like help with travel coordination (transfers,
            accommodation)?
          </span>
          <ChipGroup
            name="needsTransferHotelSupport"
            options={transferOptions}
            value={state.needsTransferHotelSupport}
            onChange={(v) => set("needsTransferHotelSupport", v)}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            The coordinator can answer travel-coordination questions — this
            is not a guaranteed service quote.
          </p>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 border-t border-border pt-8">
        <legend className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
          Anything else? (optional)
        </legend>
        <p className="-mt-2 text-sm text-muted-foreground">
          Keep it short — the coordinator will follow up for the rest.
        </p>

        <div>
          <label htmlFor="bk-message" className={labelClass}>
            Your message or goal
          </label>
          <textarea
            id="bk-message"
            maxLength={2000}
            rows={4}
            placeholder="e.g. what you would like to improve, any questions"
            className={inputClass}
            value={state.message}
            onChange={(e) => set("message", e.target.value)}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Please don&rsquo;t include urgent medical information here.
          </p>
        </div>

        <div>
          <span className={labelClass}>
            Have you had a previous treatment in this area?
          </span>
          <ChipGroup
            name="previousTreatment"
            options={previousTreatmentOptions}
            value={state.previousTreatment}
            onChange={(v) => set("previousTreatment", v)}
          />
        </div>

        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm font-semibold text-foreground">Photos</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            You can share photos later with the coordinator on WhatsApp if
            needed — there&rsquo;s no photo upload here, so nothing sensitive
            is stored on this site.
          </p>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3 border-t border-border pt-8">
        <legend className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
          Review &amp; confirm
        </legend>

        <label className="flex items-start gap-2.5 text-sm text-foreground">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={state.contactConsent}
            onChange={(e) => set("contactConsent", e.target.checked)}
          />
          <span>
            I consent to Vivid Clinic contacting me about my consultation
            request. <span className="text-primary">*</span>
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
            I understand this form is not a diagnosis and does not guarantee
            treatment suitability, results, or prices.{" "}
            <span className="text-primary">*</span>
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
            I have read and agree to the{" "}
            <a
              href={clinic.contact.privacyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-4"
            >
              Privacy / KVKK notice
            </a>
            . <span className="text-primary">*</span>
          </span>
        </label>

        <label className="flex items-start gap-2.5 text-sm text-foreground">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={state.marketingConsent}
            onChange={(e) => set("marketingConsent", e.target.checked)}
          />
          <span>
            I&rsquo;d like to receive follow-up information and offers from
            Vivid Clinic. (optional)
          </span>
        </label>

        {errors.consent && (
          <p className="text-sm text-destructive">{errors.consent}</p>
        )}
      </fieldset>

      <div role="alert" className="sr-only" aria-live="assertive">
        {Object.keys(errors).length > 0
          ? "Please complete the highlighted fields."
          : ""}
      </div>

      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-md)] transition-shadow hover:shadow-[var(--shadow-hover)]"
      >
        Submit request
      </button>
    </form>
  );
}
