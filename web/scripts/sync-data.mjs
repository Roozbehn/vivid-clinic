#!/usr/bin/env node
// Copies the repo's source-of-truth data files (../src/data/*.json — the
// authorized, GBP-API-sourced review dataset and verified clinic facts)
// into web/src/data/generated/ so the Next.js app can import them at build
// time. This file is regenerated on every `npm run dev`/`npm run build`
// (see package.json's predev/prebuild) — never edit the generated copies
// directly, and never edit ../src/data from inside web/.
import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoDataDir = join(__dirname, "..", "..", "src", "data");
const outDir = join(__dirname, "..", "src", "data", "generated");

const FILES = ["google-reviews.json", "clinic.json"];

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

console.log(`sync-data: copied ${FILES.join(", ")} into src/data/generated/`);
