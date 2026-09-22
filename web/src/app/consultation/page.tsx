import type { Metadata } from "next";

import { ConsultationHeroSection } from "@/components/sections/consultation-hero-section";
import { EstimateSection } from "@/components/sections/estimate-section";
import { BookingSection } from "@/components/sections/booking-section";
import { HowItWorksSection } from "@/components/sections/how-it-works-section";
import { WhyBookSection } from "@/components/sections/why-book-section";
import { InternationalSection } from "@/components/sections/international-section";
import { BookingFaqSection } from "@/components/sections/booking-faq-section";
import { clinic } from "@/lib/clinic";
import { bookingFaqEntries } from "@/lib/booking-faq";

const TITLE = "Book a Consultation at Vivid Clinic | Istanbul";
const DESCRIPTION =
  "Request a free consultation with Vivid Clinic in Istanbul. Choose your treatment, share your details, and a coordinator guides your next step — on WhatsApp, video, or in clinic.";
const PAGE_URL = "https://vivid.clinic/consultation/";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    siteName: "Vivid Clinic",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

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
      name: TITLE,
      url: PAGE_URL,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Vivid Clinic Reviews", item: clinic.reviewSite },
        { "@type": "ListItem", position: 2, name: "Book a Consultation", item: PAGE_URL },
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

export default function ConsultationPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main id="main" className="flex flex-1 flex-col">
        <ConsultationHeroSection />
        <EstimateSection />
        <BookingSection />
        <HowItWorksSection />
        <WhyBookSection />
        <InternationalSection />
        <BookingFaqSection />
      </main>
    </>
  );
}
