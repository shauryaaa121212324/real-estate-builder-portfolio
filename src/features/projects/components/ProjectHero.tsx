import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import type { Project, ProjectStatus } from '../../../types/project';
import { Button } from '../../../components/ui/Button';

const EASE_LUXURY: [number, number, number, number] = [0.16, 1, 0.3, 1];

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.14, delayChildren: 0.3 },
  },
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_LUXURY } },
};

const lineRevealVariants: Variants = {
  hidden: { y: '110%' },
  visible: { y: '0%', transition: { duration: 1.1, ease: EASE_LUXURY } },
};

const ruleVariants: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: { scaleX: 1, opacity: 1, transition: { duration: 0.9, ease: EASE_LUXURY } },
};

const STATUS_LABEL: Record<ProjectStatus, string> = {
  upcoming: 'Upcoming',
  ongoing: 'Under Construction',
  ready_to_move: 'Ready to Move',
  completed: 'Completed',
};

const STATUS_DOT: Record<ProjectStatus, string> = {
  upcoming: 'bg-blue-400',
  ongoing: 'bg-amber-400',
  ready_to_move: 'bg-emerald-400',
  completed: 'bg-[#F8F6F1]',
};

function formatPriceInr(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(1)} Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(0)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

// FIX: null-safe — both values may be null when area was left blank on project creation
function formatAreaRange(min: number | null, max: number | null): string | null {
  if (min == null || max == null) return null;
  return `${min.toLocaleString('en-IN')} – ${max.toLocaleString('en-IN')} sq.ft`;
}

interface ProjectHeroProps {
  project: Project;
  className?: string;
}

export function ProjectHero({ project, className = '' }: ProjectHeroProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const priceLabel = `${formatPriceInr(project.priceRangeInr[0])} – ${formatPriceInr(project.priceRangeInr[1])}`;
  // FIX: returns null when area is not set, rendered conditionally below
  const areaLabel = formatAreaRange(project.areaRangeSqFt[0], project.areaRangeSqFt[1]);
  const configLabel = project.configs.join(' · ');

  const brochureHref = project.brochureUrl ?? '#enquire';
  const brochureLabel = project.brochureUrl ? 'Download Brochure' : 'Enquire Now';

  return (
    <section
      className={[
        'relative h-screen min-h-[680px] w-full overflow-hidden bg-[#14130F]',
        className,
      ].join(' ')}
    >
      {/* Background image */}
      <div aria-hidden="true" className="absolute inset-0 z-0 h-full w-full">
        {!imageLoaded && <div className="absolute inset-0 animate-pulse bg-[#1C1A15]" />}
        <img
          src={project.coverImage}
          alt=""
          onLoad={() => setImageLoaded(true)}
          className={[
            'h-full w-full object-cover transition-opacity duration-1000',
            imageLoaded ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
        />
      </div>

      {/* Cinematic overlays */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[#14130F]/80 via-[#14130F]/35 to-[#14130F]/55" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[#14130F]/95 via-[#14130F]/10 to-transparent" />

      {/* Breadcrumb / back link */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.7, ease: EASE_LUXURY }}
        className="absolute left-6 top-24 z-10 sm:left-10 sm:top-28 lg:left-16"
      >
        <a
          href="#projects"
          className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#F8F6F1]/55 transition-colors duration-300 hover:text-[#F8F6F1]"
        />
      </motion.div>

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex h-full w-full flex-col items-start justify-end px-6 pb-16 sm:px-10 sm:pb-20 lg:px-16"
      >
        <div className="mx-auto w-full max-w-7xl">
          {/* Location + status */}
          <motion.div variants={fadeUpVariants} className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-[11px] uppercase tracking-[0.34em] text-[#C9A227]/85">
              {project.location.city}, {project.location.state}
            </span>
            <span aria-hidden="true" className="hidden h-3 w-px bg-[#F8F6F1]/20 sm:block" />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F8F6F1]/20 bg-[#14130F]/30 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#F8F6F1]/80 backdrop-blur-sm">
              <span className={['h-1.5 w-1.5 rounded-full', STATUS_DOT[project.status]].join(' ')} />
              {STATUS_LABEL[project.status]}
            </span>
            {project.featured && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A227]/40 bg-[#C9A227]/15 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#C9A227]">
                Featured
              </span>
            )}
          </motion.div>

          {/* Architectural rule */}
          <motion.div variants={ruleVariants} className="mt-5 flex w-20 origin-left items-center">
            <span className="h-2 w-px bg-[#C9A227]/80" />
            <span className="h-px flex-1 bg-[#C9A227]/80" />
          </motion.div>

          {/* Project name */}
          <h1 className="mt-6 max-w-4xl font-serif text-[2.8rem] leading-[1.05] text-[#F8F6F1] sm:text-6xl md:text-7xl lg:text-[5rem] lg:leading-[1.04]">
            <span className="block overflow-hidden">
              <motion.span variants={lineRevealVariants} className="block">
                {project.name}
              </motion.span>
            </span>
          </h1>

          {/* Tagline */}
          <motion.p
            variants={fadeUpVariants}
            className="mt-5 max-w-xl text-[15px] font-light leading-relaxed text-[#F8F6F1]/70 sm:text-base"
          >
            {project.tagline}
          </motion.p>

          {/* Stats row — area stat only rendered when not null */}
          <motion.div
            variants={fadeUpVariants}
            className="mt-9 flex flex-wrap items-center gap-x-9 gap-y-5 sm:gap-x-12"
          >
            <StatBlock label="Price Range" value={priceLabel} />
            <Divider />
            <StatBlock label="Configurations" value={configLabel} />
            {areaLabel && (
              <>
                <Divider />
                <StatBlock label="Area" value={areaLabel} />
              </>
            )}
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            variants={fadeUpVariants}
            className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-5"
          >
            <Button
              as="a"
              href={brochureHref}
              target={project.brochureUrl ? '_blank' : undefined}
              rel={project.brochureUrl ? 'noopener noreferrer' : undefined}
              variant="secondary"
              size="lg"
            >
              {brochureLabel}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute right-6 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-3 sm:right-10 lg:right-16 lg:flex"
      >
        <div className="relative h-11 w-px overflow-hidden bg-[#F8F6F1]/20">
          <motion.span
            className="absolute left-0 top-0 h-1/3 w-px bg-[#C9A227]"
            animate={{ y: ['-100%', '300%'] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </section>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-[0.2em] text-[#F8F6F1]/40">{label}</span>
      <span className="font-serif text-lg text-[#F8F6F1] sm:text-xl">{value}</span>
    </div>
  );
}

function Divider() {
  return <span aria-hidden="true" className="hidden h-8 w-px bg-[#F8F6F1]/15 sm:block" />;
}

export default ProjectHero;