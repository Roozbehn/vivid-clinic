import { HeroSection } from "@/components/sections/hero-section";
import { TestimonialsSection } from "@/components/sections/testimonials-section";
import { ScoreSummarySection } from "@/components/sections/score-summary-section";
import { ReviewsSection } from "@/components/sections/reviews-section";
import { clinic } from "@/lib/clinic";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "MedicalClinic",
      name: clinic.name,
      description: clinic.descriptor,
      url: clinic.reviewSite,
      telephone: clinic.contact.phonePrimaryDisplay,
      sameAs: [clinic.businessSite],
    },
    {
      "@type": "WebPage",
      name: "Vivid Clinic Reviews | Real Patient Reviews in Istanbul",
      url: clinic.reviewSite,
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
        {/*
          Still to port from the current static site: "why Vivid", treatment
          themes, patient photo gallery, price estimator, booking form, FAQ,
          CTA band, international-patient info. See web/MIGRATION-STATUS.md.
        */}
      </main>
    </>
  );
}
