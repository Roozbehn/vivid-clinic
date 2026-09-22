import Link from "next/link";

import { reviewsSummary } from "@/lib/reviews";
import { clinic } from "@/lib/clinic";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { fmt } from "@/lib/i18n/format";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";

function formatSocialLabel(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

function formatUpdatedDate(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return date.toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
}

// hasInlineTools: see cta-section.tsx — true on both English pages (home and
// /consultation/ both embed the real estimate/booking sections), false on
// translated locale homepages until those tools are localized too.
export function SiteFooter({
  locale,
  dict,
  hasInlineTools,
}: {
  locale: string;
  dict: Dictionary;
  hasInlineTools: boolean;
}) {
  const year = new Date().getFullYear();
  const lastUpdated = reviewsSummary.latestReviewDate
    ? formatUpdatedDate(reviewsSummary.latestReviewDate, locale)
    : null;
  const isEnglish = locale === DEFAULT_LOCALE;

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          <div>
            <div className="font-[family-name:var(--font-display)] text-xl font-semibold">
              {dict.header.brand_name}
            </div>
            <p className="mt-3 max-w-[34ch] text-sm text-primary-foreground/75">
              {dict.footer.about}
            </p>
            <p className="mt-3 text-sm text-primary-foreground/75">
              {clinic.address.streetAddress}
              <br />
              {clinic.address.addressLocality}, {clinic.address.addressRegion}{" "}
              {clinic.address.postalCode}
              <br />
              {clinic.address.addressCountryName}
            </p>
          </div>

          <div>
            <h3 className="font-[family-name:var(--font-display)] text-base font-semibold">
              {dict.header.brand_name}
            </h3>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-primary-foreground/75">
              <li>
                <a
                  href={clinic.businessSite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-foreground"
                >
                  {dict.footer.link_main_site}
                </a>
              </li>
              {hasInlineTools && (
                <li>
                  <a href="#estimate" className="hover:text-primary-foreground">
                    {dict.footer.link_estimate}
                  </a>
                </li>
              )}
              {isEnglish ? (
                <li>
                  <Link href="/consultation/" className="hover:text-primary-foreground">
                    {dict.footer.link_consultation}
                  </Link>
                </li>
              ) : (
                <li>
                  <a
                    href={clinic.contact.consultationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary-foreground"
                  >
                    {dict.footer.link_consultation}
                  </a>
                </li>
              )}
              <li>
                <a
                  href={clinic.contact.galleryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-foreground"
                >
                  {dict.footer.link_gallery}
                </a>
              </li>
              <li>
                <a
                  href={clinic.googleBusinessProfile.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-foreground"
                >
                  {dict.footer.link_google_reviews}
                </a>
              </li>
              <li>
                <a
                  href={`${clinic.contact.whatsappUrl}&text=${encodeURIComponent(clinic.contact.whatsappPrefill)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-foreground"
                >
                  {fmt(dict.footer.link_whatsapp, { number: clinic.contact.whatsappDisplay })}
                </a>
              </li>
              <li>
                <a
                  href={clinic.contact.phonePrimaryHref}
                  className="hover:text-primary-foreground"
                >
                  {clinic.contact.phonePrimaryDisplay}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-[family-name:var(--font-display)] text-base font-semibold">
              {dict.footer.col_heading_follow}
            </h3>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-primary-foreground/75">
              {clinic.sameAs.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary-foreground"
                  >
                    {formatSocialLabel(url)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          role="note"
          className="mt-10 rounded-xl border border-primary-foreground/20 bg-primary-foreground/5 px-4 py-3 text-xs text-primary-foreground/85"
        >
          {dict.footer.disclaimer}
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-primary-foreground/15 pt-6 text-xs text-primary-foreground/70 sm:flex-row sm:items-center sm:justify-between">
          <span>{fmt(dict.footer.copyright, { year })}</span>
          <span>
            <a
              href={clinic.contact.privacyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-primary-foreground"
            >
              {dict.footer.link_privacy}
            </a>{" "}
            ·{" "}
            <a
              href={clinic.contact.legalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-primary-foreground"
            >
              {dict.footer.link_legal}
            </a>
          </span>
          <span>
            {lastUpdated
              ? fmt(dict.footer.reviews_last_updated, { date: lastUpdated })
              : dict.footer.reviews_update_note}
          </span>
        </div>
      </div>
    </footer>
  );
}
