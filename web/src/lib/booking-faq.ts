import { fromPriceFor, formatMoney } from "@/lib/estimate-pricing";

// Real FAQ copy, ported verbatim from source.en.json's "booking_faq" key.
// q4's price examples are computed from the repo's real, verified price
// list (estimate-pricing.ts) rather than hardcoded, so they stay correct if
// prices change — the same real-data-only rule the review FAQs follow.
export interface FaqEntry {
  question: string;
  answer: string;
}

const PRICE_EXAMPLE_TREATMENTS: [label: string, slug: string][] = [
  ["hair transplant treatment", "hair-transplant-treatment"],
  ["rhinoplasty", "rhinoplasty"],
  ["breast implants", "breast-implant"],
  ["gastric sleeve", "gastric-sleeve"],
];

const priceExamples = PRICE_EXAMPLE_TREATMENTS.map(([label, slug]) => {
  const price = fromPriceFor(slug);
  return price != null ? `${label} from ${formatMoney(price)}` : null;
})
  .filter((s): s is string => s != null)
  .join(", ");

export const bookingFaqEntries: FaqEntry[] = [
  {
    question: "Is this form a medical consultation?",
    answer:
      "No. The form is a consultation request only — it is not a medical examination, diagnosis or treatment approval. You share treatment interest, contact details and a few planning questions so a Vivid Clinic coordinator can understand how to help and connect you with the right next step. Suitability for any procedure, the clinical plan and final prices can only be confirmed after a proper evaluation by the medical team, which may include photos shared later on WhatsApp, a video call or an in-clinic visit. Nothing you type here replaces clinical judgement, and the form deliberately avoids collecting urgent medical detail that belongs with emergency services or a doctor. Consultations arranged through this flow are free and carry no obligation to proceed. Think of the form as a structured way to start the conversation, not as the consultation itself — the clinical discussion happens after the team reviews your request.",
  },
  {
    question: "Can I book from outside Turkey?",
    answer:
      "Yes — most Vivid Clinic patients travel from abroad, and the process is designed to start before you fly. You can request a WhatsApp or video consultation from any country using this form, discuss your goals with a coordinator in English, Turkish or Arabic, and receive a personalised plan with indicative pricing without any commitment. Questions, scheduling and follow-ups are all handled remotely, so you only travel once you are confident in the plan. The clinic is in Bakırköy, Istanbul, and the team regularly coordinates visits for international patients, including timing procedures around flights and accommodation. There is no fee for the consultation and no payment is taken on this website — travel decisions are always made after your medical evaluation, not before. The clinic is open Monday to Friday 09:00–19:00 and Saturday 09:00–17:00 (Türkiye time).",
  },
  {
    question: "Can I send photos?",
    answer:
      "There is no photo upload on this site, so nothing sensitive is stored on vivid.clinic when you fill the form. That design keeps medical images off this static website and out of the booking database. If photos would help the team prepare for your consultation — for example current hairline photos, previous surgical scars or reference angles — you can share them later directly with the coordinator on WhatsApp after they reply to your request. Use the success-screen WhatsApp button or any WhatsApp CTA on the page and send only what you are comfortable sharing. The coordinator will tell you which views are useful; there is no obligation to send images before you are ready. Never put urgent or emergency medical issues in a chat thread — contact local emergency services instead. Photos support planning conversations; they still do not replace an in-person or clinician-led evaluation when one is required.",
  },
  {
    question: "Will I receive an exact price?",
    answer: `Not from this form — and it is sensible to be cautious of any clinic that promises exact surgical prices online. The estimate tool on this page shows indicative starting prices drawn from Vivid Clinic's current price list: for example, ${priceExamples}. Your final quote depends on your medical evaluation, the technique used and how treatments are combined, so it can only be confirmed after a consultation with the medical team. Consultations are free, there is no obligation, and no payment is ever taken on this website. Once you send a request, a coordinator reviews your details and replies — usually on WhatsApp — with a personalised treatment plan and written pricing, so you can compare your options calmly before deciding anything.`,
  },
  {
    question: "How is my data used?",
    answer:
      "Your information is used only to respond to your consultation request — so the coordination team can contact you about treatment interest, preferred channel and next steps. It is not sold to third-party marketers, and this booking flow does not wire leads into an external CRM by default. Server-side validation sanitises submissions, rejects obvious spam, and deliberately avoids logging raw patient payloads in application logs. Optional email notification to the clinic, when configured, exists so staff can answer you; WhatsApp remains available as a fallback channel if you prefer chat. For the full legal picture — including KVKK / privacy rights, retention and how vividclinic.net handles data — read the Privacy / KVKK notice linked from this site. Do not include payment card details or highly sensitive medical records in the message field; share clinical photos only later on WhatsApp if the coordinator asks. If you want data removed from outreach lists, say so when you speak with the team.",
  },
  {
    question: "Can I contact via WhatsApp instead?",
    answer:
      "Absolutely. Every major step on vivid.clinic offers a WhatsApp option, and you can message the coordinator directly at any time instead of finishing the form. Use the header, sticky bar, estimate summary or booking success screens — each opens a chat to the clinic's WhatsApp number with optional prefilled context when you came from the estimate tool. WhatsApp is often the easiest path for international patients who want quick clarification, to send photos after the first reply, or to continue in their preferred language once a coordinator is assigned. The form is still useful if you want structured fields for treatment category and consent, but it is never mandatory. There is no fee to start on WhatsApp, no online payment on this site, and you can move between channels if your questions change. If chat is quiet outside Türkiye business hours, leave a clear message with your time zone and preferred contact method so the team can follow up when the clinic reopens.",
  },
];
