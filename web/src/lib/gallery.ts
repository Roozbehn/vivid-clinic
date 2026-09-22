import mediaData from "@/data/generated/google-media.json";

// Typed view over the repo's real, self-hosted Google Business Profile patient
// photos (../src/data/google-media.json — see that file's `meta.notes`).
// COMPLIANCE: the Business Profile API provides no review linkage, so these
// are presented as standalone listing photos with uploader attribution only
// — never tied to a specific review (see README-reviews.md).
//
// The underlying image bytes were downloaded at import time (they're real
// patient uploads, not hotlinked Google URLs, which expire) and live in this
// app's public/gbp/ folder — copied in from ../src/assets/gbp/ once, the same
// way the self-hosted fonts were. Re-run the import + copy if the clinic's
// Google listing gets new photos.
interface GalleryItem {
  id: string;
  file: string;
  grid: string;
  uploader: string;
  createdAt: string;
  width: number;
  height: number;
}

interface MediaDataset {
  meta: { source: string; lastImportedAt: string };
  items: GalleryItem[];
}

const dataset = mediaData as unknown as MediaDataset;

const basename = (path: string) => path.split("/").pop() ?? path;

export interface GalleryPhoto {
  id: string;
  uploader: string;
  createdAt: string;
  width: number;
  height: number;
  fullUrl: string;
  gridUrl: string;
}

// Every item is included: all of them have a matching file committed under
// public/gbp/ (see the note above), unlike the static site's importer which
// has to defensively drop items whose download failed.
export const galleryPhotos: GalleryPhoto[] = dataset.items.map((item) => ({
  id: item.id,
  uploader: item.uploader,
  createdAt: item.createdAt,
  width: item.width,
  height: item.height,
  fullUrl: `/gbp/${basename(item.file)}`,
  gridUrl: `/gbp/${basename(item.grid)}`,
}));
