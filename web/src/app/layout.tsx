import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted (not loaded from Google Fonts at request time): faster, works
// offline, and avoids sending EU visitors' IPs to Google at page-load —
// worth doing regardless for a clinic site with international/EU patients.
// Variable fonts, sourced from google/fonts (OFL-licensed) — see the
// OFL-*.txt files in this folder.
const cormorant = localFont({
  src: [
    { path: "./fonts/CormorantGaramond-Variable.ttf", style: "normal" },
    { path: "./fonts/CormorantGaramond-Italic-Variable.ttf", style: "italic" },
  ],
  variable: "--font-display",
  display: "swap",
});

const inter = localFont({
  src: "./fonts/Inter-Variable.ttf",
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://vivid.clinic"),
  title: "Vivid Clinic Reviews | Real Patient Reviews in Istanbul",
  description:
    "Real Google reviews from Vivid Clinic patients — Istanbul's premium aesthetic and cosmetic surgery center. 5.0 average across 159 verified reviews.",
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

export default function RootLayout({ children }: LayoutProps<"/">) {
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
