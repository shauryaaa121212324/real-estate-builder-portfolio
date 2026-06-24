import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import type { Project } from '../../../types/project';
import { ProjectCard } from '../../../components/ProjectCard';
import { useConsultation } from '../../../components/ConsultationModal';

// ---------------------------------------------------------------------------
// Animation constants
// ---------------------------------------------------------------------------

const EASE_LUXURY: [number, number, number, number] = [0.16, 1, 0.3, 1];

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: EASE_LUXURY },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.3, ease: [0.4, 0, 1, 1] },
  },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RelatedProjectsProps {
  /** Current project for context */
  currentProject: Project;
  /** All available projects */
  allProjects: Project[];
  /** Maximum number of related projects to display */
  maxResults?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Score projects based on similarity to current project.
 * Higher score = more relevant.
 *
 * Defensive: Supabase-sourced projects may be missing fields that the
 * original mock data always provided (amenities, configs, location,
 * location.city, priceRangeInr). Every access below falls back to a
 * safe default instead of throwing.
 */
function scoreProject(current: Project, other: Project): number {
  if (current.id === other.id) return -Infinity; // Exclude self

  let score = 0;

  // Prefer same category
  if (current.category === other.category) score += 30;

  // Prefer similar price range (overlap)
  // priceRangeInr may be undefined/null, or a tuple with missing entries.
  const currentPriceRange = Array.isArray(current.priceRangeInr) ? current.priceRangeInr : [];
  const otherPriceRange = Array.isArray(other.priceRangeInr) ? other.priceRangeInr : [];
  const currentMin = currentPriceRange[0];
  const currentMax = currentPriceRange[1];
  const otherMin = otherPriceRange[0];
  const otherMax = otherPriceRange[1];

  if (
    typeof currentMin === 'number' &&
    typeof currentMax === 'number' &&
    typeof otherMin === 'number' &&
    typeof otherMax === 'number'
  ) {
    const priceOverlap = Math.min(currentMax, otherMax) - Math.max(currentMin, otherMin);
    if (priceOverlap > 0) score += 20;
  }

  // Prefer same city
  const currentCity = current.location?.city ?? null;
  const otherCity = other.location?.city ?? null;
  if (currentCity && otherCity && currentCity === otherCity) score += 25;

  // Prefer featured projects
  if (other.featured) score += 15;

  // Prefer ongoing/ready_to_move projects
  if (other.status === 'ongoing' || other.status === 'ready_to_move') score += 10;

  // Prefer projects with common configurations
  const currentConfigs = Array.isArray(current.configs) ? current.configs : [];
  const otherConfigs = Array.isArray(other.configs) ? other.configs : [];
  const commonConfigs = currentConfigs.filter((c) => otherConfigs.includes(c)).length;
  if (commonConfigs > 0) score += commonConfigs * 8;

  // Slight boost for projects with similar amenities count
  const currentAmenities = Array.isArray(current.amenities) ? current.amenities : [];
  const otherAmenities = Array.isArray(other.amenities) ? other.amenities : [];
  const amenityDiff = Math.abs(currentAmenities.length - otherAmenities.length);
  if (amenityDiff <= 5) score += 5;

  return score;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RelatedProjects({
  currentProject,
  allProjects,
  maxResults = 3,
  className = '',
}: RelatedProjectsProps) {
  const { open: openConsultation } = useConsultation();

  // Compute related projects
  const relatedProjects = useMemo(() => {
    return allProjects
      .map((project) => ({
        project,
        score: scoreProject(currentProject, project),
      }))
      .filter((item) => item.score > -Infinity)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map((item) => item.project);
  }, [currentProject, allProjects, maxResults]);

  if (relatedProjects.length === 0) {
    return null;
  }

  return (
    <section
      id="related-projects"
      className={[
        'relative border-t border-[#F8F6F1]/6 py-20 sm:py-28',
        className,
      ].join(' ')}
    >
      {/* Ambient gold wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-10 h-[420px] w-[420px] rounded-full opacity-[0.035]"
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
            Explore More
          </span>
          <h2 className="font-serif text-[2rem] leading-[1.15] text-[#F8F6F1] sm:text-[2.6rem]">
            Related <span className="italic text-[#F8F6F1]/55">Projects</span>
          </h2>
          <p className="max-w-xl text-[14px] font-light leading-relaxed text-[#F8F6F1]/40">
            Discover other exceptional properties from our portfolio that match your refined
            taste and investment criteria.
          </p>
        </div>

        {/* ── Grid ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mt-12 grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {relatedProjects.map((project, idx) => (
              <motion.div
                key={project.id}
                variants={itemVariants}
                layout
                exit="exit"
              >
                <ProjectCard project={project} index={idx} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* ── CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_LUXURY, delay: 0.2 }}
          viewport={{ once: true, margin: '-8%' }}
          className="mt-12 flex flex-col items-center justify-center gap-6 text-center"
        >
          <p className="max-w-lg text-[13.5px] font-light leading-relaxed text-[#F8F6F1]/50">
            Want to explore our complete portfolio? Browse all projects or connect with our sales
            team to find your perfect home.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
  <Link
    to="/projects"
    className={[
      'inline-flex items-center gap-2.5 rounded-full border border-[#F8F6F1]/15',
      'px-7 py-3 text-[11px] uppercase tracking-[0.22em]',
      'text-[#F8F6F1]/60 transition-all duration-300',
      'hover:border-[#F8F6F1]/35 hover:text-[#F8F6F1]/85 hover:bg-[#F8F6F1]/5',
    ].join(' ')}
  >
    <span aria-hidden="true">↑</span>
    All Projects
  </Link>

  <button
    type="button"
    onClick={openConsultation}
    className={[
      'inline-flex items-center gap-2.5 rounded-full border border-[#C9A227]/30',
      'bg-[#C9A227]/10 px-7 py-3 text-[11px] uppercase tracking-[0.22em]',
      'text-[#C9A227] transition-all duration-300',
      'hover:bg-[#C9A227]/20 hover:border-[#C9A227]/60',
    ].join(' ')}
  >
    Schedule Consultation
  </button>
</div>

</motion.div>
      </div>
    </section>
  );
}

export default RelatedProjects;