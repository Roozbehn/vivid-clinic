import { reviewsSummary } from "@/lib/reviews";

// Real FAQ copy, ported verbatim from the static site's i18n catalog
// (src/data/i18n/source.en.json — "faq" key, q1-q6/a1-a6). The a1 answer has
// a dynamic stats sentence spliced in, computed from the same real dataset
// summary this app already uses for the score section — never hardcoded.
const { totalReviewCount, averageRating, ratingDistribution } = reviewsSummary;

const statsSentence = ` The page currently shows ${totalReviewCount} reviews with a ${averageRating}/5 average — ${
  ratingDistribution["5"] ?? 0
} five-star and ${
  ratingDistribution["4"] ?? 0
} four-star — and the dataset is refreshed regularly, so new reviews appear automatically.`;

export interface FaqEntry {
  question: string;
  answer: string;
}

export const faqEntries: FaqEntry[] = [
  {
    question: "Are these reviews real?",
    answer: `Yes. Every review shown here is imported directly from Vivid Clinic’s verified Google Business Profile using Google’s official Business Profile API — the same reviews you can read on Google Maps. The original wording, reviewer name, star rating and date are preserved exactly as each patient wrote them; nothing is edited, reworded, or written by the clinic, and lower ratings are never filtered out. Where Google provides a translation, the original text is kept and the translation is shown separately with a clear label.${statsSentence} If you want to verify any review independently, the “View on Google” button opens the clinic’s live Google listing, where the identical reviews are published.`,
  },
  {
    question: "Where do the reviews come from?",
    answer:
      "They come from patients who left public reviews on Vivid Clinic’s Google Business Profile in Istanbul — the same listing that appears when people search for the clinic on Google Search and Google Maps. Each review was submitted through Google’s own review system after a real visit or interaction; vivid.clinic does not host a separate comment box or invent testimonials. This site imports those public Google reviews via the official Business Profile API and displays them with the original names, star ratings, dates and wording intact. If a patient wrote in another language, you still see the original text, and any Google translation is labelled separately rather than replacing what was written. Owner replies, when Google provides them, appear under the same review. You can open the live Google profile at any time with the “View on Google” links on this page and confirm that the reviews match what you read here.",
  },
  {
    question: "Can I see Vivid Clinic on Google Maps?",
    answer:
      "Yes. Vivid Clinic’s live Google Business listing is the source of the reviews on this site, and you can open it directly from vivid.clinic. Use any “View on Google” button on a review card or in the page header to jump to the Maps listing for the Bakırköy, Istanbul address, where you can read the same ratings, photos and review text that Google publishes for the clinic. The listing also shows opening hours, the map pin, and directions, so you can plan a visit or verify the location before you travel. Nothing on this page replaces Google’s own profile — we simply present the authorised review data next to consultation and estimate tools so international patients can research and reach out in one place. If a review looks surprising, opening Maps is the fastest way to check it against the live source.",
  },
  {
    question: "Do patient results vary?",
    answer:
      "Yes. Every patient is different, and reviews describe individual experiences — they are not a guarantee of any particular outcome, recovery time or aesthetic result. Factors such as anatomy, medical history, the procedure chosen, healing response and how closely post-care instructions are followed all influence what someone sees in the mirror months later. Comments on Google can be helpful for understanding how other people felt about coordination, communication and aftercare, but they cannot replace a personal medical evaluation. Vivid Clinic requires a consultation before suitability, technique and pricing are confirmed; that discussion is where your goals, risks and realistic expectations should be covered. If you are comparing clinics online, treat star ratings as one input among many and ask clear questions about who performs the procedure, what is included, and what follow-up looks like for your case.",
  },
  {
    question: "How can I book a consultation?",
    answer:
      "Message the clinic on WhatsApp, or use the consultation form on vividclinic.net — both routes reach the patient-coordination team. WhatsApp is available on every major call-to-action if you prefer to chat in your own words or send photos later. Initial consultations are free, there is no obligation to book surgery, and no payment is taken on this website. After you reach out, expect a reply with next steps — often on WhatsApp — covering indicative options and what the medical team needs before travel. Choose whichever channel feels easiest; you can switch between form and WhatsApp at any time if your questions change.",
  },
  {
    question: "Can international patients contact the clinic before travelling?",
    answer:
      "Yes. Vivid Clinic regularly works with patients who start the conversation from abroad, and you can ask questions before you book flights. Coordinators communicate in English, Turkish and Arabic, and consultations can begin on WhatsApp or by video so you understand process, timing and indicative pricing while you are still at home. Many travellers use that remote stage to share goals, ask about stay length and confirm what happens after the procedure, then visit Istanbul only once a plan feels clear. The clinic is in Bakırköy with weekday and Saturday hours in Türkiye time; Sunday is closed. There is no fee for the consultation request on this site and no online payment — travel and treatment decisions stay with you after medical evaluation. If you need transfer or hotel questions answered as part of planning, raise them with the coordinator during that first contact rather than assuming they are automatically included.",
  },
];
