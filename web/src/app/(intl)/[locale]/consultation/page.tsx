import type { Metadata } from "next";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ConsultationHeroSection } from "@/components/sections/consultation-hero-section";
import { EstimateSection } from "@/components/sections/estimate-section";
import { BookingSection } from "@/components/sections/booking-section";
import { HowItWorksSection } from "@/components/sections/how-it-works-section";
import { WhyBookSection } from "@/components/sections/why-book-section";
import { InternationalSection } from "@/components/sections/international-section";
import { BookingFaqSection } from "@/components/sections/booking-faq-section";
import { clinic } from "@/lib/clinic";
import { getBookingFaqEntries } from "@/lib/booking-faq";
import { getDictionary } from "@/lib/i18n/dictionary";
import { LOCALE_CODES } from "@/lib/i18n/locales";
import { localeAlternates } from "@/lib/i18n/alternates";

export function generateStaticParams() {
  return LOCALE_CODES.map((locale) => ({ locale }));
}

// Translated consultation page: Phase B of the i18n port (see
// MIGRATION-STATUS.md). Mirrors app/(en)/consultation/page.tsx section for
// section — every locale gets the same real estimate calculator and booking
// form, translated from the dictionary's js_estimate/js_booking/
// booking_options/estimate_data/treatments/bundles catalog groups.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const title = `${dict.consult_hero.h1} | ${dict.header.brand_name}`;
  const pageUrl = `https://vivid.clinic/${locale}/consultation/`;

  return {
    metadataBase: new URL("https://vivid.clinic"),
    title,
    description: dict.consult_hero.lead,
    alternates: {
      canonical: `/${locale}/consultation/`,
      languages: localeAlternates("/consultation/"),
    },
    openGraph: {
      title,
      description: dict.consult_hero.lead,
      url: pageUrl,
      siteName: dict.header.brand_name,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: dict.consult_hero.lead,
    },
  };
}

export default async function LocaleConsultationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const bookingFaqEntries = getBookingFaqEntries(dict, locale);
  const pageUrl = `https://vivid.clinic/${locale}/consultation/`;
  const title = `${dict.consult_hero.h1} | ${dict.header.brand_name}`;
  const homeUrl = `https://vivid.clinic/${locale}/`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalClinic",
        name: clinic.name,
        description: clinic.descriptor,
        url: homeUrl,
        telephone: clinic.contact.phonePrimaryDisplay,
        sameAs: [clinic.businessSite, ...clinic.sameAs],
      },
      {
        "@type": "WebPage",
        name: title,
        url: pageUrl,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: dict.header.brand_name, item: homeUrl },
          { "@type": "ListItem", position: 2, name: dict.consult_hero.h1, item: pageUrl },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: bookingFaqEntries.map((entry) => ({
          "@type": "Question",
          name: entry.question,
          acceptedAnswer: { "@type": "Answer", text: entry.answer },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader locale={locale} dict={dict} variant="consultation" />
      <main id="main" className="flex flex-1 flex-col">
        <ConsultationHeroSection dict={dict} locale={locale} />
        <EstimateSection dict={dict} />
        <BookingSection dict={dict} locale={locale} />
        <HowItWorksSection dict={dict} />
        <WhyBookSection dict={dict} />
        <InternationalSection dict={dict} />
        <BookingFaqSection dict={dict} locale={locale} />
      </main>
      <SiteFooter locale={locale} dict={dict} hasInlineTools />
    </>
  );
}
