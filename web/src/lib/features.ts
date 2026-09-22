import {
  MapPin,
  Globe,
  ConciergeBell,
  ClipboardCheck,
  Sparkles,
  Layers,
  type LucideIcon,
} from "lucide-react";

import type { Dictionary } from "@/lib/i18n/dictionary";

// Real copy, ported verbatim from the static site's i18n catalog
// (src/data/i18n/source.en.json / ui.<code>.json — "features" key). Shared
// by the homepage "Why Vivid Clinic" section and the consultation page's
// "Why book with us" section, exactly as scripts/build-site.mjs reuses the
// same `features` array for both `why` and `whyBookSection`.
export interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
}

export function getFeatures(dict: Dictionary): Feature[] {
  const f = dict.features;
  return [
    { icon: MapPin, title: f.pin_title, body: f.pin_body },
    { icon: Globe, title: f.globe_title, body: f.globe_body },
    { icon: ConciergeBell, title: f.concierge_title, body: f.concierge_body },
    { icon: ClipboardCheck, title: f.plan_title, body: f.plan_body },
    { icon: Sparkles, title: f.sparkle_title, body: f.sparkle_body },
    { icon: Layers, title: f.layers_title, body: f.layers_body },
  ];
}
