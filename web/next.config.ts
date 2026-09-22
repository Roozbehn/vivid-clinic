import type { NextConfig } from "next";

// Static export: the site is deployed as plain HTML/CSS/JS to Cloudflare
// Pages (see /functions/api/booking.js at the repo root for the one dynamic
// endpoint, which Cloudflare Pages Functions serves independently of this
// static build).
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    // next/image's default loader needs a running server; with a static
    // export we serve pre-sized files directly instead.
    unoptimized: true,
  },
};

export default nextConfig;
