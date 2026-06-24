// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------
// Centralised Framer Motion Variants for consistent motion across the site.
// Import the variant objects you need; never duplicate them locally.
//
// Naming convention:
//   <effect><Direction|Axis?><Variant?>
//   e.g. fadeUp, lineRevealY, scaleReveal, staggerContainer
// ---------------------------------------------------------------------------

import type { Variants } from 'framer-motion';

// ---------------------------------------------------------------------------
// Shared easing curve — "luxury" spring feel, mirrors EASE.luxury in gsap.ts
// ---------------------------------------------------------------------------
export const EASE_LUXURY: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_SOFT: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

// ---------------------------------------------------------------------------
// Containers (stagger parents)
// ---------------------------------------------------------------------------

/** Default stagger wrapper — apply to the parent, put child variants on kids. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.2,
    },
  },
};

/** Faster stagger for dense lists (cards, stats rows, icon grids). */
export const staggerContainerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

/** Slower, more deliberate stagger for hero / landing sections. */
export const staggerContainerSlow: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.16,
      delayChildren: 0.25,
    },
  },
};

// ---------------------------------------------------------------------------
// Fade + rise (the most-used entrance pattern)
// ---------------------------------------------------------------------------

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: EASE_LUXURY },
  },
};

export const fadeUpLarge: Variants = {
  hidden: { opacity: 0, y: 48 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.1, ease: EASE_LUXURY },
  },
};

export const fadeUpSubtle: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_SOFT },
  },
};

// ---------------------------------------------------------------------------
// Fade only (no translation)
// ---------------------------------------------------------------------------

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.8, ease: EASE_SOFT },
  },
};

export const fadeInSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 1.4, ease: EASE_SOFT },
  },
};

// ---------------------------------------------------------------------------
// Line / text mask reveal (overflow:hidden wrapper + this on inner span)
// ---------------------------------------------------------------------------

/** Slides up from beneath a clipping parent — wrap content in overflow-hidden. */
export const lineRevealY: Variants = {
  hidden: { y: '110%' },
  visible: {
    y: '0%',
    transition: { duration: 1.1, ease: EASE_LUXURY },
  },
};

/** Slides down from above a clipping parent. */
export const lineRevealYDown: Variants = {
  hidden: { y: '-110%' },
  visible: {
    y: '0%',
    transition: { duration: 1.1, ease: EASE_LUXURY },
  },
};

// ---------------------------------------------------------------------------
// Horizontal rule / accent line
// ---------------------------------------------------------------------------

/** Scale from 0 → 1 on X axis; apply transformOrigin via className/style. */
export const scaleRevealX: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 0.9, ease: EASE_LUXURY },
  },
};

// ---------------------------------------------------------------------------
// Scale entrance
// ---------------------------------------------------------------------------

export const scaleReveal: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: EASE_LUXURY },
  },
};

/** Slight scale-down from oversized — good for images/cards. */
export const scaleRevealDown: Variants = {
  hidden: { opacity: 0, scale: 1.06 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.0, ease: EASE_LUXURY },
  },
};

// ---------------------------------------------------------------------------
// Slide in from sides
// ---------------------------------------------------------------------------

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.85, ease: EASE_LUXURY },
  },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.85, ease: EASE_LUXURY },
  },
};

// ---------------------------------------------------------------------------
// Hover / tap micro-interactions (not entrance variants — use on whileHover)
// ---------------------------------------------------------------------------

/** Subtle lift with scale — for cards, buttons. */
export const hoverLift = {
  scale: 1.03,
  y: -4,
  transition: { duration: 0.35, ease: EASE_SOFT },
} as const;

/** Gold-tinted glow pulse — for CTA buttons. */
export const hoverGlow = {
  scale: 1.025,
  transition: { duration: 0.3, ease: EASE_SOFT },
} as const;

export const tapScale = {
  scale: 0.97,
} as const;