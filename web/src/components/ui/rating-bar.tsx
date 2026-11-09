"use client";

import { motion } from "motion/react";

import { REVEAL_EASE } from "@/components/ui/reveal";

// One row of the star-distribution chart: the gold fill grows from the left
// to its percentage the first time it scrolls into view. Under reduced
// motion (<MotionProvider>) the scale transform is skipped, so it simply
// appears at its final width.
export function RatingBar({
  pct,
  delay = 0,
  className,
}: {
  pct: number;
  delay?: number;
  className?: string;
}) {
  const width = `${Math.max(0, Math.min(100, pct))}%`;

  return (
    <div className={className ?? "h-2 flex-1 overflow-hidden rounded-full bg-border"}>
      <motion.div
        className="h-full origin-left rounded-full bg-accent"
        style={{ width }}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.9, delay, ease: REVEAL_EASE }}
      />
    </div>
  );
}
