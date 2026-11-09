"use client";

import * as React from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
  type TargetAndTransition,
} from "motion/react";

import { cn } from "@/lib/utils";
import { useHydrated } from "@/components/ui/motion-provider";

// "Count Up" from 21st.dev (@unlumen/count-up): an animated number that
// springs to its target the first time it scrolls into view, with
// per-digit "slide" (odometer), "fade" and "blur" effects.
//
// Adapted for this project:
//  - the upstream `react-use-measure` dependency is replaced by a tiny
//    ResizeObserver hook, so no new package is needed;
//  - `prefers-reduced-motion: reduce` renders the final value immediately;
//  - formatting uses the page locale instead of hard-coded en-US.

type DigitEffect = "none" | "fade" | "blur" | "slide";

interface CountUpProps {
  to: number;
  from?: number;
  direction?: "up" | "down";
  delay?: number;
  duration?: number;
  digitEffect?: DigitEffect;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  /** BCP-47 locale for number formatting (defaults to en-US). */
  locale?: string;
  /**
   * Fixed number of fraction digits. By default they're inferred from
   * `from`/`to`, which can't express a trailing zero (5.0 → "5"); pass
   * `decimals={1}` to keep it.
   */
  decimals?: number;
  onStart?: () => void;
  onEnd?: () => void;
}

function useMeasuredHeight<T extends HTMLElement>(): [
  React.RefCallback<T>,
  number,
] {
  const [height, setHeight] = React.useState(0);
  const observer = React.useRef<ResizeObserver | null>(null);

  const ref = React.useCallback((node: T | null) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!node) return;
    setHeight(node.getBoundingClientRect().height);
    if (typeof ResizeObserver !== "undefined") {
      observer.current = new ResizeObserver(([entry]) => {
        if (entry) setHeight(entry.contentRect.height);
      });
      observer.current.observe(node);
    }
  }, []);

  return [ref, height];
}

type OdometerDigitProps = {
  springValue: MotionValue<number>;
  /** place value: 0.1, 1, 10, 100, 1000 … */
  place: number;
  /** The least-significant digit rolls continuously; higher ones step. */
  continuous: boolean;
};

function OdometerDigit({ springValue, place, continuous }: OdometerDigitProps) {
  const [ref, height] = useMeasuredHeight<HTMLSpanElement>();

  const y = useTransform(springValue, (v) => {
    if (!height) return 0;
    const scaled = Math.abs(v) / place;
    const digit = (continuous ? scaled : Math.floor(scaled + 1e-6)) % 10;
    return -digit * height;
  });

  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        width: "1ch",
        overflowY: "clip",
        overflowX: "visible",
        // A little taller than the glyph box so display faces with
        // descending (old-style) figures aren't clipped, and each slot below
        // hides its own overflow so a neighbouring digit's descender can't
        // peek into the visible one.
        lineHeight: 1.2,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <span ref={ref} style={{ visibility: "hidden", display: "block" }}>
        0
      </span>
      <motion.span
        style={{
          y,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* 11 digits (0–9 + repeated 0) so the 9→0 wrap is seamless */}
        {Array.from({ length: 11 }, (_, i) => (
          <span
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              height: height || "1.2em",
            }}
          >
            {i % 10}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

type CharSlotProps = {
  char: string;
  charKey: string;
  effect: Exclude<DigitEffect, "none" | "slide">;
  countingUp: boolean;
};

const CHAR_VARIANTS = {
  fade: {
    initial: { opacity: 0, scale: 0.7 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.7 },
    transition: { duration: 0.14, ease: "easeOut" },
    overflow: "hidden" as const,
  },
  blur: {
    initial: (up: boolean) => ({
      opacity: 0,
      filter: "blur(8px)",
      y: up ? -8 : 8,
    }),
    animate: { opacity: 1, filter: "blur(0px)", y: 0 },
    exit: (up: boolean) => ({
      opacity: 0,
      filter: "blur(8px)",
      y: up ? 8 : -8,
    }),
    transition: { duration: 0.18, ease: "easeOut" },
    overflow: "visible" as const,
  },
};

function CharSlot({ char, charKey, effect, countingUp }: CharSlotProps) {
  const isDigit = /\d/.test(char);

  if (!isDigit) {
    return <span style={{ display: "inline-block" }}>{char}</span>;
  }

  const v = CHAR_VARIANTS[effect];
  const initial: TargetAndTransition =
    typeof v.initial === "function" ? v.initial(countingUp) : v.initial;
  const exit: TargetAndTransition =
    typeof v.exit === "function" ? v.exit(countingUp) : v.exit;

  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        overflow: v.overflow,
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={charKey}
          initial={initial}
          animate={v.animate}
          exit={exit}
          transition={v.transition as object}
          style={{ display: "inline-block" }}
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function getDecimalPlaces(num: number): number {
  const str = num.toString();
  if (str.includes(".")) {
    const decimals = str.split(".")[1];
    if (decimals && parseInt(decimals) !== 0) return decimals.length;
  }
  return 0;
}

function CountUp({
  to,
  from = 0,
  direction = "up",
  delay = 0,
  duration = 2,
  digitEffect = "none",
  className,
  startWhen = true,
  separator = "",
  locale = "en-US",
  decimals,
  onStart,
  onEnd,
}: CountUpProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  // Reduced motion shows the final number — but only once hydrated, so the
  // first client render matches the server's and React doesn't warn.
  const prefersReduced = useReducedMotion();
  const hydrated = useHydrated();
  const reduce = !!prefersReduced && hydrated;
  const motionValue = useMotionValue(direction === "down" ? to : from);

  // Duration-based spring (no bounce) so the count settles when `duration`
  // says it does, rather than upstream's stiffness formula, which trails on
  // for a while after the visible number has stopped changing.
  const springValue = useSpring(motionValue, { duration: duration * 1000, bounce: 0 });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  const maxDecimals =
    decimals ?? Math.max(getDecimalPlaces(from), getDecimalPlaces(to));

  const formatValue = React.useCallback(
    (latest: number) => {
      const hasDecimals = maxDecimals > 0;
      const options: Intl.NumberFormatOptions = {
        useGrouping: !!separator,
        minimumFractionDigits: hasDecimals ? maxDecimals : 0,
        maximumFractionDigits: hasDecimals ? maxDecimals : 0,
      };
      let formatted: string;
      try {
        formatted = Intl.NumberFormat(locale, options).format(latest);
      } catch {
        formatted = Intl.NumberFormat("en-US", options).format(latest);
      }
      return separator ? formatted.replace(/[,   ]/g, separator) : formatted;
    },
    [maxDecimals, separator, locale],
  );

  const finalStr = formatValue(direction === "down" ? from : to);
  const initialStr = formatValue(direction === "down" ? to : from);
  // The starting value is rendered on the server (below), so there's no
  // reset effect here — the spring subscription takes over after hydration.
  const [chars, setChars] = React.useState<string[]>(initialStr.split(""));

  React.useEffect(() => {
    if (reduce) return;
    if (isInView && startWhen) {
      onStart?.();
      const t1 = setTimeout(() => {
        motionValue.set(direction === "down" ? from : to);
      }, delay * 1000);
      const t2 = setTimeout(() => onEnd?.(), delay * 1000 + duration * 1000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [
    isInView,
    startWhen,
    motionValue,
    direction,
    from,
    to,
    delay,
    onStart,
    onEnd,
    duration,
    reduce,
  ]);

  React.useEffect(() => {
    if (reduce) return;
    const unsubscribe = springValue.on("change", (latest: number) => {
      if (digitEffect === "none") {
        if (ref.current) ref.current.textContent = formatValue(latest);
      } else if (digitEffect !== "slide") {
        setChars(formatValue(latest).split(""));
      }
    });
    return () => unsubscribe();
  }, [springValue, formatValue, digitEffect, reduce]);

  // Reduced motion: the final number, immediately, no spring.
  if (reduce) {
    return (
      <span ref={ref} className={cn(className)} style={{ fontVariantNumeric: "tabular-nums" }}>
        {finalStr}
      </span>
    );
  }

  const countingUp = direction === "up";

  if (digitEffect === "slide") {
    const targetStr = finalStr;
    const structure: Array<{
      type: "digit" | "sep";
      char?: string;
      placeIdx?: number;
    }> = [];
    let digitCount = 0;
    for (const ch of targetStr) {
      if (/\d/.test(ch)) digitCount++;
    }
    let d = 0;
    for (const ch of targetStr) {
      if (/\d/.test(ch)) {
        const placeFromRight = digitCount - 1 - d;
        structure.push({ type: "digit", placeIdx: placeFromRight });
        d++;
      } else {
        structure.push({ type: "sep", char: ch });
      }
    }

    return (
      <span
        ref={ref}
        className={cn("inline-flex items-center", className)}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {structure.map((item, i) =>
          item.type === "sep" ? (
            <span key={i}>{item.char}</span>
          ) : (
            <OdometerDigit
              key={i}
              springValue={springValue}
              // Decimal digits are "places" below 1, so the odometer scale
              // treats the whole number as an integer with the decimals
              // shifted up: 5.0 → "50" with place 10 and 1.
              place={Math.pow(10, item.placeIdx! - maxDecimals)}
              continuous={item.placeIdx === 0}
            />
          ),
        )}
      </span>
    );
  }

  if (digitEffect === "none") {
    // Server-render the starting value so there's no empty gap before
    // hydration; the effect above takes over the text from there.
    return (
      <span ref={ref} className={cn(className)} style={{ fontVariantNumeric: "tabular-nums" }}>
        {initialStr}
      </span>
    );
  }

  return (
    <span ref={ref} className={cn("inline-flex items-center", className)}>
      {chars.map((char, i) => (
        <CharSlot
          key={i}
          char={char}
          charKey={`${i}-${char}`}
          effect={digitEffect as Exclude<DigitEffect, "none" | "slide">}
          countingUp={countingUp}
        />
      ))}
    </span>
  );
}

export { CountUp, type CountUpProps, type DigitEffect };

export default CountUp;
