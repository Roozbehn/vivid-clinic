import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import localFont from "next/font/local";
import "../../globals.css";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getDictionary } from "@/lib/i18n/dictionary";
import { LOCALE_CODES, isRtl, localeConfig } from "@/lib/i18n/locales";
import { localeAlternates } from "@/lib/i18n/alternates";

// Same self-hosted variable fonts as the English root layout (see
// app/(en)/layout.tsx) — shared files under app/fonts, one directory level
// further up from here.
const cormorant = localFont({
  src: [
    { path: "../../fonts/CormorantGaramond-Variable.ttf", style: "normal" },
    { path: "../../fonts/CormorantGaramond-Italic-Variable.ttf", style: "italic" },
  ],
  variable: "--font-display",
  display: "swap",
});

const inter = localFont({
  src: "../../fonts/Inter-Variable.ttf",
  variable: "--font-inter",
  display: "swap",
});

// Fully static export: every translated locale is pre-rendered at build
// time, one of the 13 real codes the static site ships (see
// lib/i18n/locales.ts, ported from scripts/build-site.mjs's LOCALES array).
export function generateStaticParams() {
  return LOCALE_CODES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const title = `${dict.hero.h1} | ${dict.header.brand_name}`;

  return {
    metadataBase: new URL("https://vivid.clinic"),
    title,
    description: dict.hero.lead,
    alternates: { canonical: `/${locale}/`, languages: localeAlternates("/") },
    openGraph: {
      title,
      description: dict.hero.lead,
      url: `https://vivid.clinic/${locale}/`,
      siteName: dict.header.brand_name,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: dict.hero.lead,
    },
  };
}

// Root layout for the 13 translated locales, served at "/<code>/" (English
// stays unprefixed under app/(en)/ — see that folder's layout for why this
// is a second Next.js "root layout" rather than a shared one: a static
// export has no middleware/rewrites to vary <html lang>/dir> per request,
// so each locale group needs its own <html>/<body>).
export default async function LocaleRootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const config = localeConfig(locale);
  if (!config) notFound();

  const dict = getDictionary(locale);
  const dir = isRtl(locale) ? "rtl" : "ltr";

  return (
    <html
      lang={config.htmlLang}
      dir={dir}
      className={`${cormorant.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to main content
        </a>
        <SiteHeader locale={locale} dict={dict} variant="home" />
        {children}
        <SiteFooter locale={locale} dict={dict} hasInlineTools={false} />
      </body>
    </html>
  );
}
