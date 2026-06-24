import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import type { Variants } from 'framer-motion';

// Inlined from src/animations/variants.ts — update to import once that file is in place.
const EASE_LUXURY: [number, number, number, number] = [0.16, 1, 0.3, 1];
const scaleRevealX: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: { scaleX: 1, opacity: 1, transition: { duration: 0.9, ease: EASE_LUXURY } },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RuleVariant = 'gold' | 'cream' | 'charcoal' | 'muted';
type RuleSize    = 'sm' | 'md' | 'lg' | 'full';
type RuleAlign   = 'left' | 'center' | 'right';

interface RuleDividerProps {
  variant?: RuleVariant;
  size?: RuleSize;
  align?: RuleAlign;
  /** Show the bracket tick-marks at each end. Default: true. */
  withTicks?: boolean;
  /** Animate in when entering the viewport. Default: true. */
  animated?: boolean;
  /** Animate only once. Default: true. */
  once?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Style maps
// ---------------------------------------------------------------------------

// Line colour
const VARIANT_LINE: Record<RuleVariant, string> = {
  gold:     'bg-[#C9A227]/80',
  cream:    'bg-[#F8F6F1]/80',
  charcoal: 'bg-[#1B1B1B]/30',
  muted:    'bg-[#1B1B1B]/12',
};

// Tick colour (end cap marks)
const VARIANT_TICK: Record<RuleVariant, string> = {
  gold:     'bg-[#C9A227]/80',
  cream:    'bg-[#F8F6F1]/80',
  charcoal: 'bg-[#1B1B1B]/30',
  muted:    'bg-[#1B1B1B]/12',
};

// Width of the rule
const SIZE_CLASSES: Record<RuleSize, string> = {
  sm:   'w-12',
  md:   'w-20',   // matches hero decorative rule
  lg:   'w-32',
  full: 'w-full',
};

const ALIGN_WRAPPER: Record<RuleAlign, string> = {
  left:   'justify-start',
  center: 'justify-center',
  right:  'justify-end',
};

const ORIGIN: Record<RuleAlign, React.CSSProperties['transformOrigin']> = {
  left:   'left center',
  center: 'center center',
  right:  'right center',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RuleDivider({
  variant = 'gold',
  size = 'md',
  align = 'center',
  withTicks = true,
  animated = true,
  once = true,
  className = '',
}: RuleDividerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: '-5% 0px' });

  const rule = (
    <div className={['flex items-center', SIZE_CLASSES[size]].join(' ')}>
      {withTicks && (
        <span className={['h-2 w-px shrink-0', VARIANT_TICK[variant]].join(' ')} />
      )}
      <span className={['h-px flex-1', VARIANT_LINE[variant]].join(' ')} />
      {withTicks && (
        <span className={['h-2 w-px shrink-0', VARIANT_TICK[variant]].join(' ')} />
      )}
    </div>
  );

  return (
    <div
      ref={ref}
      className={['flex', ALIGN_WRAPPER[align], className].join(' ')}
    >
      {animated ? (
        <motion.div
          variants={scaleRevealX}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          style={{ transformOrigin: ORIGIN[align] }}
          className={['flex items-center', SIZE_CLASSES[size]].join(' ')}
        >
          {withTicks && (
            <span className={['h-2 w-px shrink-0', VARIANT_TICK[variant]].join(' ')} />
          )}
          <span className={['h-px flex-1', VARIANT_LINE[variant]].join(' ')} />
          {withTicks && (
            <span className={['h-2 w-px shrink-0', VARIANT_TICK[variant]].join(' ')} />
          )}
        </motion.div>
      ) : (
        rule
      )}
    </div>
  );
}

export default RuleDivider;