import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import type { Variants } from 'framer-motion';

// Inlined from src/animations/variants.ts — update to import once that file is in place.
const EASE_LUXURY: [number, number, number, number] = [0.16, 1, 0.3, 1];
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_LUXURY } },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnimatedCounterProps {
  /**
   * Target number to count up to.
   */
  value: number;
  /**
   * String appended after the number — e.g. "+" or "%".
   */
  suffix?: string;
  /**
   * String prepended before the number — e.g. "₹" or "$".
   */
  prefix?: string;
  /**
   * Label displayed below the number.
   */
  label: string;
  /**
   * Count animation duration in milliseconds. Default: 1800.
   */
  duration?: number;
  /**
   * Easing function for the count. Default: easeOutQuart.
   */
  easing?: (t: number) => number;
  /**
   * Decimal places to display. Default: 0.
   */
  decimals?: number;
  /**
   * Trigger animation only once. Default: true.
   */
  once?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Easing
// ---------------------------------------------------------------------------

const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

// ---------------------------------------------------------------------------
// Hook: useCountUp
// ---------------------------------------------------------------------------

function useCountUp(
  target: number,
  duration: number,
  easing: (t: number) => number,
  decimals: number,
  active: boolean,
): string {
  const [display, setDisplay] = useState('0');
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;

    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);
      const current = easedProgress * target;

      setDisplay(
        decimals > 0
          ? current.toFixed(decimals)
          : Math.round(current).toString(),
      );

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [active, target, duration, easing, decimals]);

  return display;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
  label,
  duration = 1800,
  easing = easeOutQuart,
  decimals = 0,
  once = true,
  className = '',
}: AnimatedCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: '-5% 0px' });

  const count = useCountUp(value, duration, easing, decimals, inView);

  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={['flex flex-col items-center gap-1', className].join(' ')}
    >
      {/* Number row — mirrors HeroSection's Stat component */}
      <div className="flex items-baseline gap-0.5">
        {prefix && (
          <span className="font-serif text-lg text-[#C9A227] sm:text-xl">
            {prefix}
          </span>
        )}
        <span className="font-serif text-[2rem] leading-none text-[#C9A227] sm:text-[2.4rem]">
          {count}
        </span>
        {suffix && (
          <span className="font-serif text-xl text-[#C9A227] sm:text-2xl">
            {suffix}
          </span>
        )}
      </div>

      {/* Label */}
      <span className="text-[10.5px] uppercase tracking-[0.12em] text-[#1B1B1B]/55 sm:text-xs">
        {label}
      </span>
    </motion.div>
  );
}

export default AnimatedCounter;