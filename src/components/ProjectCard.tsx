import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import type { ProjectCard as ProjectCardType, ProjectStatus, ProjectCategory } from '../types/project';
import { Button } from './ui/Button';
import { ConsultationButton } from './ConsultationModal';

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

const EASE_LUXURY: [number, number, number, number] = [0.16, 1, 0.3, 1];

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: EASE_LUXURY } },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_LABEL: Record<ProjectStatus, string> = {
  upcoming:      'Upcoming',
  ongoing:       'Under Construction',
  ready_to_move: 'Ready to Move',
  completed:     'Completed',
};

const STATUS_COLOURS: Record<ProjectStatus, { dot: string; text: string; bg: string; border: string }> = {
  upcoming:      { dot: 'bg-blue-400',    text: 'text-blue-300',    bg: 'bg-blue-400/10',    border: 'border-blue-400/20'    },
  ongoing:       { dot: 'bg-amber-400',   text: 'text-amber-300',   bg: 'bg-amber-400/10',   border: 'border-amber-400/20'   },
  ready_to_move: { dot: 'bg-emerald-400', text: 'text-emerald-300', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  completed:     { dot: 'bg-[#F8F6F1]',   text: 'text-[#F8F6F1]/60', bg: 'bg-[#F8F6F1]/6',  border: 'border-[#F8F6F1]/12'  },
};

const CATEGORY_LABEL: Record<ProjectCategory, string> = {
  residential:       'Residential',
  villa:             'Villa',
  commercial:        'Commercial',
  plotted_development: 'Plotted',
  mixed_use:         'Mixed Use',
};

function formatPriceInr(paise: number): string {
  if (paise >= 10_000_000) return `₹${(paise / 10_000_000).toFixed(1)} Cr`;
  if (paise >= 100_000)    return `₹${(paise / 100_000).toFixed(0)} L`;
  return `₹${paise.toLocaleString('en-IN')}`;
}

// After — null-safe
function formatArea(sqft: number | null | undefined): string {
  if (sqft == null) return '—';
  return sqft.toLocaleString('en-IN') + ' sq ft';
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ProjectCardProps {
  project: ProjectCardType;
  index?: number;
  featured?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: ProjectStatus }) {
  const c = STATUS_COLOURS[status];
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1',
        'text-[10px] uppercase tracking-[0.18em]',
        c.bg, c.border, c.text,
      ].join(' ')}
    >
      <span className={['h-1.5 w-1.5 rounded-full', c.dot].join(' ')} />
      {STATUS_LABEL[status]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProjectCard({
  project,
  index = 0,
  featured = false,
  className = '',
}: ProjectCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const {
    slug,
    name,
    tagline,
    status,
    category,
    configs,
    areaRangeSqFt,
    priceRangeInr,
    location,
    coverImage,
  } = project;

  const priceLabel = `${formatPriceInr(priceRangeInr[0])} – ${formatPriceInr(priceRangeInr[1])}`;
  // areaLabel intentionally omitted — specs use individual range values
  const configLabel = configs.join(' · ');

  return (
    <motion.article
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-6% 0px' }}
      custom={index}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className={[
        'group relative flex flex-col overflow-hidden rounded-2xl',
        'bg-[#1C1A15] border border-[#F8F6F1]/6',
        'transition-all duration-500',
        'hover:border-[#C9A227]/20 hover:shadow-[0_32px_72px_rgba(20,19,15,0.65)]',
        featured ? 'lg:flex-row' : '',
        className,
      ].join(' ')}
    >
      {/* ── Gold accent left strip (featured only) ── */}
      {featured && (
        <motion.div
          className="absolute left-0 top-0 z-10 hidden h-full w-[3px] origin-top lg:block"
          style={{ background: 'linear-gradient(to bottom, #C9A227 0%, #C9A22700 100%)' }}
          animate={{ scaleY: hovered ? 1 : 0.45, opacity: hovered ? 1 : 0.5 }}
          transition={{ duration: 0.6, ease: EASE_LUXURY }}
        />
      )}

      {/* ── Cover image ── */}
      <div
        className={[
          'relative overflow-hidden',
          featured ? 'lg:w-[55%] lg:shrink-0' : 'aspect-[3/2]',
        ].join(' ')}
      >
        {/* Placeholder shimmer */}
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-[#F8F6F1]/5" />
        )}

        {/* Image */}
        <img
          src={coverImage}
          alt={`${name} cover`}
          onLoad={() => setImageLoaded(true)}
          className={[
            'h-full w-full object-cover transition-all duration-700',
            'group-hover:scale-[1.07]',
            hovered ? 'brightness-[1.04]' : 'brightness-100',
            imageLoaded ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
        />

        {/* Primary gradient — bottom vignette blending image into card */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1A15] via-[#1C1A15]/10 to-transparent opacity-80" />

        {/* Secondary gradient — top darkening for badge legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#14130F]/55 via-transparent to-transparent" />

        {/* Category pill — top right */}
        <div className="absolute right-4 top-4">
          <span className="inline-flex items-center rounded-full border border-[#F8F6F1]/15 bg-[#14130F]/50 px-3 py-1 text-[9.5px] uppercase tracking-[0.2em] text-[#F8F6F1]/65 backdrop-blur-sm">
            {CATEGORY_LABEL[category]}
          </span>
        </div>

        {/* Featured badge — top left */}
        {project.featured && (
          <div className="absolute left-4 top-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A227]/35 bg-[#C9A227]/15 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#C9A227]">
              Featured
            </span>
          </div>
        )}

        {/* Status badge — bottom left */}
        <div className="absolute bottom-4 left-4">
          <StatusBadge status={status} />
        </div>

        {/* Hover reveal — full-image gold tint wash */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          style={{ background: 'linear-gradient(135deg, rgba(201,162,39,0.07) 0%, transparent 60%)' }}
        />
      </div>

      {/* ── Content ── */}
      <div className={[
        'flex flex-1 flex-col p-6 sm:p-7',
        featured ? 'lg:justify-center lg:p-10' : '',
      ].join(' ')}>

        {/* Gold hairline reveal — slides in on hover */}
        <motion.div
          className="mb-5 h-px w-full origin-left bg-gradient-to-r from-[#C9A227]/60 to-transparent"
          animate={{ scaleX: hovered ? 1 : 0, opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.55, ease: EASE_LUXURY }}
        />

        {/* Location */}
        <p className="text-[10.5px] uppercase tracking-[0.26em] text-[#F8F6F1]/35">
          {location.city}, {location.state}
        </p>

        {/* Name */}
        <h3
          className={[
            'mt-2 font-serif leading-[1.15] text-[#F8F6F1] transition-colors duration-300',
            featured ? 'text-[2rem] sm:text-[2.4rem]' : 'text-[1.45rem] sm:text-[1.6rem]',
          ].join(' ')}
        >
          {name}
        </h3>

        {/* Tagline */}
        <p className="mt-2 text-[13px] font-light leading-relaxed text-[#F8F6F1]/45">
          {tagline}
        </p>

        {/* Specs — horizontal editorial strip */}
        <div className="mt-6 flex flex-wrap items-start gap-x-0 divide-x divide-[#F8F6F1]/10">
          <SpecColumn label="Price" value={priceLabel} />
          {areaRangeSqFt[0] != null && (
  <SpecColumn label="Area" value={`${formatArea(areaRangeSqFt[0])}+`} />
)}
          <SpecColumn label="Configs" value={configLabel} />
        </div>

        {/* CTA */}
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Button
            as="link"
            to={`/projects/${slug}`}
            variant="ghost"
            size="sm"
            withArrow
            className="border-[#F8F6F1]/15 text-[#F8F6F1] hover:border-[#F8F6F1] hover:bg-[#F8F6F1] hover:text-[#1B1B1B]"
          >
            View Project
          </Button>
          <ConsultationButton
            variant="secondary"
            size="sm"
            className="border-[#C9A227]/35 text-[#C9A227] hover:border-[#C9A227] hover:bg-[#C9A227]/10"
          >
            Enquire
          </ConsultationButton>
        </div>
      </div>

      {/* Hover glow border */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        style={{ boxShadow: 'inset 0 0 0 1px rgba(201,162,39,0.22)' }}
      />
    </motion.article>
  );
}

// ---------------------------------------------------------------------------
// SpecColumn — horizontal divider-style spec item
// ---------------------------------------------------------------------------

function SpecColumn({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 px-4 first:pl-0 last:pr-0">
      <span className="text-[9.5px] uppercase tracking-[0.18em] text-[#F8F6F1]/28">
        {label}
      </span>
      <span className="text-[12px] font-light text-[#F8F6F1]/75">
        {value}
      </span>
    </div>
  );
}

export default ProjectCard;