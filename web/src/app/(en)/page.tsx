import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HeroSection } from "@/components/sections/hero-section";
import { TestimonialsSection } from "@/components/sections/testimonials-section";
import { ScoreSummarySection } from "@/components/sections/score-summary-section";
import { ReviewsSection } from "@/components/sections/reviews-section";
import { PhotosSection } from "@/components/sections/photos-section";
import { EstimateSection } from "@/components/sections/estimate-section";
import { BookingSection } from "@/components/sections/booking-section";
import { HowItWorksSection } from "@/components/sections/how-it-works-section";
import { WhySection } from "@/components/sections/why-section";
import { ThemesSection } from "@/components/sections/themes-section";
import { CtaSection } from "@/components/sections/cta-section";
import { FaqSection } from "@/components/sections/faq-section";
import { clinic } from "@/lib/clinic";
import { getFaqEntries } from "@/lib/faq";
import { getDictionary } from "@/lib/i18n/dictionary";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";

const dict = getDictionary(DEFAULT_LOCALE);
const faqEntries = getFaqEntries(dict);

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "MedicalClinic",
      name: clinic.name,
      description: clinic.descriptor,
      url: clinic.reviewSite,
      telephone: clinic.contact.phonePrimaryDisplay,
      sameAs: [clinic.businessSite, ...clinic.sameAs],
    },
    {
      "@type": "WebPage",
      name: "Vivid Clinic Reviews | Real Patient Reviews in Istanbul",
      url: clinic.reviewSite,
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

// Homepage section order matches the static site's real <main> composition
// (scripts/build-site.mjs's homepage `html` template): hero, testimonials
// (bonus/non-original, English-only), summary, reviews, photos, estimate,
// booking, how-it-works, why, themes, cta, faq. The estimate/booking tools
// are embedded here (not just on /consultation/) — see MIGRATION-STATUS.md.
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader locale={DEFAULT_LOCALE} dict={dict} variant="home" />
      <main id="main" className="flex flex-1 flex-col">
        <HeroSection dict={dict} />
        <TestimonialsSection />
        <ScoreSummarySection dict={dict} />
        <ReviewsSection dict={dict} locale={DEFAULT_LOCALE} />
        <PhotosSection dict={dict} locale={DEFAULT_LOCALE} />
        <EstimateSection dict={dict} />
        <BookingSection dict={dict} locale={DEFAULT_LOCALE} />
        <HowItWorksSection dict={dict} />
        <WhySection dict={dict} />
        <ThemesSection dict={dict} />
        <CtaSection dict={dict} locale={DEFAULT_LOCALE} hasInlineTools />
        <FaqSection dict={dict} />
      </main>
      <SiteFooter locale={DEFAULT_LOCALE} dict={dict} hasInlineTools />
    </>
  );
}
