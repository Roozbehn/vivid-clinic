import clinicData from "@/data/generated/clinic.json";

// Typed view over the repo's verified brand + contact facts
// (../src/data/clinic.json — sourced from the live vividclinic.net
// MedicalOrganization/Place schema; see that file's `_note_facts`). Do not
// invent or alter these values — they flow in from the generated copy at
// build time (see scripts/sync-data.mjs), so updating the repo-root file is
// the only way to change them.
interface ClinicData {
  name: string;
  tagline: string;
  descriptor: string;
  businessSite: string;
  reviewSite: string;
  contact: {
    phonePrimaryHref: string;
    phonePrimary: string;
    whatsappUrl: string;
    whatsappPrefill: string;
    consultationUrl: string;
  };
  googleBusinessProfile: { mapsUrl: string };
  brand: {
    teal: string;
    tealDeep: string;
    gold: string;
    cream: string;
    ink: string;
    fontDisplay: string;
    fontBody: string;
  };
}

const raw = clinicData as unknown as ClinicData;

export const clinic = {
  name: raw.name,
  tagline: raw.tagline,
  descriptor: raw.descriptor,
  businessSite: raw.businessSite,
  reviewSite: raw.reviewSite,
  contact: {
    phonePrimaryHref: raw.contact.phonePrimaryHref,
    phonePrimaryDisplay: raw.contact.phonePrimary,
    whatsappUrl: raw.contact.whatsappUrl,
    whatsappPrefill: raw.contact.whatsappPrefill,
    consultationUrl: raw.contact.consultationUrl,
  },
  googleBusinessProfile: {
    mapsUrl: raw.googleBusinessProfile.mapsUrl,
  },
  brand: raw.brand,
} as const;
