import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

const EASE_LUXURY: [number, number, number, number] = [0.16, 1, 0.3, 1];

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_LUXURY } },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Testimonial {
  id: string;
  quote: string;
  authorName: string;
  authorTitle: string;
  /** Optional — e.g. "Aurelia Skyline, 4BHK Pinnacle" */
  projectReference?: string;
  avatarUrl?: string;
  /** 1–5 */
  rating?: number;
}

interface TestimonialCardProps {
  testimonial: Testimonial;
  /** Controls light (on cream bg) vs dark (on charcoal/section) surface */
  surface?: 'light' | 'dark';
  index?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// Star rating
// ---------------------------------------------------------------------------

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="13"
          height="13"
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill={i < rating ? '#C9A227' : 'none'}
          stroke={i < rating ? '#C9A227' : 'currentColor'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={i >= rating ? 'text-[#F8F6F1]/20' : ''}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quote mark SVG — large decorative opener
// ---------------------------------------------------------------------------

function QuoteMark({ className = '' }: { className?: string }) {
  return (
    <svg
      width="36"
      height="28"
      viewBox="0 0 36 28"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M0 28V17.5C0 12.833 1.167 9.083 3.5 6.25C5.833 3.333 9.333 1.333 14 0.25L15.5 3C12.167 3.833 9.75 5.333 8.25 7.5C6.75 9.583 6 12.167 6 15.25H12V28H0ZM20 28V17.5C20 12.833 21.167 9.083 23.5 6.25C25.833 3.333 29.333 1.333 34 0.25L35.5 3C32.167 3.833 29.75 5.333 28.25 7.5C26.75 9.583 26 12.167 26 15.25H32V28H20Z"
        fill="currentColor"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Avatar fallback — initials circle
// ---------------------------------------------------------------------------

function Avatar({ name, src }: { name: string; src?: string }) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  if (src && !imgFailed) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImgFailed(true)}
        className="h-11 w-11 rounded-full object-cover ring-1 ring-[#C9A227]/30"
      />
    );
  }

  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#C9A227]/15 ring-1 ring-[#C9A227]/30"
      aria-hidden="true"
    >
      <span className="font-serif text-sm text-[#C9A227]">{initials}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TestimonialCard({
  testimonial,
  surface = 'dark',
  index = 0,
  className = '',
}: TestimonialCardProps) {
  const { quote, authorName, authorTitle, projectReference, avatarUrl, rating } =
    testimonial;

  const isDark = surface === 'dark';

  const cardBg     = isDark ? 'bg-[#1C1A15] border-[#F8F6F1]/6'      : 'bg-[#F8F6F1] border-[#1B1B1B]/8';
  const quoteColor = isDark ? 'text-[#C9A227]/18'                     : 'text-[#C9A227]/12';
  const bodyColor  = isDark ? 'text-[#F8F6F1]/65'                     : 'text-[#1B1B1B]/65';
  const nameColor  = isDark ? 'text-[#F8F6F1]'                        : 'text-[#1B1B1B]';
  const metaColor  = isDark ? 'text-[#F8F6F1]/38'                     : 'text-[#1B1B1B]/40';
  const refColor   = isDark ? 'text-[#C9A227]/70'                     : 'text-[#C9A227]';
  const divider    = isDark ? 'bg-[#F8F6F1]/8'                        : 'bg-[#1B1B1B]/8';

  return (
    <motion.article
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-6% 0px' }}
      custom={index}
      className={[
        'relative flex flex-col gap-6 overflow-hidden rounded-2xl border p-7 sm:p-8',
        cardBg,
        className,
      ].join(' ')}
    >
      {/* Decorative quote mark — top-left, large & faint */}
      <QuoteMark className={['absolute -left-1 -top-1 h-12 w-16', quoteColor].join(' ')} />

      {/* Rating */}
      {rating !== undefined && (
        <div className="relative">
          <StarRating rating={rating} />
        </div>
      )}

      {/* Quote body */}
      <blockquote className={['relative text-[14.5px] font-light leading-relaxed', bodyColor].join(' ')}>
        "{quote}"
      </blockquote>

      {/* Divider */}
      <div className={['h-px w-full', divider].join(' ')} />

      {/* Author row */}
      <div className="flex items-center gap-3.5">
        <Avatar name={authorName} src={avatarUrl} />

        <div className="flex min-w-0 flex-col gap-0.5">
          <span className={['text-[13.5px] font-medium', nameColor].join(' ')}>
            {authorName}
          </span>
          <span className={['text-[11.5px] font-light', metaColor].join(' ')}>
            {authorTitle}
          </span>
          {projectReference && (
            <span className={['mt-0.5 text-[10.5px] uppercase tracking-[0.14em]', refColor].join(' ')}>
              {projectReference}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export default TestimonialCard;