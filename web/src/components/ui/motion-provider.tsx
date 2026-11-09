"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { MotionConfig } from "motion/react";

// App-wide Motion settings, mounted once in each root layout.
//
// `reducedMotion="user"` is Motion's built-in honouring of the visitor's
// `prefers-reduced-motion` setting: transform/layout animations are skipped
// (elements land in place instantly) while opacity still fades, so the
// scroll-reveal sections degrade to a plain fade-in — and, crucially, the
// server and client render identical markup, so there's no hydration
// mismatch from branching on the preference during render.
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

const subscribeNoop = () => () => {};

/**
 * `false` on the server and during hydration, `true` afterwards. Use it to
 * gate client-only rendering decisions (like swapping an animated number for
 * its final value under reduced motion) without a server/client mismatch.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}
