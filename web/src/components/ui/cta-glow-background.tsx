"use client";

import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import { useHydrated } from "@/components/ui/motion-provider";

// Ambient background for the teal CTA band, in the spirit of 21st.dev's
// "Background Gradient Glow" components but deliberately restrained for a
// clinic: two soft radial blobs in the brand gold and a lighter teal drift
// very slowly behind the copy. Purely decorative (`aria-hidden`), sits at
// z-0 under the content, and is a static glow under reduced motion.
export function CtaGlowBackground({ className }: { className?: string }) {
  // Only honour the preference after hydration so server and client render
  // the same first frame.
  const prefersReduced = useReducedMotion();
  const hydrated = useHydrated();
  const reduce = !!prefersReduced && hydrated;

  const blobBase =
    "pointer-events-none absolute rounded-full blur-3xl will-change-transform";

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 z-0 overflow-hidden", className)}
    >
      {/* Gold glow, upper-left */}
      <motion.div
        className={cn(blobBase, "-left-24 -top-32 h-[28rem] w-[28rem]")}
        style={{
          background:
            "radial-gradient(closest-side, rgba(184,148,90,0.45), rgba(184,148,90,0))",
        }}
        animate={
          reduce
            ? undefined
            : { x: [0, 60, -20, 0], y: [0, 30, 70, 0], scale: [1, 1.08, 0.96, 1] }
        }
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Light-teal glow, lower-right */}
      <motion.div
        className={cn(blobBase, "-bottom-40 -right-24 h-[32rem] w-[32rem]")}
        style={{
          background:
            "radial-gradient(closest-side, rgba(30,122,125,0.6), rgba(30,122,125,0))",
        }}
        animate={
          reduce
            ? undefined
            : { x: [0, -70, 20, 0], y: [0, -40, -80, 0], scale: [1, 0.94, 1.1, 1] }
        }
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Faint cream highlight, center — gives the band depth without noise */}
      <motion.div
        className={cn(blobBase, "left-1/2 top-1/2 h-[22rem] w-[40rem] -translate-x-1/2 -translate-y-1/2")}
        style={{
          background:
            "radial-gradient(closest-side, rgba(250,247,242,0.12), rgba(250,247,242,0))",
        }}
        animate={reduce ? undefined : { opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
