"use client";

import React from "react";
import { motion } from "motion/react";

import type { Testimonial } from "@/lib/testimonials";

interface TestimonialsColumnProps {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}

export const TestimonialsColumn = ({
  className,
  testimonials,
  duration = 10,
}: TestimonialsColumnProps) => {
  return (
    <div className={className}>
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {new Array(2).fill(0).map((_, blockIndex) => (
          <React.Fragment key={blockIndex}>
            {testimonials.map(({ id, text, avatar, name, role, rating }) => (
              <figure
                key={`${blockIndex}-${id}`}
                className="w-full max-w-xs rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-md)] transition-shadow hover:shadow-[var(--shadow-hover)]"
              >
                <div
                  className="mb-3 flex gap-0.5 text-accent"
                  aria-label={`${rating} out of 5 stars`}
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} aria-hidden="true">
                      {i < rating ? "★" : "☆"}
                    </span>
                  ))}
                </div>
                <blockquote className="text-sm leading-relaxed text-foreground">
                  &ldquo;{text}&rdquo;
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <img
                    width={40}
                    height={40}
                    src={avatar}
                    alt=""
                    loading="lazy"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="flex flex-col">
                    <span className="font-medium leading-5 tracking-tight text-foreground">
                      {name}
                    </span>
                    <span className="text-xs leading-5 tracking-tight text-muted-foreground">
                      {role}
                    </span>
                  </div>
                </figcaption>
              </figure>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};
