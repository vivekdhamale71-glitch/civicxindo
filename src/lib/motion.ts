import type { Transition, Variants } from "motion/react";

/** Shared motion tokens. Every animation in the app draws from these. */
export const spring = {
  snappy: { type: "spring", stiffness: 400, damping: 30 } as Transition,
  smooth: { type: "spring", stiffness: 260, damping: 28 } as Transition,
  gentle: { type: "spring", stiffness: 120, damping: 20 } as Transition,
};

export const ease = {
  out: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

export const duration = { micro: 0.15, ui: 0.3, hero: 0.65 };

/** Stagger 40–60 ms, capped at 8 items so long lists never feel slow. */
export const STAGGER = 0.05;
export const staggerDelay = (i: number) => Math.min(i, 8) * STAGGER;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number = 0) => ({ opacity: 1, y: 0, transition: { duration: duration.ui, ease: ease.out, delay: staggerDelay(i) } }),
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: duration.ui, ease: ease.out } },
};

export const tap = { scale: 0.97 };

export const inViewOnce = { once: true, amount: 0.3 } as const;
