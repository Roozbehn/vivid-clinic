"use client";

import { motion } from "motion/react";

import { REVEAL_EASE } from "@/components/ui/reveal";

// The thin connecting line behind the "How it works" step badges (desktop
// only). Draws itself left-to-right as the steps reveal — the "timeline
// rail" idea from 21st.dev's How It Works timelines, kept horizontal to
// match this section's 4-column layout. Decorative; under reduced motion
// (<MotionProvider>) the scale transform is skipped and it's simply there.
export function StepRail({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={
        className ??
        // 4 columns with gap-8: from the centre of badge 1 (1.25rem in) to
        // the centre of badge 4 (one column of 25% − 1.5rem gap share, minus
        // the same 1.25rem, from the right edge).
        "pointer-events-none absolute left-5 right-[calc(25%-2.75rem)] top-5 hidden h-px lg:block"
      }
    >
      <div className="h-full w-full bg-border" />
      <motion.div
        className="absolute inset-0 origin-left bg-primary/40"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 1 }}
        transition={{ duration: 1.4, delay: 0.2, ease: REVEAL_EASE }}
      />
    </div>
  );
}
