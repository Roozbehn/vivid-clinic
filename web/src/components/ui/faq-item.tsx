"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";
import { motion, MotionConfig, useReducedMotion } from "motion/react";

// Expand/collapse built on 21st.dev's "Accordion" from the official Motion
// examples catalog (@motiondotdev/motion-accordion): the answer animates
// its height to `auto` while a mask fades its lower edge, and the text
// itself un-blurs as it settles. Markup/ARIA (button + aria-expanded +
// aria-controls, Plus icon rotating to a ×) is unchanged from before.
export function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const reduce = useReducedMotion();

  return (
    <MotionConfig transition={{ duration: reduce ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}>
      {/* The row divider lives on the wrapper in the section (so stagger
          wrappers don't break `:last-child`); this only owns the padding. */}
      <motion.div
        className="py-5"
        initial={false}
        animate={open ? "open" : "closed"}
      >
        <button
          type="button"
          id={`${id}-button`}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={id}
          className="flex w-full items-center justify-between gap-4 text-left"
        >
          <span className="font-medium text-foreground">{question}</span>
          <motion.span
            className="shrink-0 text-primary"
            variants={{ open: { rotate: 45 }, closed: { rotate: 0 } }}
            aria-hidden="true"
          >
            <Plus className="h-4 w-4" />
          </motion.span>
        </button>

        <motion.div
          id={id}
          role="region"
          aria-labelledby={`${id}-button`}
          className="overflow-hidden"
          variants={{
            open: {
              height: "auto",
              maskImage: "linear-gradient(to bottom, black 100%, transparent 100%)",
            },
            closed: {
              height: 0,
              maskImage: "linear-gradient(to bottom, black 50%, transparent 100%)",
            },
          }}
          // Keep collapsed content out of the tab order and the a11y tree.
          inert={!open ? true : undefined}
        >
          <motion.div
            className="pt-3 text-sm leading-relaxed text-muted-foreground"
            variants={{
              open: { filter: "blur(0px)", opacity: 1 },
              closed: { filter: "blur(2px)", opacity: 0 },
            }}
          >
            <p>{answer}</p>
          </motion.div>
        </motion.div>
      </motion.div>
    </MotionConfig>
  );
}
