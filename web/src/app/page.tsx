import { HeroSection } from "@/components/sections/hero-section";
import { TestimonialsSection } from "@/components/sections/testimonials-section";
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
        {/*
          The remaining sections from the current static site (score
          breakdown, full review grid with search/filter, "why Vivid",
          treatment themes, patient photo gallery, price estimator, booking
          form, FAQ, CTA band, international-patient info) still need to be
          ported into this React/shadcn app — see the PR description for
          status and the migration plan.
        */}
      </main>
    </>
  );
}
