import { motion, AnimatePresence } from 'framer-motion';
import { ProjectCard } from '../../../components/ProjectCard';
import type { Project } from '../../../types/project';

// ---------------------------------------------------------------------------
// Animation constants
// ---------------------------------------------------------------------------

const EASE_LUXURY: [number, number, number, number] = [0.16, 1, 0.3, 1];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
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

interface ProjectsGridProps {
  projects: Project[];
  /** Whether we're still filtering/searching — shows skeleton shimmer */
  loading?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProjectsGrid({ projects, loading = false }: ProjectsGridProps) {

  if (loading) {
    return <ProjectsGridSkeleton />;
  }

  if (projects.length === 0) {
    return <EmptyState />;
  }

  // The first featured project (if any) gets the wide featured layout
  const featuredIdx = projects.findIndex((p) => p.featured);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      <AnimatePresence mode="popLayout">
        {projects.map((project, idx) => {
          const isFeaturedHero = idx === featuredIdx && featuredIdx === 0;

          return (
            <motion.div
              key={project.id}
              variants={itemVariants}
              layout
              exit="exit"
              className={isFeaturedHero ? 'mb-6' : ''}
            >
              <ProjectCard
                project={project}
                index={idx}
                featured={isFeaturedHero}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Standard grid wrapper for non-hero cards */}
      {/* 
        NOTE: This component renders items sequentially.
        ProjectsPage wraps the grid with its own CSS grid layout.
        The featured hero (if idx 0) spans full width via the page's grid,
        and the remaining cards fill the grid columns.
      */}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      {/* Ornamental */}
      <div className="mb-8 flex items-center gap-3">
        <span className="h-px w-12 bg-[#C9A227]/30" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#C9A227]/40" />
        <span className="h-px w-12 bg-[#C9A227]/30" />
      </div>

      <p className="font-serif text-2xl text-[#F8F6F1]/50">No projects found</p>
      <p className="mt-3 text-[13px] font-light text-[#F8F6F1]/25">
        Try adjusting your filters to explore our full portfolio.
      </p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ProjectsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl bg-[#1C1A15] border border-[#F8F6F1]/4"
        >
          <div className="aspect-[4/3] bg-[#F8F6F1]/5 rounded-t-2xl" />
          <div className="p-6 space-y-3">
            <div className="h-2 w-20 rounded bg-[#F8F6F1]/5" />
            <div className="h-5 w-48 rounded bg-[#F8F6F1]/8" />
            <div className="h-2 w-full rounded bg-[#F8F6F1]/4" />
            <div className="h-2 w-3/4 rounded bg-[#F8F6F1]/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProjectsGrid;