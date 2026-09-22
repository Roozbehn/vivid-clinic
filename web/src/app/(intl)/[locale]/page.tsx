import { HeroSection } from "@/components/sections/hero-section";
import { ScoreSummarySection } from "@/components/sections/score-summary-section";
import { ReviewsSection } from "@/components/sections/reviews-section";
import { PhotosSection } from "@/components/sections/photos-section";
import { WhySection } from "@/components/sections/why-section";
import { ThemesSection } from "@/components/sections/themes-section";
import { CtaSection } from "@/components/sections/cta-section";
import { FaqSection } from "@/components/sections/faq-section";
import { clinic } from "@/lib/clinic";
import { getFaqEntries } from "@/lib/faq";
import { getDictionary } from "@/lib/i18n/dictionary";
import { LOCALE_CODES } from "@/lib/i18n/locales";

export function generateStaticParams() {
  return LOCALE_CODES.map((locale) => ({ locale }));
}

// Translated homepage: Phase A of the i18n port (see MIGRATION-STATUS.md).
// Deliberately narrower than the English homepage — it omits Testimonials
// (bonus/non-original section built from real English review excerpts that
// can't be translated without fabricating copy) and the estimate/booking/
// how-it-works tools (not localized yet; CtaSection links out to the real,
// live vividclinic.net consultation flow instead via hasInlineTools=false).
export default async function LocaleHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const faqEntries = getFaqEntries(dict);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalClinic",
        name: clinic.name,
        description: clinic.descriptor,
        url: `https://vivid.clinic/${locale}/`,
        telephone: clinic.contact.phonePrimaryDisplay,
        sameAs: [clinic.businessSite, ...clinic.sameAs],
      },
      {
        "@type": "WebPage",
        name: `${dict.hero.h1} | ${dict.header.brand_name}`,
        url: `https://vivid.clinic/${locale}/`,
      },
      {
        "@type": "FAQPage",
        mainEntity: faqEntries.map((entry) => ({
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
      <main id="main" className="flex flex-1 flex-col">
        <HeroSection dict={dict} />
        <ScoreSummarySection dict={dict} />
        <ReviewsSection dict={dict} locale={locale} />
        <PhotosSection dict={dict} locale={locale} />
        <WhySection dict={dict} />
        <ThemesSection dict={dict} />
        <CtaSection dict={dict} hasInlineTools={false} />
        <FaqSection dict={dict} />
      </main>
    </>
  );
}
