// Verified brand + contact facts, ported from the repo root's
// `src/data/clinic.json` (sourced from the live vividclinic.net
// MedicalOrganization/Place schema). Do not invent or alter these values —
// update only from that authoritative file.
export const clinic = {
  name: "Vivid Clinic",
  tagline: "Premium aesthetics. Quietly delivered. Istanbul.",
  descriptor: "Istanbul's Premier Aesthetic and Cosmetic Surgery Center",
  businessSite: "https://vividclinic.net",
  reviewSite: "https://vivid.clinic",
  contact: {
    phonePrimaryHref: "tel:+905457493565",
    phonePrimaryDisplay: "+90 545 749 3565",
    whatsappUrl: "https://api.whatsapp.com/send/?phone=905457423565",
    whatsappPrefill:
      "Hello Vivid Clinic, I read your patient reviews and would like a free consultation.",
    consultationUrl: "https://vividclinic.net/surgery-price-calculator/",
  },
  googleBusinessProfile: {
    mapsUrl: "https://maps.google.com/?cid=13820382962229413624",
  },
  brand: {
    teal: "#0E4B4E",
    tealDeep: "#073538",
    gold: "#B8945A",
    cream: "#FAF7F2",
    ink: "#1F2937",
    fontDisplay: "Cormorant Garamond",
    fontBody: "Inter",
  },
} as const;
