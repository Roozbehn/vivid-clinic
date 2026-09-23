"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

// Decorative "tubes" cursor-following WebGL background (threejs-components'
// cursors/tubes1), used as a subtle animated layer behind the homepage
// hero's real headline/CTAs — never as a replacement for them.
//
// The upstream effect isn't published as an npm dependency of this project
// (it's a standalone browser build on jsDelivr), so it's loaded at runtime
// via a genuine dynamic `import()` of that URL. That import is issued
// through an indirectly-constructed `Function` rather than written as a
// literal `import("https://...")` in this file, specifically so bundlers
// (webpack/Turbopack) never try to statically resolve or bundle the remote
// URL at build time — only the browser's own native ESM loader ever sees it,
// at runtime, in the browser, after this component mounts.
const importFromUrl = (url: string): Promise<{ default: TubesCursorFactory }> =>
  new Function("specifier", "return import(specifier)")(url);

const TUBES_CDN_URL =
  "https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js";

interface TubesCursorApp {
  tubes: {
    setColors: (colors: string[]) => void;
    setLightsColors: (colors: string[]) => void;
  };
  dispose?: () => void;
}

type TubesCursorFactory = (
  canvas: HTMLCanvasElement,
  options: {
    tubes: {
      colors: string[];
      lights: { intensity: number; colors: string[] };
    };
  },
) => TubesCursorApp;

// Brand-matched palette (teal / gold / cream, from globals.css's locked
// brand tokens) rather than the library demo's purple/pink/red defaults, so
// the effect reads as Vivid Clinic's own rather than a generic template.
const TUBE_COLORS = ["#0E4B4E", "#1E7A7D", "#B8945A"];
const LIGHT_COLORS = ["#0E4B4E", "#B8945A", "#FAF7F2", "#1E7A7D"];

/**
 * Purely decorative — `aria-hidden`, click-through (`pointer-events-none`),
 * and safe to render nothing:
 *  - visitors with `prefers-reduced-motion: reduce` never load or run it;
 *  - if the remote script fails (offline, CDN down, blocked), it's caught
 *    and logged, not thrown.
 * In both cases the hero simply keeps showing its existing brand gradient
 * background underneath, rather than an empty or broken canvas.
 */
export function TubesCursorBackground({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<TubesCursorApp | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let cancelled = false;
    // A short delay lets the canvas receive its final layout size before the
    // library measures it — initializing on the same tick as mount can hand
    // it a zero-size element and produce invalid ("NaN radius") geometry.
    const initTimer = setTimeout(() => {
      importFromUrl(TUBES_CDN_URL)
        .then(({ default: createTubesCursor }) => {
          if (cancelled || !canvasRef.current) return;
          appRef.current = createTubesCursor(canvasRef.current, {
            tubes: {
              colors: TUBE_COLORS,
              lights: { intensity: 200, colors: LIGHT_COLORS },
            },
          });
        })
        .catch((err) => {
          console.error(
            "TubesCursor background failed to load; the hero falls back to its plain background.",
            err,
          );
        });
    }, 100);

    return () => {
      cancelled = true;
      clearTimeout(initTimer);
      appRef.current?.dispose?.();
      appRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 z-0 h-full w-full", className)}
    />
  );
}
