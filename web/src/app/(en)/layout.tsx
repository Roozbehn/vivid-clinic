import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "../globals.css";

import { localeAlternates } from "@/lib/i18n/alternates";

// Self-hosted (not loaded from Google Fonts at request time): faster, works
// offline, and avoids sending EU visitors' IPs to Google at page-load —
// worth doing regardless for a clinic site with international/EU patients.
// Variable fonts, sourced from google/fonts (OFL-licensed) — see the
// OFL-*.txt files in ../fonts.
const cormorant = localFont({
  src: [
    { path: "../fonts/CormorantGaramond-Variable.ttf", style: "normal" },
    { path: "../fonts/CormorantGaramond-Italic-Variable.ttf", style: "italic" },
  ],
  variable: "--font-display",
  display: "swap",
});

const inter = localFont({
  src: "../fonts/Inter-Variable.ttf",
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://vivid.clinic"),
  title: "Vivid Clinic Reviews | Real Patient Reviews in Istanbul",
  description:
    "Real Google reviews from Vivid Clinic patients — Istanbul's premium aesthetic and cosmetic surgery center. 5.0 average across 159 verified reviews.",
  alternates: { canonical: "/", languages: localeAlternates("/") },
  openGraph: {
    title: "Vivid Clinic Reviews | Real Patient Reviews in Istanbul",
    description:
      "Real Google reviews from Vivid Clinic patients — Istanbul's premium aesthetic and cosmetic surgery center.",
    url: "https://vivid.clinic",
    siteName: "Vivid Clinic",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vivid Clinic Reviews | Real Patient Reviews in Istanbul",
    description:
      "Real Google reviews from Vivid Clinic patients — Istanbul's premium aesthetic and cosmetic surgery center.",
  },
};

// English root layout (this route group has no URL prefix, matching the
// static site's default locale). The 13 translated locales live under
// app/(intl)/[locale]/ with their own root layout — see that folder for why
// this is a separate Next.js "root layout" rather than a shared one (a fully
// static export can't use middleware/rewrites to vary <html lang>/dir> per
// request, so each locale group owns its own <html>/<body>).
//
// SiteHeader/SiteFooter are rendered by each page (not here): the header's
// brand-subtitle text differs between "/" and "/consultation/" (variant
// "home" vs "consultation", matching the static site's per-page templates),
// which a shared layout can't express without client-side pathname reads.
export default function EnglishRootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
