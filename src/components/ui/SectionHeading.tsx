import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import type { Variants } from 'framer-motion';

// Inlined from src/animations/variants.ts — update to import once that file is in place.
const EASE_LUXURY: [number, number, number, number] = [0.16, 1, 0.3, 1];

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14, delayChildren: 0.2 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_LUXURY } },
};
const lineRevealY: Variants = {
  hidden: { y: '110%' },
  visible: { y: '0%', transition: { duration: 1.1, ease: EASE_LUXURY } },
};
const scaleRevealX: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: { scaleX: 1, opacity: 1, transition: { duration: 0.9, ease: EASE_LUXURY } },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type HeadingAlign = 'left' | 'center' | 'right';
type HeadingLevel = 'h1' | 'h2' | 'h3';

interface SectionHeadingProps {
  theme?: 'light' | 'dark';
  /** Small all-caps label above the headline — e.g. "Our Projects". */
  eyebrow?: string;
  /** Main headline text. Wrap parts in <em> to render in gold. */
  heading: string;
  /** Optional sub-copy below the headline. */
  body?: string;
  align?: HeadingAlign;
  /** Semantic heading element. Default: 'h2'. */
  as?: HeadingLevel;
  /**
   * Words in the heading to render in gold (#C9A227).
   * Matched by exact word — e.g. goldWords={['Landmarks', 'Today']}.
   */
  goldWords?: string[];
  /** Show the decorative architectural rule above the eyebrow. Default: true. */
  showRule?: boolean;
  /** Trigger animation only once (default true). */
  once?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ALIGN_CLASSES: Record<HeadingAlign, string> = {
  left:   'items-start text-left',
  center: 'items-center text-center',
  right:  'items-end text-right',
};

/**
 * Splits a heading string into spans, rendering goldWords in #C9A227.
 * Preserves surrounding punctuation — splits only on whitespace.
 */
function HeadingText({
  text,
  goldWords = [],
}: {
  text: string;
  goldWords: string[];
}) {
  const words = text.split(' ');
  return (
    <>
      {words.map((word, i) => {
        const clean = word.replace(/[^a-zA-Z0-9]/g, '');
        const isGold = goldWords.some(
          (g) => g.toLowerCase() === clean.toLowerCase(),
        );
        return (
          <span key={i} className={isGold ? 'text-[#C9A227]' : undefined}>
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SectionHeading({
  eyebrow,
  heading,
  body,
  align = 'center',
  as: Tag = 'h2',
  goldWords = [],
  showRule = true,
  once = true,
  theme = 'light',
  className = '',
}: SectionHeadingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: '-10% 0px' });

  return (
    <motion.div
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={[
        'flex flex-col gap-4',
        ALIGN_CLASSES[align],
        className,
      ].join(' ')}
    >
      {/* Architectural rule — thin gold measurement line */}
      {showRule && (
        <motion.div
          variants={scaleRevealX}
          className="flex w-16 items-center origin-left"
          style={{ originX: align === 'right' ? 1 : align === 'center' ? 0.5 : 0 }}
        >
          <span className="h-2 w-px bg-[#C9A227]/80" />
          <span className="h-px flex-1 bg-[#C9A227]/80" />
          <span className="h-2 w-px bg-[#C9A227]/80" />
        </motion.div>
      )}

      {/* Eyebrow */}
      {eyebrow && (
        <motion.span
          variants={fadeUp}
          className={`text-[11px] uppercase tracking-[0.38em] ${
  theme === 'dark'
    ? 'text-[#F8F6F1]/50'
    : 'text-[#1B1B1B]/50'
}`}
        >
          {eyebrow}
        </motion.span>
      )}

      {/* Headline — line-mask reveal */}
      <div className="overflow-hidden">
        <motion.div variants={lineRevealY}>
          <Tag
            className={[
  `font-serif leading-[1.1] ${
    theme === 'dark'
      ? 'text-[#F8F6F1]'
      : 'text-[#1B1B1B]'
  }`,
              'text-[2rem] sm:text-[2.6rem] md:text-[3.2rem] lg:text-[3.75rem]',
              'lg:leading-[1.08]',
            ].join(' ')}
          >
            <HeadingText text={heading} goldWords={goldWords} />
          </Tag>
        </motion.div>
      </div>

      {/* Body copy */}
      {body && (
        <motion.p
          variants={fadeUp}
          className={[
            `max-w-xl text-[15px] font-light leading-relaxed ${
  theme === 'dark'
    ? 'text-[#F8F6F1]/50'
    : 'text-[#1B1B1B]/50'
}`,
            'sm:text-base',
            align === 'center' ? 'mx-auto' : '',
          ].join(' ')}
        >
          {body}
        </motion.p>
      )}
    </motion.div>
  );
}

export default SectionHeading;