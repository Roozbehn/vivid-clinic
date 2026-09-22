import {
  MapPin,
  Globe,
  ConciergeBell,
  ClipboardCheck,
  Sparkles,
  Layers,
  type LucideIcon,
} from "lucide-react";

// Real copy, ported verbatim from the static site's i18n catalog
// (src/data/i18n/source.en.json — "why"/"features" keys). Shared by the
// homepage "Why Vivid Clinic" section and the consultation page's
// "Why book with us" section, exactly as scripts/build-site.mjs reuses the
// same `features` array for both `why` and `whyBookSection`.
export interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
}

export const FEATURES: Feature[] = [
  {
    icon: MapPin,
    title: "In the heart of Istanbul",
    body: "Vivid Clinic is based in Bakırköy, Istanbul — a convenient base for international patients travelling for treatment.",
  },
  {
    icon: Globe,
    title: "Multilingual coordination",
    body: "Your care is coordinated in English, Turkish and Arabic, so language is never a barrier to the right information.",
  },
  {
    icon: ConciergeBell,
    title: "End-to-end concierge care",
    body: "Hospitality-led support from arrival to recovery — the clinic looks after the details around your treatment.",
  },
  {
    icon: ClipboardCheck,
    title: "Personalised treatment planning",
    body: "Your plan and questions are discussed before you travel, so you arrive in Istanbul knowing what to expect.",
  },
  {
    icon: Sparkles,
    title: "A calm, modern clinic",
    body: "A premium, unhurried environment designed around patient comfort rather than a clinical production line.",
  },
  {
    icon: Layers,
    title: "Specialties under one roof",
    body: "Hair, face, body, breast, weight-loss and dental treatments — coordinated by one team in one place.",
  },
];
