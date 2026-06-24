import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import type { Amenity } from '../../../types/project';

// ---------------------------------------------------------------------------
// Animation constants
// ---------------------------------------------------------------------------

const EASE_LUXURY: [number, number, number, number] = [0.16, 1, 0.3, 1];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_LUXURY } },
};

// ---------------------------------------------------------------------------
// Category presentation
// ---------------------------------------------------------------------------

const CATEGORY_LABEL: Record<Amenity['category'], string> = {
  wellness: 'Wellness',
  recreation: 'Recreation',
  convenience: 'Convenience',
  security: 'Security',
  green: 'Sustainability',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AmenitiesSectionProps {
  amenities: Amenity[];
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AmenitiesSection({ amenities, className = '' }: AmenitiesSectionProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | Amenity['category']>('all');

  const categories = Array.from(new Set(amenities.map((amenity) => amenity.category)));
  const filteredAmenities =
    activeCategory === 'all'
      ? amenities
      : amenities.filter((amenity) => amenity.category === activeCategory);

  return (
    <section
      id="amenities"
      className={['relative border-t border-[#F8F6F1]/6 py-20 sm:py-28', className].join(' ')}
    >
      {/* Ambient gold wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-10 h-[420px] w-[420px] rounded-full opacity-[0.035]"
        style={{ background: 'radial-gradient(circle, #C9A227 0%, transparent 70%)' }}
      />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        {/* ── Heading ── */}
        <div className="flex flex-col gap-4">
          <div className="flex w-16 items-center">
            <span className="h-2 w-px bg-[#C9A227]/80" />
            <span className="h-px flex-1 bg-[#C9A227]/80" />
            <span className="h-2 w-px bg-[#C9A227]/80" />
          </div>
          <span className="text-[10.5px] uppercase tracking-[0.34em] text-[#C9A227]/75">
            Lifestyle &amp; Comfort
          </span>
          <h2 className="font-serif text-[2rem] leading-[1.15] text-[#F8F6F1] sm:text-[2.6rem]">
            World-Class <span className="italic text-[#F8F6F1]/55">Amenities</span>
          </h2>
          <p className="max-w-xl text-[14px] font-light leading-relaxed text-[#F8F6F1]/40">
            Every residence is supported by a curated ecosystem of amenities — designed for
            wellness, recreation, security, and effortless everyday living.
          </p>
        </div>

        {/* ── Category filters ── */}
        {categories.length > 1 && (
          <div className="mt-8 flex flex-wrap gap-2">
            <FilterPill
              label="All"
              active={activeCategory === 'all'}
              onClick={() => setActiveCategory('all')}
            />
            {categories.map((category) => (
              <FilterPill
                key={category}
                label={CATEGORY_LABEL[category]}
                active={activeCategory === category}
                onClick={() => setActiveCategory(category)}
              />
            ))}
          </div>
        )}

        {/* ── Grid ── */}
        {filteredAmenities.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-8%' }}
            className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4"
          >
            {filteredAmenities.map((amenity) => (
              <motion.div
                key={amenity.id}
                variants={cardVariants}
                className="group relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl border border-[#F8F6F1]/6 bg-[#1C1A15] p-6 transition-colors duration-500 hover:border-[#C9A227]/30 hover:bg-[#1F1D17]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#C9A227]/30 text-[#C9A227] transition-all duration-500 group-hover:border-[#C9A227]/60 group-hover:bg-[#C9A227]/10">
                  <AmenityIcon icon={amenity.icon} />
                </span>

                <div className="flex flex-col gap-1">
                  <span className="text-[13.5px] font-light leading-snug text-[#F8F6F1]/85">
                    {amenity.label}
                  </span>
                  <span className="text-[9.5px] uppercase tracking-[0.18em] text-[#F8F6F1]/25">
                    {CATEGORY_LABEL[amenity.category]}
                  </span>
                </div>

                {/* Hover glow border */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ boxShadow: 'inset 0 0 0 1px rgba(201,162,39,0.22)' }}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="mt-10 flex flex-col items-center justify-center gap-4 rounded-2xl border border-[#F8F6F1]/6 bg-[#1C1A15]/40 py-16 text-center">
            <p className="font-serif text-xl text-[#F8F6F1]/45">No amenities in this category</p>
            <p className="text-[12.5px] font-light text-[#F8F6F1]/25">
              Try selecting a different filter to view more amenities.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// FilterPill
// ---------------------------------------------------------------------------

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full border px-4 py-1.5 text-[10.5px] uppercase tracking-[0.18em]',
        'transition-all duration-300',
        active
          ? 'border-[#C9A227]/60 bg-[#C9A227]/12 text-[#C9A227]'
          : 'border-[#F8F6F1]/10 bg-transparent text-[#F8F6F1]/40 hover:border-[#F8F6F1]/25 hover:text-[#F8F6F1]/65',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// AmenityIcon — bespoke thin-line icon set (no external icon dependency),
// keyed off the `icon` string already present on each Amenity in mockProjects.
// ---------------------------------------------------------------------------

const ICON_PROPS = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.3,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true as const,
};

function AmenityIcon({ icon }: { icon: string }) {
  switch (icon) {
    case 'waves':
      return (
        <svg {...ICON_PROPS}>
          <path d="M2 8c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" />
          <path d="M2 14c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" />
          <path d="M2 20c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" />
        </svg>
      );
    case 'building-2':
      return (
        <svg {...ICON_PROPS}>
          <rect x="4" y="3" width="11" height="18" />
          <rect x="15" y="9" width="6" height="12" />
          <path d="M7 7h2M7 11h2M7 15h2M17 13h2M17 17h2" />
        </svg>
      );
    case 'dumbbell':
      return (
        <svg {...ICON_PROPS}>
          <path d="M5 9v6M3 8v8M19 9v6M21 8v8M5 12h14" />
        </svg>
      );
    case 'sparkles':
      return (
        <svg {...ICON_PROPS}>
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
          <path d="M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" />
        </svg>
      );
    case 'circle-dot':
      return (
        <svg {...ICON_PROPS}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'circle':
      return (
        <svg {...ICON_PROPS}>
          <circle cx="12" cy="12" r="8" />
          <path d="M5 8c3 2 11 2 14 0M5 16c3-2 11-2 14 0" />
        </svg>
      );
    case 'ferris-wheel':
      return (
        <svg {...ICON_PROPS}>
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
          <path d="M12 5v14M5 12h14M7.4 7.4l9.2 9.2M16.6 7.4L7.4 16.6" />
        </svg>
      );
    case 'footprints':
      return (
        <svg {...ICON_PROPS}>
          <ellipse cx="8.5" cy="8" rx="2.2" ry="3.2" />
          <ellipse cx="15.5" cy="15" rx="2.2" ry="3.2" />
        </svg>
      );
    case 'tree-pine':
      return (
        <svg {...ICON_PROPS}>
          <path d="M12 3l3.5 5.5h-2L17 14h-2.5L17.5 19h-11L9 14H6.5l3.5-5.5h-2z" />
          <path d="M12 19v3" />
        </svg>
      );
    case 'bell-ring':
      return (
        <svg {...ICON_PROPS}>
          <path d="M6 9a6 6 0 1112 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9z" />
          <path d="M10 18a2 2 0 004 0" />
          <path d="M3 6l1.5 1.5M21 6l-1.5 1.5" />
        </svg>
      );
    case 'cctv':
      return (
        <svg {...ICON_PROPS}>
          <path d="M3 7l8-3 8 3" />
          <rect x="9" y="7" width="10" height="5" />
          <path d="M19 9.5h2M9 9.5H5M11 12l-4 8M16 12l1 8" />
        </svg>
      );
    case 'video':
      return (
        <svg {...ICON_PROPS}>
          <rect x="3" y="6" width="13" height="12" />
          <path d="M16 10l5-3v10l-5-3" />
        </svg>
      );
    case 'zap':
      return (
        <svg {...ICON_PROPS}>
          <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
        </svg>
      );
    case 'droplets':
      return (
        <svg {...ICON_PROPS}>
          <path d="M12 3s6 6.5 6 11a6 6 0 11-12 0c0-4.5 6-11 6-11z" />
        </svg>
      );
    case 'sun':
      return (
        <svg {...ICON_PROPS}>
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          <path d="M4.6 4.6l2 2M17.4 17.4l2 2M19.4 4.6l-2 2M6.6 17.4l-2 2" />
        </svg>
      );
    case 'tv-2':
      return (
        <svg {...ICON_PROPS}>
          <rect x="3" y="6" width="18" height="12" />
          <path d="M8 21h8M9 3l3 3 3-3" />
        </svg>
      );
    case 'laptop':
      return (
        <svg {...ICON_PROPS}>
          <rect x="4" y="5" width="16" height="10" />
          <path d="M2 19h20M9 19v-2.2M15 19v-2.2" />
        </svg>
      );
    case 'brain':
      return (
        <svg {...ICON_PROPS}>
          <path d="M12 4c-3 0-5 2-5 4.5 0 1 .4 1.8 1 2.5-1 .6-1.5 1.6-1.5 2.8 0 2.2 2 4 4.5 4h2c2.5 0 4.5-1.8 4.5-4 0-1.2-.5-2.2-1.5-2.8.6-.7 1-1.5 1-2.5C17 6 15 4 12 4z" />
          <path d="M12 4v13" />
        </svg>
      );
    default:
      return (
        <svg {...ICON_PROPS}>
          <path d="M12 3l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" />
        </svg>
      );
  }
}

export default AmenitiesSection;