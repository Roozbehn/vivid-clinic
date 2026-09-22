import { HeroSection } from "@/components/sections/hero-section";
import { TestimonialsSection } from "@/components/sections/testimonials-section";
import { ScoreSummarySection } from "@/components/sections/score-summary-section";
import { ReviewsSection } from "@/components/sections/reviews-section";
import { PhotosSection } from "@/components/sections/photos-section";
import { WhySection } from "@/components/sections/why-section";
import { ThemesSection } from "@/components/sections/themes-section";
import { CtaSection } from "@/components/sections/cta-section";
import { FaqSection } from "@/components/sections/faq-section";
import { clinic } from "@/lib/clinic";
import { faqEntries } from "@/lib/faq";

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

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main id="main" className="flex flex-1 flex-col">
        <HeroSection />
        <TestimonialsSection />
        <ScoreSummarySection />
        <ReviewsSection />
        <PhotosSection />
        <WhySection />
        <ThemesSection />
        <CtaSection />
        <FaqSection />
        {/*
          Still to port from the current static site: price estimator,
          booking form (+ Cloudflare Function), "how it works", "why book
          with us", international-patient info, and the i18n layer.
          See web/MIGRATION-STATUS.md.
        */}
      </main>
    </>
  );
}
