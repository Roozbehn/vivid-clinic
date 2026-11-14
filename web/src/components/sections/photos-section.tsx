import { ExternalLink } from "lucide-react";

import { galleryPhotos } from "@/lib/gallery";
import { clinic } from "@/lib/clinic";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { fmt } from "@/lib/i18n/format";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";

function formatPhotoDate(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return date.toLocaleDateString(locale, { month: "short", year: "numeric" });
  } catch {
    return date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  }
}

export function PhotosSection({ dict, locale }: { dict: Dictionary; locale: string }) {
  if (galleryPhotos.length === 0) return null;

  return (
    <section id="photos" aria-labelledby="photos-h" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <span className="eyebrow-chip">
            {dict.gallery.eyebrow}
          </span>
          <h2
            id="photos-h"
            className="mt-6 font-[family-name:var(--font-display)] text-[clamp(2.6rem,9vw,5.25rem)] font-medium leading-[0.95] tracking-[-0.025em] text-chrome text-balance hyphens-auto"
          >
            {dict.gallery.heading}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {dict.gallery.lead}
          </p>
        </Reveal>

        {/* Photos cascade in left-to-right, top-to-bottom, each growing from
            96% — the "stagger reveal grid" pattern. */}
        <RevealGroup
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          stagger={0.06}
          amount={0.1}
        >
          {galleryPhotos.map((photo) => (
            <RevealItem
              key={photo.id}
              as="a"
              href={photo.fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              scale={0.94}
              className="group relative block aspect-[4/5] overflow-hidden rounded-xl border border-border bg-card"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer */}
              <img
                src={photo.gridUrl}
                alt={fmt(dict.gallery.photo_alt, {
                  uploader: photo.uploader || dict.gallery.uploader_fallback_caption,
                })}
                width={photo.width}
                height={photo.height}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-xs text-white">
                {photo.uploader || dict.gallery.uploader_fallback_caption}
                {photo.createdAt ? ` · ${formatPhotoDate(photo.createdAt, locale)}` : ""}
              </span>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal as="p" amount={0.8} className="mt-10 text-center">
          <a
            href={clinic.googleBusinessProfile.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            {dict.gallery.see_all_on_google}
          </a>
        </Reveal>
      </div>
    </section>
  );
}
