// ---------------------------------------------------------------------------
// Lenis smooth-scroll singleton
// ---------------------------------------------------------------------------
// Usage:
//   import { initLenis, getLenis, destroyLenis } from '@/lib/lenis';
//
//   In App.tsx's useEffect:
//     const lenis = initLenis();
//     return () => destroyLenis();
//
// When GSAP ScrollTrigger is active the caller must also wire up:
//   lenis.on('scroll', ScrollTrigger.update);
//   gsap.ticker.add((time) => lenis.raf(time * 1000));
//   gsap.ticker.lagSmoothing(0);
// ---------------------------------------------------------------------------

import Lenis from 'lenis';

let instance: Lenis | null = null;

export interface LenisConfig {
  /** Scroll duration multiplier (seconds). Default: 1.2 */
  duration?: number;
  /** Custom easing curve. Default: quartic ease-out. */
  easing?: (t: number) => number;
  /** Enable smooth mouse-wheel scrolling. Default: true */
  smoothWheel?: boolean;
  /** Invert scroll direction. Default: false */
  infinite?: boolean;
}

const DEFAULT_EASING = (t: number): number => 1 - Math.pow(1 - t, 4);

/**
 * Create (or return the existing) Lenis instance.
 * Call once at the application root; subsequent calls return the same instance.
 */
export function initLenis(config: LenisConfig = {}): Lenis {
  if (instance) return instance;

  instance = new Lenis({
    duration: config.duration ?? 1.2,
    easing: config.easing ?? DEFAULT_EASING,
    smoothWheel: config.smoothWheel ?? true,
    infinite: config.infinite ?? false,
  });

  return instance;
}

/**
 * Return the active Lenis instance, or null if not yet initialised.
 */
export function getLenis(): Lenis | null {
  return instance;
}

/**
 * Destroy the Lenis instance and clear the singleton reference.
 * Call in the cleanup function of the useEffect that called initLenis.
 */
export function destroyLenis(): void {
  if (instance) {
    instance.destroy();
    instance = null;
  }
}

/**
 * Programmatically scroll to an element or offset.
 * Safe to call even before Lenis is initialised (no-op in that case).
 */
export function scrollTo(
  target: HTMLElement | string | number,
  options?: Parameters<Lenis['scrollTo']>[1],
): void {
  instance?.scrollTo(target as Parameters<Lenis['scrollTo']>[0], options);
}