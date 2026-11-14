"use client";

import type { ReactNode } from "react";
import { motion, type Variants } from "motion/react";

// Scroll-reveal primitives for the section layouts, after 21st.dev's
// "Reveal" (klyv-ui) and "Stagger Reveal Grid" (pulkitxm) patterns: an
// element fades/slides into place the first time it scrolls into view, and
// a group of siblings does the same with a short stagger between them.
//
// Server components can use these freely — they're client components that
// only wrap server-rendered children, so headings, cards, icons, etc. keep
// rendering on the server and nothing about the markup/SEO changes.
//
// Reduced motion is handled app-wide by <MotionProvider> (MotionConfig
// reducedMotion="user"): for those visitors the slide/scale part is skipped
// and only the opacity fades, with identical server/client markup.

type Direction = "up" | "down" | "left" | "right" | "none";

const OFFSET = 24;

function offsetFor(direction: Direction) {
  switch (direction) {
    case "up":
      return { x: 0, y: OFFSET };
    case "down":
      return { x: 0, y: -OFFSET };
    case "left":
      return { x: OFFSET, y: 0 };
    case "right":
      return { x: -OFFSET, y: 0 };
    default:
      return { x: 0, y: 0 };
  }
}

// Shared easing, matching the hero/testimonials heading reveal that already
// ships, so every section settles with the same calm, decelerating feel.
export const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;

// Reveal slightly before the element reaches the bottom edge of the viewport.
const VIEWPORT_MARGIN = "0px 0px -8% 0px";

export function revealVariants(
  direction: Direction = "up",
  { scale = 1, blur = false }: { scale?: number; blur?: boolean } = {},
): Variants {
  const { x, y } = offsetFor(direction);
  return {
    hidden: {
      opacity: 0,
      x,
      y,
      scale,
      ...(blur ? { filter: "blur(6px)" } : {}),
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      ...(blur ? { filter: "blur(0px)" } : {}),
    },
  };
}

type RevealTag = "div" | "section" | "span" | "p" | "li" | "ul" | "ol" | "article" | "a";

interface RevealProps {
  children: ReactNode;
  className?: string;
  direction?: Direction;
  delay?: number;
  duration?: number;
  /** Start slightly smaller and grow to full size (e.g. 0.96). */
  scale?: number;
  /** Un-blur as it fades in. */
  blur?: boolean;
  /**
   * How much of the element must be visible before it reveals (0–1), or
   * "some" for any part of it. Use "some" for wrappers that can be taller
   * than the viewport (e.g. long forms): a ratio like 0.15 of a 6,000px
   * element can never fit on screen, so it would stay invisible forever.
   */
  amount?: number | "some" | "all";
  /** Render as a different element than a div. */
  as?: RevealTag;
}

export function Reveal({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 0.7,
  scale = 1,
  blur = false,
  amount = 0.3,
  as = "div",
}: RevealProps) {
  const Tag = motion[as];

  return (
    <Tag
      className={className}
      variants={revealVariants(direction, { scale, blur })}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount, margin: VIEWPORT_MARGIN }}
      transition={{ duration, delay, ease: REVEAL_EASE }}
    >
      {children}
    </Tag>
  );
}

// ---- Staggered groups --------------------------------------------------

interface RevealGroupProps {
  children: ReactNode;
  className?: string;
  /** Seconds between each child's reveal. */
  stagger?: number;
  /** Seconds before the first child starts. */
  delay?: number;
  amount?: number;
  as?: "div" | "ul" | "ol" | "section";
}

/**
 * Wrap a grid/list in `RevealGroup` and each item in `RevealItem`: the group
 * triggers once when it scrolls into view and the items follow in order.
 * (Motion propagates the "hidden"/"visible" variant labels down to every
 * descendant `RevealItem`, through any plain elements in between.)
 */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
  delay = 0,
  amount = 0.15,
  as = "div",
}: RevealGroupProps) {
  const Tag = motion[as];

  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount, margin: VIEWPORT_MARGIN }}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
    >
      {children}
    </Tag>
  );
}

interface RevealItemProps {
  children: ReactNode;
  className?: string;
  direction?: Direction;
  duration?: number;
  scale?: number;
  blur?: boolean;
  as?: "div" | "li" | "article" | "a" | "span" | "p" | "h1" | "h2" | "h3";
  /** Pass-through for anchors used as items. */
  href?: string;
  target?: string;
  rel?: string;
}

export function RevealItem({
  children,
  className,
  direction = "up",
  duration = 0.6,
  scale = 1,
  blur = false,
  as = "div",
  href,
  target,
  rel,
}: RevealItemProps) {
  const Tag = motion[as];
  const anchorProps = as === "a" ? { href, target, rel } : {};

  return (
    <Tag
      className={className}
      variants={revealVariants(direction, { scale, blur })}
      transition={{ duration, ease: REVEAL_EASE }}
      {...anchorProps}
    >
      {children}
    </Tag>
  );
}
