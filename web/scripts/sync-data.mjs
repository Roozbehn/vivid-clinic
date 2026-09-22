#!/usr/bin/env node
// Copies the repo's source-of-truth data files (../src/data/*.json — the
// authorized, GBP-API-sourced review dataset and verified clinic facts)
// into web/src/data/generated/ so the Next.js app can import them at build
// time. This file is regenerated on every `npm run dev`/`npm run build`
// (see package.json's predev/prebuild) — never edit the generated copies
// directly, and never edit ../src/data from inside web/.
import { existsSync, mkdirSync, copyFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoDataDir = join(__dirname, "..", "..", "src", "data");
const outDir = join(__dirname, "..", "src", "data", "generated");

const FILES = [
  "google-reviews.json",
  "clinic.json",
  "google-media.json",
  "estimate-pricing.json",
  "booking-options.json",
];

if (!existsSync(repoDataDir)) {
  console.error(
    `sync-data: expected repo data at ${repoDataDir} — is this checked out inside the full vivid-clinic repo?`,
  );
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

for (const file of FILES) {
  const src = join(repoDataDir, file);
  if (!existsSync(src)) {
    console.error(`sync-data: missing ${src}`);
    process.exit(1);
  }
  copyFileSync(src, join(outDir, file));
}

// i18n catalogs (src/data/i18n/*.json): source.en.json is the English catalog,
// ui.<code>.json are the 13 translation packs, reviews.<code>.json are the
// per-locale review-text translation overlays. Copy the whole directory so
// web/src/lib/i18n/dictionary.ts can import any of them.
const repoI18nDir = join(repoDataDir, "i18n");
const outI18nDir = join(outDir, "i18n");
mkdirSync(outI18nDir, { recursive: true });
let i18nCount = 0;
if (existsSync(repoI18nDir)) {
  for (const file of readdirSync(repoI18nDir)) {
    if (!file.endsWith(".json")) continue;
    copyFileSync(join(repoI18nDir, file), join(outI18nDir, file));
    i18nCount++;
  }
}

console.log(
  `sync-data: copied ${FILES.join(", ")} and ${i18nCount} i18n catalog(s) into src/data/generated/`,
);
