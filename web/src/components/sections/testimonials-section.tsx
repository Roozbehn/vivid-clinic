"use client";

import { motion } from "motion/react";

import { TestimonialsColumn } from "@/components/ui/testimonials-columns-1";
import { firstColumn, secondColumn, thirdColumn } from "@/lib/testimonials";
import { clinic } from "@/lib/clinic";

export function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-h"
      className="relative my-10 bg-background py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto flex max-w-xl flex-col items-center text-center"
        >
          <div className="flex justify-center">
            <span className="rounded-full border border-border px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
              Patient Reviews
            </span>
          </div>

          <h2
            id="testimonials-h"
            className="mt-5 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
          >
            What our patients say
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            Real, verified reviews from Vivid Clinic patients on Google — 5.0
            average across 159 reviews.
          </p>
          <a
            href={clinic.googleBusinessProfile.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 text-sm font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary"
          >
            View all reviews on Google →
          </a>
        </motion.div>

        <div className="mt-14 flex max-h-[740px] justify-center gap-6 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]">
          <TestimonialsColumn testimonials={firstColumn} duration={16} />
          <TestimonialsColumn
            testimonials={secondColumn}
            duration={20}
            className="hidden md:block"
          />
          <TestimonialsColumn
            testimonials={thirdColumn}
            duration={18}
            className="hidden lg:block"
          />
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Patient experiences are individual and may vary. A medical
          consultation is required for personalized advice.
        </p>
      </div>
    </section>
  );
}
