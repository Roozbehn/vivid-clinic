import { ExternalLink } from "lucide-react";

import { galleryPhotos } from "@/lib/gallery";
import { clinic } from "@/lib/clinic";

function formatPhotoDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export function PhotosSection() {
  if (galleryPhotos.length === 0) return null;

  return (
    <section id="photos" aria-labelledby="photos-h" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="rounded-full border border-border px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Patient photos
          </span>
          <h2
            id="photos-h"
            className="mt-5 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
          >
            Photos from patients on Google
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Uploaded publicly by patients to Vivid Clinic&rsquo;s Google
            listing — shown exactly as posted, and not linked to specific
            reviews.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {galleryPhotos.map((photo) => (
            <a
              key={photo.id}
              href={photo.fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-[4/5] overflow-hidden rounded-xl border border-border bg-card"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer */}
              <img
                src={photo.gridUrl}
                alt={`Photo uploaded by ${photo.uploader || "a patient"} on Google`}
                width={photo.width}
                height={photo.height}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-xs text-white">
                {photo.uploader || "Google user"}
                {photo.createdAt ? ` · ${formatPhotoDate(photo.createdAt)}` : ""}
              </span>
            </a>
          ))}
        </div>

        <p className="mt-10 text-center">
          <a
            href={clinic.googleBusinessProfile.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            See all photos on Google
          </a>
        </p>
      </div>
    </section>
  );
}
