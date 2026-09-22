import Link from "next/link";

import { reviewsSummary } from "@/lib/reviews";
import { clinic } from "@/lib/clinic";

function formatSocialLabel(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

function formatUpdatedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  const lastUpdated = reviewsSummary.latestReviewDate
    ? formatUpdatedDate(reviewsSummary.latestReviewDate)
    : null;

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          <div>
            <div className="font-[family-name:var(--font-display)] text-xl font-semibold">
              {clinic.name}
            </div>
            <p className="mt-3 max-w-[34ch] text-sm text-primary-foreground/75">
              Premium medical aesthetics and hair restoration in Istanbul,
              with hospitality-led care for international patients.
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
              {clinic.name}
            </h3>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-primary-foreground/75">
              <li>
                <a
                  href={clinic.businessSite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-foreground"
                >
                  Main website
                </a>
              </li>
              <li>
                <Link
                  href="/consultation/"
                  className="hover:text-primary-foreground"
                >
                  Free consultation &amp; estimate
                </Link>
              </li>
              <li>
                <a
                  href={clinic.contact.galleryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-foreground"
                >
                  Before &amp; after gallery
                </a>
              </li>
              <li>
                <a
                  href={clinic.googleBusinessProfile.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-foreground"
                >
                  Reviews on Google
                </a>
              </li>
              <li>
                <a
                  href={`${clinic.contact.whatsappUrl}&text=${encodeURIComponent(clinic.contact.whatsappPrefill)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-foreground"
                >
                  WhatsApp {clinic.contact.whatsappDisplay}
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
              Follow
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
          Patient experiences are individual and may vary. A medical
          consultation is required for personalized advice. Reviews are
          sourced from Vivid Clinic&rsquo;s public Google Business Profile and
          are shown unedited.
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-primary-foreground/15 pt-6 text-xs text-primary-foreground/70 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {"©"} {year} {clinic.name} {"·"} Istanbul, T{"ü"}rkiye
          </span>
          <span>
            <a
              href={clinic.contact.privacyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-primary-foreground"
            >
              Privacy policy
            </a>{" "}
            ·{" "}
            <a
              href={clinic.contact.legalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-primary-foreground"
            >
              Legal
            </a>
          </span>
          <span>
            {lastUpdated
              ? `Reviews last updated ${lastUpdated}`
              : "Reviews update from Google Business Profile"}
          </span>
        </div>
      </div>
    </footer>
  );
}
